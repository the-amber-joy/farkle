import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import ConfirmDialog from "./ConfirmDialog";
import "./SettingsModal.css";

/**
 * SettingsModal - Edit players during the game
 */
export default function SettingsModal() {
  const dialogRef = useRef(null);

  const {
    players,
    currentPlayerIndex,
    isSettingsModalOpen,
    closeSettingsModal,
    updatePlayers,
    resetGame,
  } = useGameStore();

  // Local state for editing - initialize from players
  const [editedPlayers, setEditedPlayers] = useState(() => [...players]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showRemoveLastConfirm, setShowRemoveLastConfirm] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);

  // Open/close dialog - use flushSync to set state before showing modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isSettingsModalOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isSettingsModalOpen]);

  // Reset local state when players prop changes and modal opens
  // Using key prop on component instead - see App.jsx

  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      closeSettingsModal();
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    closeSettingsModal();
  };

  const handleNameChange = (index, newName) => {
    setEditedPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? { ...player, name: newName } : player,
      ),
    );
  };

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (trimmed) {
      setEditedPlayers((prev) => [
        ...prev,
        { name: trimmed, score: 0, rolls: 0 },
      ]);
      setNewPlayerName("");
    }
  };

  const handleAddPlayerKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  const handleRemovePlayer = (index) => {
    // If this is the last player, show confirm dialog for game reset
    if (editedPlayers.length === 1) {
      setShowRemoveLastConfirm(true);
      return;
    }
    // Show confirm dialog for removing player
    setPlayerToRemove(index);
  };

  const handleConfirmRemovePlayer = () => {
    if (playerToRemove !== null) {
      removePlayer(playerToRemove);
      setPlayerToRemove(null);
    }
  };

  const removePlayer = (index) => {
    setEditedPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmRemoveLast = () => {
    // Removing the last player resets the game
    setShowRemoveLastConfirm(false);
    resetGame();
  };

  const handleSave = () => {
    // Check if current player was removed
    const currentPlayerName = players[currentPlayerIndex]?.name;
    const currentPlayerStillExists = editedPlayers.some(
      (p) => p.name === currentPlayerName,
    );
    const removedCurrentPlayer = !currentPlayerStillExists;

    updatePlayers(editedPlayers, removedCurrentPlayer);
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className="modal-base modal-safe-viewport settings-modal"
        onClick={handleDialogClick}
        onCancel={handleCancel}
        aria-labelledby="settings-modal-title"
      >
        <div className="modal-content modal-content-safe-bottom settings-modal__content">
          <header className="settings-modal__header">
            <h2 id="settings-modal-title">Settings</h2>
            <button
              onClick={closeSettingsModal}
              className="modal-close-btn"
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="settings-modal__players">
            <h3>Players</h3>
            <ul className="settings-modal__list">
              {editedPlayers.map((player, index) => (
                <li key={index} className="settings-modal__player">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="settings-modal__input"
                    aria-label={`Player ${index + 1} name`}
                  />
                  <span className="settings-modal__score">
                    {player.score.toLocaleString()} pts
                  </span>
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="settings-modal__remove-btn"
                    aria-label={`Remove ${player.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className="settings-modal__add">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={handleAddPlayerKeyDown}
                placeholder="Add new player..."
                className="settings-modal__input"
                aria-label="New player name"
              />
              <button
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim()}
                className="settings-modal__add-btn"
              >
                Add
              </button>
            </div>
          </div>

          <div className="settings-modal__actions">
            <button
              onClick={closeSettingsModal}
              className="settings-modal__btn settings-modal__btn--cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={editedPlayers.length === 0}
              className="settings-modal__btn settings-modal__btn--save"
            >
              Save Changes
            </button>
          </div>
        </div>
      </dialog>

      <ConfirmDialog
        isOpen={showRemoveLastConfirm}
        title="Start Over?"
        message="Removing the last player will clear all scores and start a new game. This action cannot be undone."
        confirmText="Start Over"
        cancelText="Cancel"
        onConfirm={handleConfirmRemoveLast}
        onCancel={() => setShowRemoveLastConfirm(false)}
        danger
      />

      <ConfirmDialog
        isOpen={playerToRemove !== null}
        title="Remove Player?"
        message={`Are you sure you want to remove ${editedPlayers[playerToRemove]?.name || "this player"}?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirmRemovePlayer}
        onCancel={() => setPlayerToRemove(null)}
        danger
      />
    </>
  );
}
