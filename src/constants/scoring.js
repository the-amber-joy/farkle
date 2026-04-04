/**
 * Farkle scoring constants and configurations
 * Unicode dice faces: ⚀ = 1, ⚁ = 2, ⚂ = 3, ⚃ = 4, ⚄ = 5, ⚅ = 6
 */

// Map die face value to Unicode character
export const DICE_FACES = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

// Helper to create dice display string
const dice = (face, count) => DICE_FACES[face].repeat(count);

/**
 * All scoring combinations grouped by category
 */
export const SCORING_OPTIONS = {
  singles: {
    label: "Singles",
    options: [
      { id: "single-1", dice: dice(1, 1), label: "Single 1", points: 100 },
      { id: "single-5", dice: dice(5, 1), label: "Single 5", points: 50 },
    ],
  },
  threeOfAKind: {
    label: "Three of a Kind",
    options: [
      { id: "three-1s", dice: dice(1, 3), label: "Three 1s", points: 1000 },
      { id: "three-2s", dice: dice(2, 3), label: "Three 2s", points: 200 },
      { id: "three-3s", dice: dice(3, 3), label: "Three 3s", points: 300 },
      { id: "three-4s", dice: dice(4, 3), label: "Three 4s", points: 400 },
      { id: "three-5s", dice: dice(5, 3), label: "Three 5s", points: 500 },
      { id: "three-6s", dice: dice(6, 3), label: "Three 6s", points: 600 },
    ],
  },
  fourOfAKind: {
    label: "Four of a Kind",
    options: [
      { id: "four-1s", dice: dice(1, 4), label: "Four 1s", points: 2000 },
      { id: "four-2s", dice: dice(2, 4), label: "Four 2s", points: 400 },
      { id: "four-3s", dice: dice(3, 4), label: "Four 3s", points: 600 },
      { id: "four-4s", dice: dice(4, 4), label: "Four 4s", points: 800 },
      { id: "four-5s", dice: dice(5, 4), label: "Four 5s", points: 1000 },
      { id: "four-6s", dice: dice(6, 4), label: "Four 6s", points: 1200 },
    ],
  },
  fiveOfAKind: {
    label: "Five of a Kind",
    options: [
      { id: "five-1s", dice: dice(1, 5), label: "Five 1s", points: 3000 },
      { id: "five-2s", dice: dice(2, 5), label: "Five 2s", points: 600 },
      { id: "five-3s", dice: dice(3, 5), label: "Five 3s", points: 900 },
      { id: "five-4s", dice: dice(4, 5), label: "Five 4s", points: 1200 },
      { id: "five-5s", dice: dice(5, 5), label: "Five 5s", points: 1500 },
      { id: "five-6s", dice: dice(6, 5), label: "Five 6s", points: 1800 },
    ],
  },
  sixOfAKind: {
    label: "Six of a Kind",
    options: [
      { id: "six-1s", dice: dice(1, 6), label: "Six 1s", points: 4000 },
      { id: "six-2s", dice: dice(2, 6), label: "Six 2s", points: 800 },
      { id: "six-3s", dice: dice(3, 6), label: "Six 3s", points: 1200 },
      { id: "six-4s", dice: dice(4, 6), label: "Six 4s", points: 1600 },
      { id: "six-5s", dice: dice(5, 6), label: "Six 5s", points: 2000 },
      { id: "six-6s", dice: dice(6, 6), label: "Six 6s", points: 2400 },
    ],
  },
  specials: {
    label: "Special Combinations",
    options: [
      {
        id: "three-pairs",
        dice: `${dice(1, 2)} ${dice(2, 2)} ${dice(3, 2)}`,
        label: "Three Pairs",
        points: 750,
      },
      {
        id: "straight",
        dice: `${DICE_FACES[1]}${DICE_FACES[2]}${DICE_FACES[3]}${DICE_FACES[4]}${DICE_FACES[5]}${DICE_FACES[6]}`,
        label: "Straight",
        points: 1000,
      },
      {
        id: "two-triples",
        dice: `${dice(1, 3)} ${dice(2, 3)}`,
        label: "Two Triples",
        points: 2500,
      },
    ],
  },
};

// Flat array of all scoring options for easy iteration
export const ALL_SCORING_OPTIONS = Object.values(SCORING_OPTIONS).flatMap(
  (category) => category.options,
);
