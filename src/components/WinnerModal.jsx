import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import "./WinnerModal.css";

/**
 * WinnerModal - Celebratory modal when a player wins
 */
export default function WinnerModal() {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    players,
    winnerIndex,
    isWinnerModalOpen,
    closeWinnerModal,
    resetGame,
  } = useGameStore();

  const winner = winnerIndex !== null ? players[winnerIndex] : null;

  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const dieShape = confetti.shapeFromText({ text: "🎲", scalar: 2 });

    const commonOptions = {
      disableForReducedMotion: true,
      colors: ["#d4af37", "#ffd700", "#f5f5dc", "#b8860b", "#daa520"],
    };

    // Initial burst
    myConfetti({
      ...commonOptions,
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Dice burst
    myConfetti({
      disableForReducedMotion: true,
      particleCount: 15,
      spread: 120,
      origin: { y: 0.5 },
      shapes: [dieShape],
      scalar: 2,
      flat: true,
    });

    // Side cannons
    setTimeout(() => {
      myConfetti({
        ...commonOptions,
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      myConfetti({
        ...commonOptions,
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  };

  // Open/close dialog and trigger confetti
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isWinnerModalOpen && winner) {
      dialog.showModal();
      // Small delay to ensure canvas is rendered
      setTimeout(() => launchConfetti(), 50);
    } else {
      dialog.close();
    }
  }, [isWinnerModalOpen, winner]);

  // Handle clicking outside dialog (backdrop click)
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      closeWinnerModal();
    }
  };

  const handleNewGame = () => {
    if (
      window.confirm(
        "Start a new game?\n\nThis will clear all players and scores.",
      )
    ) {
      resetGame();
    }
  };

  if (!winner) return null;

  // Sort players by score for final standings
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <dialog
      ref={dialogRef}
      className="winner-modal"
      onClick={handleDialogClick}
      aria-labelledby="winner-modal-title"
    >
      <div className="winner-modal__content">
        <button
          onClick={closeWinnerModal}
          className="winner-modal__close-btn"
          aria-label="Close"
        >
          X
        </button>

        <div className="winner-modal__celebration">
          <button
            className="winner-modal__trophy"
            onClick={launchConfetti}
            title="Click for confetti!"
            aria-label="Celebrate with confetti"
          >
            🏆
          </button>
          <h2 id="winner-modal-title" className="winner-modal__title">
            {winner.name} Wins!
          </h2>
          <p className="winner-modal__score">
            {winner.score.toLocaleString()} points
          </p>
        </div>

        <div className="winner-modal__standings">
          <h3>Final Standings</h3>
          <ol className="winner-modal__list">
            {sortedPlayers.map((player, index) => (
              <li
                key={index}
                className={player.name === winner.name ? "winner" : ""}
                aria-label={
                  player.name === winner.name
                    ? `${player.name}, winner`
                    : undefined
                }
              >
                <span className="name">{player.name}</span>
                <span className="score">{player.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </div>

        <button onClick={handleNewGame} className="winner-modal__new-game-btn">
          New Game
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="winner-modal__confetti"
        aria-hidden="true"
      />
    </dialog>
  );
}
