// src/components/GameSelection.js

import React from "react";
import { useNavigate } from "react-router-dom";

const GameSelection = () => {
  const navigate = useNavigate();

  const handleGameSelection = (game) => {
    navigate(`/games/${game}`);
  };

  return (
    <div>
      <h1>Select a Game</h1>
      <button onClick={() => handleGameSelection("chess")}>Play Chess</button>
      {/* Add more game buttons as needed */}
    </div>
  );
};

export default GameSelection;
