document.addEventListener("DOMContentLoaded", function () {
  const addPlayerButton = document.getElementById("addPlayer");
  const newGameButton = document.getElementById("newGame");
  const scorebox = document.getElementById("scores");
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
    const players = Array.from(scorebox.querySelectorAll(".player-column")).map(
      function (playerColumn) {
        const playerNameElement = playerColumn.querySelector(".player-name");
        const turns = Array.from(
          playerColumn.querySelectorAll(".turn-row"),
        ).map(function (row) {
          const input = row.querySelector(".turn-input");
          return {
            value: input ? input.value : "",
            committed: row.dataset.committed === "true",
          };
        });

        return {
          name: playerNameElement ? playerNameElement.textContent : "",
          turns: turns,
        };
      },
    );

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

    scorebox.innerHTML = "";
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

    const playerColumn = document.createElement("div");
    playerColumn.className = "player-column";
    playerColumn.id = `player${playerCount}`;

    const playerNameElement = document.createElement("h2");
    playerNameElement.className = "player-name";
    playerNameElement.textContent = playerName || `Player ${playerCount}`;

    const playerScore = document.createElement("p");
    playerScore.className = "cumulative-score";
    playerScore.textContent = "0";

    const turnsContainer = document.createElement("div");
    turnsContainer.className = "turns-container";

    const rowsToRestore = Array.isArray(turnRows) ? turnRows : [];

    if (rowsToRestore.length > 0) {
      rowsToRestore.forEach(function (row) {
        addTurnInputRow(turnsContainer, playerScore, {
          value: row && typeof row.value === "string" ? row.value : "",
          committed: Boolean(row && row.committed),
        });
      });
      ensureDraftRow(turnsContainer, playerScore);
    } else {
      addTurnInputRow(turnsContainer, playerScore);
    }

    updatePlayerScore(turnsContainer, playerScore);

    playerColumn.appendChild(playerNameElement);
    playerColumn.appendChild(playerScore);
    playerColumn.appendChild(turnsContainer);
    scorebox.appendChild(playerColumn);
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
      scorebox.querySelectorAll(".player-column"),
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

    const inputRow = document.createElement("div");
    inputRow.className = "turn-row";
    inputRow.dataset.committed = rowOptions.committed ? "true" : "false";

    const turnInput = document.createElement("input");
    turnInput.type = "search";
    turnInput.className = "turn-input";
    turnInput.pattern = "[0-9]{0,5}";
    turnInput.inputMode = "numeric";
    turnInput.maxLength = 5;
    turnInput.placeholder = "Turn score";
    turnInput.value = sanitizeTurnValue(String(rowOptions.value || ""));
    turnInput.readOnly = Boolean(rowOptions.committed);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "turn-action turn-edit";
    editButton.setAttribute("aria-label", "Edit score");
    editButton.innerHTML = '<i class="edit" data-feather="edit"></i>';
    editButton.disabled = !rowOptions.committed;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "turn-action turn-delete";
    deleteButton.setAttribute("aria-label", "Delete score");
    deleteButton.innerHTML = '<i class="delete" data-feather="trash-2"></i>';

    const actions = document.createElement("div");
    actions.className = "turn-actions";
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    turnInput.addEventListener("input", function () {
      const sanitized = sanitizeTurnValue(turnInput.value);
      if (sanitized !== turnInput.value) {
        turnInput.value = sanitized;
      }

      updatePlayerScore(turnsContainer, playerScore);
      saveState();
    });

    turnInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();

      const wasDraftRow = inputRow.dataset.committed === "false";
      const wasLastRow = inputRow.nextElementSibling === null;

      const sanitized = sanitizeTurnValue(turnInput.value);
      if (sanitized === "") {
        return;
      }

      turnInput.value = sanitized;
      turnInput.readOnly = true;
      inputRow.dataset.committed = "true";
      editButton.disabled = false;

      if (inputRow.nextElementSibling === null) {
        addTurnInputRow(turnsContainer, playerScore);
      }

      const turnInputs = turnsContainer.querySelectorAll(".turn-input");
      const newestInput = turnInputs[turnInputs.length - 1];

      if (wasDraftRow && wasLastRow) {
        const nextPlayerInput = getNextPlayerAvailableInput(turnsContainer);
        if (nextPlayerInput) {
          nextPlayerInput.focus();
          updatePlayerScore(turnsContainer, playerScore);
          return;
        }
      }

      if (newestInput && newestInput !== turnInput) {
        newestInput.focus();
      }

      updatePlayerScore(turnsContainer, playerScore);
      saveState();
    });

    editButton.addEventListener("click", function () {
      if (inputRow.dataset.committed !== "true") {
        return;
      }

      turnInput.readOnly = false;
      turnInput.focus();
      turnInput.select();
      saveState();
    });

    deleteButton.addEventListener("click", function () {
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

    inputRow.appendChild(turnInput);
    inputRow.appendChild(actions);
    turnsContainer.appendChild(inputRow);
    refreshFeatherIcons();
  }

  addPlayerButton.addEventListener("click", addPlayer);
  newGameButton.addEventListener("click", startNewGame);

  if (!loadState()) {
    saveState();
  }

  refreshFeatherIcons();
  window.addEventListener("load", function () {
    refreshFeatherIcons();
  });
});
