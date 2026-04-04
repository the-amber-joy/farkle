import { useRef, useState } from "react";
import "./App.css";
import AddPlayerForm from "./components/AddPlayerForm";
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

  const handleStartGame = () => {
    startGame();
  };

  const handleNewGame = () => {
    if (
      window.confirm(
        "Start a new game?\n\nThis will clear all players and scores. This action cannot be undone.",
      )
    ) {
      resetGame();
      // Focus the add player input after reset
      setTimeout(() => addPlayerFormRef.current?.focus(), 0);
    }
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

      <footer className="game__footer">
        {!isGameStarted && players.length >= 1 && (
          <button onClick={handleStartGame} className="start-game-btn">
            Start Game
          </button>
        )}
        {isGameStarted && (
          <button onClick={handleNewGame} className="new-game-btn">
            New Game
          </button>
        )}
      </footer>

      {isGameStarted && <TurnModal />}
      {isGameStarted && <WinnerModal />}
    </div>
  );
}

export default App;
