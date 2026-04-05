import diceFive from "../assets/dice/dice-five.svg";
import diceFour from "../assets/dice/dice-four.svg";
import diceOne from "../assets/dice/dice-one.svg";
import diceSix from "../assets/dice/dice-six.svg";
import diceThree from "../assets/dice/dice-three.svg";
import diceTwo from "../assets/dice/dice-two.svg";
import "./DiceIcon.css";

const DICE_IMAGES = {
  1: diceOne,
  2: diceTwo,
  3: diceThree,
  4: diceFour,
  5: diceFive,
  6: diceSix,
};

/**
 * DiceIcon - Renders a single die face as an SVG image
 */
export default function DiceIcon({ face, className = "" }) {
  const src = DICE_IMAGES[face];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`Dice showing ${face}`}
      className={`dice-icon ${className}`}
    />
  );
}

/**
 * DiceGroup - Renders multiple dice faces
 * @param {number[]} faces - Array of face values (1-6)
 */
export function DiceGroup({ faces, className = "" }) {
  return (
    <span className={`dice-group ${className}`}>
      {faces.map((face, i) => (
        <DiceIcon key={i} face={face} />
      ))}
    </span>
  );
}
