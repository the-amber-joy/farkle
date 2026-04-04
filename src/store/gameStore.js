import { create } from "zustand";
import { persist } from "zustand/middleware";

const WINNING_SCORE = 10000;

export const useGameStore = create(
  persist(
    (set, get) => ({
      players: [],
      currentPlayerIndex: 0,
      isGameStarted: false,
      isTurnModalOpen: false,
      hasTurnStarted: false,
      winnerIndex: null,
      isWinnerModalOpen: false,

      // Add a new player to the game
      addPlayer: (name) =>
        set((state) => ({
          players: [...state.players, { name, score: 0 }],
        })),

      // Start the game (no more adding players)
      startGame: () => set({ isGameStarted: true }),

      // Update a player's score and check for winner
      updateScore: (index, points) => {
        const state = get();
        const newScore = state.players[index].score + points;
        const hasWon = newScore >= WINNING_SCORE;

        set({
          players: state.players.map((player, i) =>
            i === index ? { ...player, score: newScore } : player,
          ),
          winnerIndex: hasWon ? index : state.winnerIndex,
          isWinnerModalOpen: hasWon ? true : state.isWinnerModalOpen,
        });
      },

      // Move to the next player's turn (unless there's a winner)
      nextTurn: () =>
        set((state) => {
          // Don't advance if there's a winner
          if (state.winnerIndex !== null) {
            return {
              isTurnModalOpen: false,
              hasTurnStarted: false,
            };
          }
          return {
            currentPlayerIndex:
              (state.currentPlayerIndex + 1) % state.players.length,
            isTurnModalOpen: false,
            hasTurnStarted: false,
          };
        }),

      // Set the current player index directly
      setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),

      // Open/close the turn modal
      openTurnModal: () => set({ isTurnModalOpen: true, hasTurnStarted: true }),
      closeTurnModal: () => set({ isTurnModalOpen: false }),

      // Winner modal controls
      openWinnerModal: () => set({ isWinnerModalOpen: true }),
      closeWinnerModal: () => set({ isWinnerModalOpen: false }),

      // Reset the game
      resetGame: () =>
        set({
          players: [],
          currentPlayerIndex: 0,
          isGameStarted: false,
          isTurnModalOpen: false,
          hasTurnStarted: false,
          winnerIndex: null,
          isWinnerModalOpen: false,
        }),
    }),
    {
      name: "farkle-game-state",
      // Only persist game data, not UI state
      partialize: (state) => ({
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        isGameStarted: state.isGameStarted,
        winnerIndex: state.winnerIndex,
      }),
    },
  ),
);
