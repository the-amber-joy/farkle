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
          .find(".turn-container")
          .get()
          .map(function (turnContainer) {
            const $turn = $(turnContainer);
            const rolls = $turn
              .find(".roll-row")
              .get()
              .map(function (row) {
                const $row = $(row);
                return {
                  value: String($row.find(".roll-input").val() || ""),
                  committed: $row.attr("data-committed") === "true",
                };
              });

            return {
              rolls: rolls,
              banked: $turn.attr("data-banked") === "true",
              farkled: $turn.attr("data-farkled") === "true",
              collapsed: $turn.hasClass("collapsed"),
            };
          });

        return {
          name: $playerColumn.find(".player-name").first().text() || "",
          turns: turns,
        };
      });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ players: players, version: 2 }),
      );
    } catch (error) {
      console.error("Unable to save Farkle state", error);
    }
  }

  function migrateOldState(oldState) {
    // Convert old format (turns as individual scores) to new format (turns with rolls)
    if (!oldState || !Array.isArray(oldState.players)) {
      return null;
    }

    return {
      version: 2,
      players: oldState.players.map(function (player) {
        const oldTurns = Array.isArray(player.turns) ? player.turns : [];
        // Each old turn becomes a single-roll banked turn
        const newTurns = oldTurns
          .filter(function (t) {
            return t && t.value && t.value.trim() !== "";
          })
          .map(function (oldTurn) {
            return {
              rolls: [{ value: oldTurn.value, committed: true }],
              banked: true,
              farkled: false,
              collapsed: true,
            };
          });

        // Add an active turn at the end
        newTurns.push({
          rolls: [{ value: "", committed: false }],
          banked: false,
          farkled: false,
          collapsed: false,
        });

        return {
          name: player.name,
          turns: newTurns,
        };
      }),
    };
  }

  function loadState() {
    try {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (!rawState) {
        return false;
      }

      let parsedState = JSON.parse(rawState);
      if (!parsedState || !Array.isArray(parsedState.players)) {
        return false;
      }

      // Migrate old format if needed
      if (!parsedState.version || parsedState.version < 2) {
        parsedState = migrateOldState(parsedState);
        if (!parsedState) {
          return false;
        }
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

  function createPlayerColumn(playerName, turns) {
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

    playerColumn.append(playerNameElement, playerScore, turnsContainer);
    scorebox.append(playerColumn);

    const turnsToRestore = Array.isArray(turns) ? turns : [];

    if (turnsToRestore.length > 0) {
      turnsToRestore.forEach(function (turn) {
        createTurnContainer(turnsContainer[0], playerScore[0], turn);
      });
      ensureActiveTurn(turnsContainer[0], playerScore[0]);
    } else {
      createTurnContainer(turnsContainer[0], playerScore[0]);
    }

    updateCumulativeScore(playerColumn[0]);
    refreshFeatherIcons();
    saveState();
  }

  function addPlayer() {
    const promptedName = prompt("Enter the player's name:");
    createPlayerColumn(promptedName);
  }

  function sanitizeRollValue(value) {
    return value.replace(/\D/g, "").slice(0, 5);
  }

  function calculateTurnSubtotal(turnContainer) {
    let total = 0;
    $(turnContainer)
      .find(".roll-input")
      .each(function () {
        if (this.value !== "") {
          const value = Number(this.value);
          if (!Number.isNaN(value)) {
            total += value;
          }
        }
      });
    return total;
  }

  function updateTurnSubtotal(turnContainer) {
    const $turn = $(turnContainer);
    const subtotal = calculateTurnSubtotal(turnContainer);
    const $subtotalDisplay = $turn.find(".turn-subtotal").first();

    if ($turn.attr("data-farkled") === "true") {
      $subtotalDisplay.text("0").addClass("farkled");
    } else {
      $subtotalDisplay.text(String(subtotal)).removeClass("farkled");
    }
  }

  function updateCumulativeScore(playerColumn) {
    let total = 0;
    $(playerColumn)
      .find(".turn-container")
      .each(function () {
        const $turn = $(this);
        if ($turn.attr("data-banked") === "true") {
          if ($turn.attr("data-farkled") === "true") {
            // Farkled turns add 0
          } else {
            total += calculateTurnSubtotal(this);
          }
        }
      });

    $(playerColumn).find(".cumulative-score").first().text(String(total));
  }

  function ensureActiveTurn(turnsContainer, playerScore) {
    const hasActiveTurn =
      $(turnsContainer).find('.turn-container[data-banked="false"]').length > 0;

    if (!hasActiveTurn) {
      createTurnContainer(turnsContainer, playerScore);
    }
  }

  function ensureDraftRoll(turnContainer, playerScore) {
    const $turn = $(turnContainer);
    if ($turn.attr("data-banked") === "true") {
      return; // Don't add draft rolls to banked turns
    }

    const hasDraft = $turn.find('.roll-row[data-committed="false"]').length > 0;

    if (!hasDraft) {
      addRollInputRow(turnContainer, playerScore);
    }

    updateAddRollButtonVisibility(turnContainer);
  }

  function updateAddRollButtonVisibility(turnContainer) {
    const $turn = $(turnContainer);
    const hasDraft = $turn.find('.roll-row[data-committed="false"]').length > 0;
    const $addRollBtn = $turn.find(".turn-btn-add-roll");

    if (hasDraft) {
      $addRollBtn.hide();
    } else {
      $addRollBtn.show();
    }
  }

  function createTurnContainer(turnsContainer, playerScore, options) {
    const opts = options || {};
    const rolls = Array.isArray(opts.rolls) ? opts.rolls : [];
    const isBanked = Boolean(opts.banked);
    const isFarkled = Boolean(opts.farkled);
    const isCollapsed = Boolean(opts.collapsed);

    const turnContainer = $("<div>", {
      class:
        "turn-container" +
        (isBanked ? "" : " active") +
        (isCollapsed ? " collapsed" : ""),
    })
      .attr("data-banked", isBanked ? "true" : "false")
      .attr("data-farkled", isFarkled ? "true" : "false");

    // Turn header with subtotal and collapse toggle
    const turnHeader = $("<div>", {
      class: "turn-header",
    });

    const subtotalDisplay = $("<span>", {
      class: "turn-subtotal" + (isFarkled ? " farkled" : ""),
      text: "0",
    });

    const toggleButton = $("<button>", {
      type: "button",
      class: "turn-toggle",
      "aria-label": "Toggle turn details",
      html: '<i data-feather="chevron-down"></i>',
    });

    turnHeader.append(subtotalDisplay, toggleButton);

    // Rolls container
    const rollsContainer = $("<div>", {
      class: "turn-rolls",
    });

    // Turn action buttons (Bank, Farkle, Add Roll)
    const actionsBar = $("<div>", {
      class: "turn-actions-bar",
    });

    const bankButton = $("<button>", {
      type: "button",
      class: "turn-btn turn-btn-bank",
      text: "Bank",
    });

    const farkleButton = $("<button>", {
      type: "button",
      class: "turn-btn turn-btn-farkle",
      text: "Farkle",
    });

    const addRollButton = $("<button>", {
      type: "button",
      class: "turn-btn turn-btn-add-roll",
      html: '<i data-feather="plus"></i>',
      "aria-label": "Add roll",
    }).hide(); // Hidden by default, shown only when no draft exists

    actionsBar.append(bankButton, farkleButton, addRollButton);

    turnContainer.append(turnHeader, rollsContainer, actionsBar);
    $(turnsContainer).append(turnContainer);

    // Add rolls
    if (rolls.length > 0) {
      rolls.forEach(function (roll) {
        addRollInputRow(turnContainer[0], playerScore, {
          value: roll && typeof roll.value === "string" ? roll.value : "",
          committed: Boolean(roll && roll.committed),
        });
      });
    }

    if (!isBanked) {
      ensureDraftRoll(turnContainer[0], playerScore);
    }

    updateTurnSubtotal(turnContainer[0]);
    updateAddRollButtonVisibility(turnContainer[0]);
    refreshFeatherIcons();
  }

  function addRollInputRow(turnContainer, playerScore, options) {
    const rowOptions = options || {};
    const $rollsContainer = $(turnContainer).find(".turn-rolls").first();

    const inputRow = $("<div>", {
      class: "roll-row",
    }).attr("data-committed", rowOptions.committed ? "true" : "false");

    const rollInput = $("<input>", {
      type: "text",
      class: "roll-input",
      pattern: "[0-9]{0,5}",
      maxlength: 5,
      placeholder: "Roll score",
      value: sanitizeRollValue(String(rowOptions.value || "")),
    })
      .attr("inputmode", "numeric")
      .attr("enterkeyhint", "next")
      .prop("readOnly", Boolean(rowOptions.committed));

    const editButton = $("<button>", {
      type: "button",
      class: "turn-action roll-edit",
      "aria-label": "Edit roll",
      html: '<i class="edit" data-feather="edit"></i>',
    }).prop("disabled", !rowOptions.committed);

    const deleteButton = $("<button>", {
      type: "button",
      class: "turn-action roll-delete",
      "aria-label": "Delete roll",
      html: '<i class="delete" data-feather="trash-2"></i>',
    });

    const actions = $("<div>", {
      class: "turn-actions",
    }).append(editButton, deleteButton);

    inputRow.append(rollInput, actions);
    $rollsContainer.append(inputRow);
    refreshFeatherIcons();
  }

  function getNextPlayerTurnsContainer(currentTurnsContainer) {
    const $playerColumns = scorebox.find(".player-column");
    const currentColumn = $(currentTurnsContainer).closest(".player-column")[0];

    if (!currentColumn || $playerColumns.length < 2) {
      return null;
    }

    const currentIndex = $playerColumns.get().indexOf(currentColumn);
    if (currentIndex === -1) {
      return null;
    }

    const nextColumn =
      $playerColumns.get()[(currentIndex + 1) % $playerColumns.length];
    return $(nextColumn).find(".turns-container").first()[0];
  }

  function bankTurn(turnContainer) {
    const $turn = $(turnContainer);
    const turnsContainer = $turn.closest(".turns-container")[0];
    const playerColumn = $turn.closest(".player-column")[0];
    const playerScore = $(playerColumn).find(".cumulative-score").first()[0];

    // Commit any uncommitted rolls before banking
    $turn.find('.roll-row[data-committed="false"]').each(function () {
      const $row = $(this);
      const $input = $row.find(".roll-input");
      const sanitized = sanitizeRollValue($input.val());

      if (sanitized === "") {
        // Remove empty uncommitted rolls
        $row.remove();
      } else {
        $input.val(sanitized);
        $input.prop("readOnly", true);
        $row.attr("data-committed", "true");
        $row.find(".roll-edit").prop("disabled", false);
      }
    });

    // Mark turn as banked
    $turn.attr("data-banked", "true");
    $turn.removeClass("active");
    $turn.addClass("collapsed");

    updateTurnSubtotal(turnContainer);
    updateCumulativeScore(playerColumn);

    // Create new turn for next player
    const nextTurnsContainer = getNextPlayerTurnsContainer(turnsContainer);
    if (nextTurnsContainer) {
      const nextPlayerColumn =
        $(nextTurnsContainer).closest(".player-column")[0];
      const nextPlayerScore = $(nextPlayerColumn)
        .find(".cumulative-score")
        .first()[0];
      ensureActiveTurn(nextTurnsContainer, nextPlayerScore);

      // Focus the first input of the next player's active turn
      const nextInput = $(nextTurnsContainer)
        .find(
          '.turn-container[data-banked="false"] .roll-input:not([readonly])',
        )
        .first()[0];
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      // Single player: create new turn for same player
      ensureActiveTurn(turnsContainer, playerScore);
      const nextInput = $(turnsContainer)
        .find(
          '.turn-container[data-banked="false"] .roll-input:not([readonly])',
        )
        .first()[0];
      if (nextInput) {
        nextInput.focus();
      }
    }

    saveState();
  }

  function farkleTurn(turnContainer) {
    const $turn = $(turnContainer);
    const turnsContainer = $turn.closest(".turns-container")[0];
    const playerColumn = $turn.closest(".player-column")[0];
    const playerScore = $(playerColumn).find(".cumulative-score").first()[0];

    // Mark turn as farkled and banked
    $turn.attr("data-banked", "true");
    $turn.attr("data-farkled", "true");
    $turn.removeClass("active");
    $turn.addClass("collapsed");

    updateTurnSubtotal(turnContainer);
    updateCumulativeScore(playerColumn);

    // Create new turn for next player
    const nextTurnsContainer = getNextPlayerTurnsContainer(turnsContainer);
    if (nextTurnsContainer) {
      const nextPlayerColumn =
        $(nextTurnsContainer).closest(".player-column")[0];
      const nextPlayerScore = $(nextPlayerColumn)
        .find(".cumulative-score")
        .first()[0];
      ensureActiveTurn(nextTurnsContainer, nextPlayerScore);

      const nextInput = $(nextTurnsContainer)
        .find(
          '.turn-container[data-banked="false"] .roll-input:not([readonly])',
        )
        .first()[0];
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      // Single player: create new turn for same player
      ensureActiveTurn(turnsContainer, playerScore);
      const nextInput = $(turnsContainer)
        .find(
          '.turn-container[data-banked="false"] .roll-input:not([readonly])',
        )
        .first()[0];
      if (nextInput) {
        nextInput.focus();
      }
    }

    saveState();
  }

  function toggleTurnCollapse(turnContainer) {
    const $turn = $(turnContainer);
    $turn.toggleClass("collapsed");
    saveState();
  }

  function getRowContextFromInput(rollInput) {
    const $rollInput = $(rollInput);
    const inputRow = $rollInput.closest(".roll-row")[0];
    const turnContainer = $rollInput.closest(".turn-container")[0];
    const turnsContainer = $rollInput.closest(".turns-container")[0];

    if (!inputRow || !turnContainer || !turnsContainer) {
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
      turnContainer: turnContainer,
      turnsContainer: turnsContainer,
      playerColumn: playerColumn,
      playerScore: playerScore,
    };
  }

  // Event handlers
  scorebox.on("focus", ".roll-input", function () {
    const column = $(this).closest(".player-column")[0];
    if (column) {
      column.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  });

  scorebox.on("input", ".roll-input", function () {
    const context = getRowContextFromInput(this);
    if (!context) {
      return;
    }

    const sanitized = sanitizeRollValue(this.value);
    if (sanitized !== this.value) {
      this.value = sanitized;
    }

    updateTurnSubtotal(context.turnContainer);
    updateCumulativeScore(context.playerColumn);
    saveState();
  });

  scorebox.on("keydown", ".roll-input", function (event) {
    if (event.key !== "Enter") {
      return;
    }

    const context = getRowContextFromInput(this);
    if (!context) {
      return;
    }

    event.preventDefault();

    const sanitized = sanitizeRollValue(this.value);
    if (sanitized === "") {
      return;
    }

    this.value = sanitized;
    this.readOnly = true;
    context.inputRow.dataset.committed = "true";

    const editButton = $(context.inputRow).find(".roll-edit").first()[0];
    if (editButton) {
      editButton.disabled = false;
    }

    // Add new roll input
    ensureDraftRoll(context.turnContainer, context.playerScore);

    // Focus the new input
    const newestInput = $(context.turnContainer)
      .find(".roll-input:not([readonly])")
      .last()[0];
    if (newestInput && newestInput !== this) {
      newestInput.focus();
    }

    updateTurnSubtotal(context.turnContainer);
    updateCumulativeScore(context.playerColumn);
    saveState();
  });

  scorebox.on("click", ".roll-edit", function () {
    const inputRow = $(this).closest(".roll-row")[0];
    if (!inputRow || inputRow.dataset.committed !== "true") {
      return;
    }

    const rollInput = $(inputRow).find(".roll-input").first()[0];
    if (!rollInput) {
      return;
    }

    rollInput.readOnly = false;
    rollInput.focus();
    rollInput.select();
    saveState();
  });

  scorebox.on("click", ".roll-delete", function () {
    const inputRow = $(this).closest(".roll-row")[0];
    if (!inputRow) {
      return;
    }

    const turnContainer = $(inputRow).closest(".turn-container")[0];
    const playerColumn = $(inputRow).closest(".player-column")[0];
    const playerScore = playerColumn
      ? $(playerColumn).find(".cumulative-score").first()[0]
      : null;

    if (!turnContainer || !playerScore) {
      return;
    }

    inputRow.remove();
    updateTurnSubtotal(turnContainer);
    updateCumulativeScore(playerColumn);

    const $turn = $(turnContainer);
    if ($turn.attr("data-banked") !== "true") {
      ensureDraftRoll(turnContainer, playerScore);

      const lastInput = $(turnContainer).find(".roll-input").last()[0];
      if (lastInput && !lastInput.readOnly) {
        lastInput.focus();
      }
    }

    saveState();
  });

  scorebox.on("click", ".turn-header", function () {
    const turnContainer = $(this).closest(".turn-container")[0];
    if (turnContainer) {
      toggleTurnCollapse(turnContainer);
    }
  });

  scorebox.on("click", ".turn-btn-bank", function (event) {
    event.stopPropagation();
    const turnContainer = $(this).closest(".turn-container")[0];
    if (turnContainer) {
      bankTurn(turnContainer);
    }
  });

  scorebox.on("click", ".turn-btn-farkle", function (event) {
    event.stopPropagation();
    const turnContainer = $(this).closest(".turn-container")[0];
    if (turnContainer) {
      farkleTurn(turnContainer);
    }
  });

  scorebox.on("click", ".turn-btn-add-roll", function (event) {
    event.stopPropagation();
    const turnContainer = $(this).closest(".turn-container")[0];
    const playerColumn = $(turnContainer).closest(".player-column")[0];
    const playerScore = $(playerColumn).find(".cumulative-score").first()[0];

    if (turnContainer && playerScore) {
      addRollInputRow(turnContainer, playerScore);
      updateAddRollButtonVisibility(turnContainer);

      const newInput = $(turnContainer)
        .find(".roll-input:not([readonly])")
        .last()[0];
      if (newInput) {
        newInput.focus();
      }
    }
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
