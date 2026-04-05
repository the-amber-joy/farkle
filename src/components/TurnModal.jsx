import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import ScoringPanel from "./ScoringPanel";
import "./TurnModal.css";

/**
 * TurnModal - Modal dialog for entering scores during a player's turn
 */
export default function TurnModal() {
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);

  const {
    players,
    currentPlayerIndex,
    isTurnModalOpen,
    closeTurnModal,
    updateScore,
    nextTurn,
    incrementRolls,
  } = useGameStore();

  const [rollHistory, setRollHistory] = useState([]);
  const [lastPlayerIndex, setLastPlayerIndex] = useState(currentPlayerIndex);

  const currentPlayer = players[currentPlayerIndex];
  const accumulatedPoints = rollHistory.reduce((sum, roll) => sum + roll, 0);

  // Reset local state when player changes
  if (lastPlayerIndex !== currentPlayerIndex) {
    setLastPlayerIndex(currentPlayerIndex);
    setRollHistory([]);
  }

  // Open/close dialog based on store state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isTurnModalOpen) {
      dialog.showModal();
      // Scroll accordion container to top
      scrollRef.current?.scrollTo(0, 0);
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

  const handleScoreOption = (points) => {
    setRollHistory([...rollHistory, points]);
    incrementRolls();
  };

  const handleBank = () => {
    updateScore(currentPlayerIndex, accumulatedPoints);
    setRollHistory([]);
    nextTurn();
  };

  const handleFarkle = () => {
    setRollHistory([]);
    nextTurn();
  };

  if (!currentPlayer) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal-base turn-modal"
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="turn-modal-title"
    >
      <div className="modal-content turn-modal__content">
        <header className="turn-modal__header">
          <h2 id="turn-modal-title">{currentPlayer.name}'s Turn</h2>
          <button
            onClick={closeTurnModal}
            className="modal-close-btn"
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

        <div className="turn-modal__scrollable" ref={scrollRef}>
          <ScoringPanel
            key={`${currentPlayer.name}-${currentPlayer.rolls}`}
            onScore={handleScoreOption}
          />
        </div>

        <div className="turn-modal__footer">
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
      </div>
    </dialog>
  );
}
