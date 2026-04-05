import { useRef, useState } from "react";
import "./App.css";
import AddPlayerForm from "./components/AddPlayerForm";
import ConfirmDialog from "./components/ConfirmDialog";
import PlayerCard from "./components/PlayerCard";
import SettingsModal from "./components/SettingsModal";
import TurnModal from "./components/TurnModal";
import WinnerModal from "./components/WinnerModal";
import { useGameStore } from "./store/gameStore";

function App() {
  return <Game />;
}

function Game() {
  const {
    players,
    currentPlayerIndex,
    resetGame,
    winnerIndex,
    isGameStarted,
    startGame,
    fontIndex,
    cycleFont,
    openSettingsModal,
  } = useGameStore();
  const addPlayerFormRef = useRef(null);
  const [settingsOpenCount, setSettingsOpenCount] = useState(0);

  // Easter egg: clicking title cycles fonts
  const FONTS = [
    "'Luckiest Guy', cursive",
    "'Bangers', cursive",
    "'Fredoka', sans-serif",
    "'Bungee', cursive",
  ];
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleStartGame = () => {
    startGame();
  };

  const handleNewGame = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmNewGame = () => {
    setShowConfirmDialog(false);
    resetGame();
    // Focus the add player input after reset
    setTimeout(() => addPlayerFormRef.current?.focus(), 0);
  };

  return (
    <div className="game">
      {/* Preload fonts to prevent FOUT */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        {FONTS.map((font) => (
          <span key={font} style={{ fontFamily: font }}>
            .
          </span>
        ))}
      </div>

      <header className="game__header">
        <h1
          style={{ fontFamily: FONTS[fontIndex], cursor: "pointer" }}
          onClick={cycleFont}
        >
          Let's Farkle
        </h1>
      </header>

      <section className="game__players">
        {/* Add Player comes first in DOM for tab order, CSS reorders visually */}
        {!isGameStarted && <AddPlayerForm ref={addPlayerFormRef} />}

        {players.map((player, index) => (
          <PlayerCard
            key={index}
            name={player.name}
            isWinner={index === winnerIndex}
            score={player.score}
            isActive={index === currentPlayerIndex}
          />
        ))}
      </section>

      {!isGameStarted && players.length >= 1 && (
        <button onClick={handleStartGame} className="start-game-fab">
          <span aria-hidden="true">▶</span> Start Game
        </button>
      )}

      {isGameStarted && (
        <button onClick={handleNewGame} className="new-game-fab">
          <span aria-hidden="true">↻</span> Start Over
        </button>
      )}

      {isGameStarted && winnerIndex === null && (
        <button
          onClick={() => {
            setSettingsOpenCount((c) => c + 1);
            openSettingsModal();
          }}
          className="settings-fab"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      )}

      {isGameStarted && <TurnModal />}
      {isGameStarted && <WinnerModal />}
      {isGameStarted && <SettingsModal key={settingsOpenCount} />}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Start Over?"
        message="This will clear all players and scores. This action cannot be undone."
        confirmText="Start Over"
        cancelText="Cancel"
        onConfirm={handleConfirmNewGame}
        onCancel={() => setShowConfirmDialog(false)}
        danger
      />
    </div>
  );
}

export default App;
