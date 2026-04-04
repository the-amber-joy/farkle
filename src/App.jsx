import { useRef, useState } from "react";
import "./App.css";
import AddPlayerForm from "./components/AddPlayerForm";
import ConfirmDialog from "./components/ConfirmDialog";
import PlayerCard from "./components/PlayerCard";
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
  } = useGameStore();
  const addPlayerFormRef = useRef(null);

  // Easter egg: clicking title cycles fonts
  const FONTS = [
    "'Bangers', cursive",
    "'Fredoka', sans-serif",
    "'Luckiest Guy', cursive",
    "'Bungee', cursive",
  ];
  const [fontIndex, setFontIndex] = useState(0);
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
          onClick={() => setFontIndex((i) => (i + 1) % FONTS.length)}
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

      {isGameStarted && <TurnModal />}
      {isGameStarted && <WinnerModal />}

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
