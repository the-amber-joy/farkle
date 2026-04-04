import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";

/**
 * AddPlayerForm - Form to add new players during setup phase
 */
const AddPlayerForm = forwardRef(function AddPlayerForm(props, ref) {
  const { addPlayer } = useGameStore();
  const [newPlayerName, setNewPlayerName] = useState("");
  const inputRef = useRef(null);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="add-player">
      <label htmlFor="new-player-input" className="visually-hidden">
        Player name
      </label>
      <input
        ref={inputRef}
        id="new-player-input"
        type="text"
        value={newPlayerName}
        onChange={(e) => setNewPlayerName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
        placeholder="Player name"
        className="add-player__input"
      />
      <button
        onClick={handleAddPlayer}
        disabled={!newPlayerName.trim()}
        className="add-player__btn"
      >
        Add Player
      </button>
    </div>
  );
});

export default AddPlayerForm;
