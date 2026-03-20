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

    $("<script>", {
      src: "https://unpkg.com/feather-icons/dist/feather.min.js",
      async: true,
    })
      .on("load", function () {
        if (typeof onReady === "function") {
          onReady();
        }
      })
      .on("error", function () {
        console.error("Unable to load Feather Icons from fallback CDN");
      })
      .appendTo("head");
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
    const players = scorebox
      .find(".player-column")
      .get()
      .map(function (playerColumn) {
        const $playerColumn = $(playerColumn);
        const turns = $playerColumn
          .find(".turn-row")
          .get()
          .map(function (row) {
            const $row = $(row);
            const inputValue = $row.find(".turn-input").val() || "";

            return {
              value: String(inputValue),
              committed: $row.attr("data-committed") === "true",
            };
          });

        return {
          name: $playerColumn.find(".player-name").first().text() || "",
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
    let total = 0;

    $(turnsContainer)
      .find(".turn-input")
      .each(function () {
        if (this.value !== "") {
          const value = Number(this.value);
          if (!Number.isNaN(value)) {
            total += value;
          }
        }
      });

    $(playerScore).text(String(total));
  }

  function ensureDraftRow(turnsContainer, playerScore) {
    const hasDraft =
      $(turnsContainer).find('.turn-row[data-committed="false"]').length > 0;

    if (!hasDraft) {
      addTurnInputRow(turnsContainer, playerScore);
    }
  }

  function getNextPlayerAvailableInput(currentTurnsContainer) {
    const $playerColumns = scorebox.find(".player-column");
    const currentColumn = $(currentTurnsContainer).closest(".player-column")[0];

    if (!currentColumn || $playerColumns.length < 2) {
      return null;
    }

    const currentIndex = $playerColumns.get().indexOf(currentColumn);
    if (currentIndex === -1) {
      return null;
    }

    for (let offset = 1; offset < $playerColumns.length; offset += 1) {
      const nextColumn =
        $playerColumns.get()[(currentIndex + offset) % $playerColumns.length];
      const nextInput = $(nextColumn)
        .find(".turn-input:not([readonly])")
        .first()[0];

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
    const $turnInput = $(turnInput);
    const inputRow = $turnInput.closest(".turn-row")[0];
    const turnsContainer = $turnInput.closest(".turns-container")[0];

    if (!inputRow || !turnsContainer) {
      return null;
    }

    const playerColumn = $(turnsContainer).closest(".player-column")[0];
    if (!playerColumn) {
      return null;
    }

    const playerScore = $(playerColumn).find(".cumulative-score").first()[0];
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
    const column = $(this).closest(".player-column")[0];
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

    const editButton = $(context.inputRow).find(".turn-edit").first()[0];
    if (editButton) {
      editButton.disabled = false;
    }

    if (context.inputRow.nextElementSibling === null) {
      addTurnInputRow(context.turnsContainer, context.playerScore);
    }

    const newestInput = $(context.turnsContainer).find(".turn-input").last()[0];

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
    const inputRow = $(this).closest(".turn-row")[0];
    if (!inputRow || inputRow.dataset.committed !== "true") {
      return;
    }

    const turnInput = $(inputRow).find(".turn-input").first()[0];
    if (!turnInput) {
      return;
    }

    turnInput.readOnly = false;
    turnInput.focus();
    turnInput.select();
    saveState();
  });

  scorebox.on("click", ".turn-delete", function () {
    const inputRow = $(this).closest(".turn-row")[0];
    if (!inputRow) {
      return;
    }

    const turnsContainer = $(inputRow).closest(".turns-container")[0];
    const playerColumn = $(inputRow).closest(".player-column")[0];
    const playerScore = playerColumn
      ? $(playerColumn).find(".cumulative-score").first()[0]
      : null;

    if (!turnsContainer || !playerScore) {
      return;
    }

    inputRow.remove();
    updatePlayerScore(turnsContainer, playerScore);
    ensureDraftRow(turnsContainer, playerScore);

    const lastInput = $(turnsContainer).find(".turn-input").last()[0];
    if (lastInput && !lastInput.readOnly) {
      lastInput.focus();
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

  // Dark mode toggle
  const themeToggle = $("#themeToggle");
  const THEME_KEY = "farkleTheme";

  function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;

    if (shouldBeDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.text("☀️");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.text("🌙");
    }
  }

  themeToggle.on("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    if (newTheme === "dark") {
      themeToggle.text("☀️");
    } else {
      themeToggle.text("🌙");
    }
  });

  initializeTheme();
});
