import confetti from "canvas-confetti";
import { useGameStore } from "../store/gameStore";
import "./PlayerCard.css";

/**
 * PlayerCard - Displays a single player's score card
 *
 * @param {string} name - Player's name
 * @param {number} score - Player's total score
 * @param {boolean} isActive - Whether this player's turn is active
 * @param {boolean} isWinner - Whether this player has won
 */
export default function PlayerCard({ name, score, isActive, isWinner }) {
  const {
    openTurnModal,
    hasTurnStarted,
    isTurnModalOpen,
    winnerIndex,
    openWinnerModal,
    isGameStarted,
  } = useGameStore();

  // Determine button text
  const getButtonText = () => {
    if (hasTurnStarted && !isTurnModalOpen) {
      return "Resume";
    }
    return "Roll!";
  };

  const launchConfetti = () => {
    const dieShape = confetti.shapeFromText({ text: "🎲", scalar: 2 });
    const colors = ["#d4af37", "#ffd700", "#f5f5dc", "#b8860b", "#daa520"];

    confetti({
      disableForReducedMotion: true,
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    confetti({
      disableForReducedMotion: true,
      particleCount: 15,
      spread: 60,
      origin: { y: 0.5 },
      shapes: [dieShape],
      scalar: 2,
      flat: true,
    });

    setTimeout(() => {
      confetti({
        disableForReducedMotion: true,
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        disableForReducedMotion: true,
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 250);
  };

  const cardClasses = [
    "player-card",
    isActive && "player-card--active",
    isWinner && "player-card--winner",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      aria-current={isActive ? "true" : undefined}
      aria-label={
        isWinner
          ? `${name}, winner with ${score.toLocaleString()} points`
          : undefined
      }
    >
      <h3 className="player-name">
        {isWinner && (
          <button
            className="winner-trophy"
            onClick={launchConfetti}
            title="Click for confetti!"
            aria-label="Celebrate with confetti"
          >
            🏆
          </button>
        )}
        {name}
      </h3>
      <p className="cumulative-score">{score.toLocaleString()}</p>

      {isGameStarted && isActive && winnerIndex === null && (
        <button className="roll-btn" onClick={openTurnModal}>
          {getButtonText()}
        </button>
      )}

      {isWinner && (
        <button className="winner-btn" onClick={openWinnerModal}>
          WINNER
        </button>
      )}
    </div>
  );
}
