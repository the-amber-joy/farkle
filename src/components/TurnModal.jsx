import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import "./TurnModal.css";

/**
 * TurnModal - Modal dialog for entering scores during a player's turn
 */
export default function TurnModal() {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  const {
    players,
    currentPlayerIndex,
    isTurnModalOpen,
    closeTurnModal,
    updateScore,
    nextTurn,
  } = useGameStore();

  const [rollHistory, setRollHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [lastPlayerIndex, setLastPlayerIndex] = useState(currentPlayerIndex);

  const currentPlayer = players[currentPlayerIndex];
  const accumulatedPoints = rollHistory.reduce((sum, roll) => sum + roll, 0);

  // Reset local state when player changes
  if (lastPlayerIndex !== currentPlayerIndex) {
    setLastPlayerIndex(currentPlayerIndex);
    setRollHistory([]);
    setCurrentInput("");
  }

  // Open/close dialog based on store state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isTurnModalOpen) {
      dialog.showModal();
      inputRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isTurnModalOpen]);

  // Handle clicking outside dialog (backdrop click)
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      closeTurnModal();
    }
  };

  // Handle Escape key (minimize)
  const handleCancel = (e) => {
    e.preventDefault();
    closeTurnModal();
  };

  const handleSubmitRoll = () => {
    const points = parseInt(currentInput, 10);
    if (!isNaN(points) && points >= 0) {
      setRollHistory([...rollHistory, points]);
      setCurrentInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitRoll();
    }
  };

  const handleBank = () => {
    updateScore(currentPlayerIndex, accumulatedPoints);
    setRollHistory([]);
    setCurrentInput("");
    nextTurn();
  };

  const handleFarkle = () => {
    setRollHistory([]);
    setCurrentInput("");
    nextTurn();
  };

  if (!currentPlayer) return null;

  return (
    <dialog
      ref={dialogRef}
      className="turn-modal"
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="turn-modal-title"
    >
      <div className="turn-modal__content">
        <header className="turn-modal__header">
          <h2 id="turn-modal-title">{currentPlayer.name}'s Turn</h2>
          <button
            onClick={closeTurnModal}
            className="turn-modal__minimize-btn"
            aria-label="Minimize"
          >
            −
          </button>
        </header>

        <div className="turn-modal__accumulated">
          <span className="label">Accumulated Points</span>
          <span className="points">{accumulatedPoints.toLocaleString()}</span>
        </div>

        {rollHistory.length > 0 && (
          <div className="turn-modal__history">
            <span className="label">Rolls this turn:</span>
            <div className="rolls">
              {rollHistory.map((roll, i) => (
                <span key={i} className="roll">
                  {roll}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="turn-modal__input-group">
          <label htmlFor="roll-score-input" className="visually-hidden">
            Enter roll score
          </label>
          <input
            ref={inputRef}
            id="roll-score-input"
            type="number"
            min="0"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter roll score"
            className="turn-modal__input"
          />
          <button onClick={handleSubmitRoll} className="turn-modal__add-btn">
            Add
          </button>
        </div>

        <div className="turn-modal__actions">
          <button
            onClick={handleBank}
            className="turn-modal__btn turn-modal__btn--bank"
            disabled={accumulatedPoints === 0}
          >
            Bank{" "}
            {accumulatedPoints > 0 ? accumulatedPoints.toLocaleString() : ""}{" "}
            Points
          </button>
          <button
            onClick={handleFarkle}
            className="turn-modal__btn turn-modal__btn--farkle"
          >
            Farkle!
          </button>
        </div>
      </div>
    </dialog>
  );
}
