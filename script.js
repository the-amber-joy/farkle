$(function () {
  const addPlayerButton = $("#addPlayer");
  const newGameButton = $("#newGame");
  const scorebox = $("#scores");
  const STORAGE_KEY = "farkleScoreboardState";
  let playerCount = 0;
  let featherFallbackRequested = false;

  function loadFeatherFallback(onReady) {
    if (window.feather && typeof window.feather.replace === "function") {
      if (typeof onReady === "function") {
        onReady();
      }
      return;
    }

    if (featherFallbackRequested) {
      return;
    }

    featherFallbackRequested = true;

    const fallbackScript = document.createElement("script");
    fallbackScript.src = "https://unpkg.com/feather-icons/dist/feather.min.js";
    fallbackScript.async = true;
    fallbackScript.onload = function () {
      if (typeof onReady === "function") {
        onReady();
      }
    };
    fallbackScript.onerror = function () {
      console.error("Unable to load Feather Icons from fallback CDN");
    };
    document.head.appendChild(fallbackScript);
  }

  function refreshFeatherIcons(retries) {
    const remainingRetries = typeof retries === "number" ? retries : 20;

    if (window.feather && typeof window.feather.replace === "function") {
      window.feather.replace();
      return;
    }

    if (remainingRetries === 20) {
      loadFeatherFallback(function () {
        refreshFeatherIcons(10);
      });
    }

    if (remainingRetries > 0) {
      setTimeout(function () {
        refreshFeatherIcons(remainingRetries - 1);
      }, 75);
    }
  }

  function saveState() {
    const players = Array.from(
      scorebox[0].querySelectorAll(".player-column"),
    ).map(function (playerColumn) {
      const playerNameElement = playerColumn.querySelector(".player-name");
      const turns = Array.from(playerColumn.querySelectorAll(".turn-row")).map(
        function (row) {
          const input = row.querySelector(".turn-input");
          return {
            value: input ? input.value : "",
            committed: row.dataset.committed === "true",
          };
        },
      );

      return {
        name: playerNameElement ? playerNameElement.textContent : "",
        turns: turns,
      };
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players: players }));
    } catch (error) {
      console.error("Unable to save Farkle state", error);
    }
  }

  function loadState() {
    try {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (!rawState) {
        return false;
      }

      const parsedState = JSON.parse(rawState);
      if (!parsedState || !Array.isArray(parsedState.players)) {
        return false;
      }

      parsedState.players.forEach(function (player) {
        const playerName =
          typeof player.name === "string" && player.name.trim() !== ""
            ? player.name
            : null;
        const turns = Array.isArray(player.turns) ? player.turns : [];

        createPlayerColumn(playerName, turns);
      });

      return parsedState.players.length > 0;
    } catch (error) {
      console.error("Unable to load Farkle state", error);
      return false;
    }
  }

  function startNewGame() {
    const confirmed = window.confirm(
      "Clear all players and scores and start a new game?",
    );
    if (!confirmed) {
      return;
    }

    scorebox.empty();
    playerCount = 0;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear Farkle state", error);
    }

    saveState();
  }

  function createPlayerColumn(playerName, turnRows) {
    playerCount += 1;

    const playerLabel = playerName || `Player ${playerCount}`;
    const playerColumn = $("<div>", {
      class: "player-column",
      id: `player${playerCount}`,
    });

    const playerNameElement = $("<h2>", {
      class: "player-name",
      text: playerLabel,
    });

    const playerScore = $("<p>", {
      class: "cumulative-score",
      text: "0",
    });

    const turnsContainer = $("<div>", {
      class: "turns-container",
    });

    const rowsToRestore = Array.isArray(turnRows) ? turnRows : [];

    if (rowsToRestore.length > 0) {
      rowsToRestore.forEach(function (row) {
        addTurnInputRow(turnsContainer[0], playerScore[0], {
          value: row && typeof row.value === "string" ? row.value : "",
          committed: Boolean(row && row.committed),
        });
      });
      ensureDraftRow(turnsContainer[0], playerScore[0]);
    } else {
      addTurnInputRow(turnsContainer[0], playerScore[0]);
    }

    updatePlayerScore(turnsContainer[0], playerScore[0]);

    playerColumn.append(playerNameElement, playerScore, turnsContainer);
    scorebox.append(playerColumn);
    refreshFeatherIcons();
    saveState();
  }

  function addPlayer() {
    const promptedName = prompt("Enter the player's name:");
    createPlayerColumn(promptedName);
  }

  function sanitizeTurnValue(value) {
    return value.replace(/\D/g, "").slice(0, 5);
  }

  function updatePlayerScore(turnsContainer, playerScore) {
    const inputs = turnsContainer.querySelectorAll(".turn-input");
    let total = 0;

    inputs.forEach(function (input) {
      if (input.value !== "") {
        const value = Number(input.value);
        if (!Number.isNaN(value)) {
          total += value;
        }
      }
    });

    playerScore.textContent = String(total);
  }

  function ensureDraftRow(turnsContainer, playerScore) {
    const rows = turnsContainer.querySelectorAll(".turn-row");
    const hasDraft = Array.from(rows).some(function (row) {
      return row.dataset.committed === "false";
    });

    if (!hasDraft) {
      addTurnInputRow(turnsContainer, playerScore);
    }
  }

  function getNextPlayerAvailableInput(currentTurnsContainer) {
    const playerColumns = Array.from(
      scorebox[0].querySelectorAll(".player-column"),
    );
    const currentColumn = currentTurnsContainer.closest(".player-column");

    if (!currentColumn || playerColumns.length < 2) {
      return null;
    }

    const currentIndex = playerColumns.indexOf(currentColumn);
    if (currentIndex === -1) {
      return null;
    }

    for (let offset = 1; offset < playerColumns.length; offset += 1) {
      const nextColumn =
        playerColumns[(currentIndex + offset) % playerColumns.length];
      const nextInput = nextColumn.querySelector(".turn-input:not([readonly])");

      if (nextInput) {
        return nextInput;
      }
    }

    return null;
  }

  function addTurnInputRow(turnsContainer, playerScore, options) {
    const rowOptions = options || {};

    const inputRow = $("<div>", {
      class: "turn-row",
    }).attr("data-committed", rowOptions.committed ? "true" : "false");

    const turnInput = $("<input>", {
      type: "search",
      class: "turn-input",
      pattern: "[0-9]{0,5}",
      maxlength: 5,
      placeholder: "Turn score",
      value: sanitizeTurnValue(String(rowOptions.value || "")),
    })
      .attr("inputmode", "numeric")
      .prop("readOnly", Boolean(rowOptions.committed));

    const editButton = $("<button>", {
      type: "button",
      class: "turn-action turn-edit",
      "aria-label": "Edit score",
      html: '<i class="edit" data-feather="edit"></i>',
    }).prop("disabled", !rowOptions.committed);

    const deleteButton = $("<button>", {
      type: "button",
      class: "turn-action turn-delete",
      "aria-label": "Delete score",
      html: '<i class="delete" data-feather="trash-2"></i>',
    });

    const actions = $("<div>", {
      class: "turn-actions",
    }).append(editButton, deleteButton);

    inputRow.append(turnInput, actions);
    $(turnsContainer).append(inputRow);
    refreshFeatherIcons();
  }

  function getRowContextFromInput(turnInput) {
    const inputRow = turnInput.closest(".turn-row");
    const turnsContainer = turnInput.closest(".turns-container");

    if (!inputRow || !turnsContainer) {
      return null;
    }

    const playerColumn = turnsContainer.closest(".player-column");
    if (!playerColumn) {
      return null;
    }

    const playerScore = playerColumn.querySelector(".cumulative-score");
    if (!playerScore) {
      return null;
    }

    return {
      inputRow: inputRow,
      turnsContainer: turnsContainer,
      playerScore: playerScore,
    };
  }

  scorebox.on("focus", ".turn-input", function () {
    const column = this.closest(".player-column");
    if (column) {
      column.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  });

  scorebox.on("input", ".turn-input", function () {
    const context = getRowContextFromInput(this);
    if (!context) {
      return;
    }

    const sanitized = sanitizeTurnValue(this.value);
    if (sanitized !== this.value) {
      this.value = sanitized;
    }

    updatePlayerScore(context.turnsContainer, context.playerScore);
    saveState();
  });

  scorebox.on("keydown", ".turn-input", function (event) {
    if (event.key !== "Enter") {
      return;
    }

    const context = getRowContextFromInput(this);
    if (!context) {
      return;
    }

    event.preventDefault();

    const wasDraftRow = context.inputRow.dataset.committed === "false";
    const wasLastRow = context.inputRow.nextElementSibling === null;

    const sanitized = sanitizeTurnValue(this.value);
    if (sanitized === "") {
      return;
    }

    this.value = sanitized;
    this.readOnly = true;
    context.inputRow.dataset.committed = "true";

    const editButton = context.inputRow.querySelector(".turn-edit");
    if (editButton) {
      editButton.disabled = false;
    }

    if (context.inputRow.nextElementSibling === null) {
      addTurnInputRow(context.turnsContainer, context.playerScore);
    }

    const turnInputs = context.turnsContainer.querySelectorAll(".turn-input");
    const newestInput = turnInputs[turnInputs.length - 1];

    if (wasDraftRow && wasLastRow) {
      const nextPlayerInput = getNextPlayerAvailableInput(
        context.turnsContainer,
      );
      if (nextPlayerInput) {
        nextPlayerInput.focus();
        updatePlayerScore(context.turnsContainer, context.playerScore);
        return;
      }
    }

    if (newestInput && newestInput !== this) {
      newestInput.focus();
    }

    updatePlayerScore(context.turnsContainer, context.playerScore);
    saveState();
  });

  scorebox.on("click", ".turn-edit", function () {
    const inputRow = this.closest(".turn-row");
    if (!inputRow || inputRow.dataset.committed !== "true") {
      return;
    }

    const turnInput = inputRow.querySelector(".turn-input");
    if (!turnInput) {
      return;
    }

    turnInput.readOnly = false;
    turnInput.focus();
    turnInput.select();
    saveState();
  });

  scorebox.on("click", ".turn-delete", function () {
    const inputRow = this.closest(".turn-row");
    if (!inputRow) {
      return;
    }

    const turnsContainer = inputRow.closest(".turns-container");
    const playerColumn = inputRow.closest(".player-column");
    const playerScore = playerColumn
      ? playerColumn.querySelector(".cumulative-score")
      : null;

    if (!turnsContainer || !playerScore) {
      return;
    }

    inputRow.remove();
    updatePlayerScore(turnsContainer, playerScore);
    ensureDraftRow(turnsContainer, playerScore);

    const lastRow = turnsContainer.lastElementChild;
    if (lastRow) {
      const lastInput = lastRow.querySelector(".turn-input");
      if (lastInput && !lastInput.readOnly) {
        lastInput.focus();
      }
    }

    saveState();
  });

  addPlayerButton.on("click", addPlayer);
  newGameButton.on("click", startNewGame);

  if (!loadState()) {
    saveState();
  }

  refreshFeatherIcons();
  $(window).on("load", function () {
    refreshFeatherIcons();
  });
});
