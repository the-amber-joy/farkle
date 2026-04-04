import "./ScoreButton.css";

/**
 * ScoreButton - A button displaying a scoring dice combination
 * Shows dice faces, text label, and point value
 */
export default function ScoreButton({ dice, label, points, onClick }) {
  return (
    <button
      type="button"
      className="score-button"
      onClick={() => onClick(points)}
      aria-label={`${label} for ${points} points`}
    >
      <span className="score-button__dice">{dice}</span>
      <span className="score-button__info">
        <span className="score-button__label">{label}</span>
        <span className="score-button__points">+{points}</span>
      </span>
    </button>
  );
}
