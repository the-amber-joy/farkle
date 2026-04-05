import confetti from "canvas-confetti";
import { useRef, useState } from "react";
import { getLoserEncouragements } from "../constants/encouragements";
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
  const [overlayText, setOverlayText] = useState("");
  const [overlayKey, setOverlayKey] = useState(0);
  const overlayTimeoutRef = useRef(null);

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
      origin: { y: 1 },
      colors,
    });

    confetti({
      disableForReducedMotion: true,
      particleCount: 15,
      spread: 60,
      origin: { y: 1 },
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
        origin: { x: 0, y: 1 },
        colors,
      });
      confetti({
        disableForReducedMotion: true,
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors,
      });
    }, 250);
  };

  const launchSadConfetti = () => {
    const sadEmojis = ["😢", "😭", "💔", "😿", "🥺"];
    const encouragements = getLoserEncouragements(name);
    const randomLine =
      encouragements[Math.floor(Math.random() * encouragements.length)];

    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
    }

    setOverlayText(randomLine);
    setOverlayKey((value) => value + 1);

    overlayTimeoutRef.current = setTimeout(() => {
      setOverlayText("");
      overlayTimeoutRef.current = null;
    }, 3000);

    // Snow effect with sad emojis
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      // Only spawn ~15 times per second instead of every frame
      if (Math.random() < 0.25) {
        const randomEmoji =
          sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
        const emojiShape = confetti.shapeFromText({
          text: randomEmoji,
          scalar: 2,
        });

        confetti({
          disableForReducedMotion: true,
          particleCount: 1,
          startVelocity: 0,
          ticks: 400,
          origin: { x: Math.random(), y: -0.1 },
          shapes: [emojiShape],
          scalar: 2,
          drift: Math.random() - 0.5,
          gravity: 1.2,
          flat: true,
        });
      }

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleCardClick = () => {
    if (winnerIndex !== null && !isWinner) {
      launchSadConfetti();
    }
  };

  const cardClasses = [
    "player-card",
    isActive && "player-card--active",
    isWinner && "player-card--winner",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {overlayText && (
        <div
          key={overlayKey}
          className="loser-encouragement-overlay"
          aria-live="polite"
        >
          {overlayText}
        </div>
      )}

      <div
        className={cardClasses}
        onClick={handleCardClick}
        style={
          winnerIndex !== null && !isWinner ? { cursor: "pointer" } : undefined
        }
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
    </>
  );
}
