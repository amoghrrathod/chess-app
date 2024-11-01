import React, { useState } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";

const App = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w"); // 'w' for White, 'b' for Black

  const onDrop = ({ sourceSquare, targetSquare }) => {
    console.log("Legal moves:", game.moves()); // Log available moves

    // Allow a move only if it's the correct player's turn
    if (turn === game.turn()) {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to a queen for simplicity
      });

      // Check if the move is valid
      if (move) {
        setFen(game.fen()); // Update the board state with the new position
        setTurn(turn === "w" ? "b" : "w"); // Switch to the next player's turn
      } else {
        alert(`Invalid move from ${sourceSquare} to ${targetSquare}.`);
      }
    } else {
      alert("It's not your turn!");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Two-Player Chess</h1>
      <p>Current turn: {turn === "w" ? "White" : "Black"}</p>
      <Chessboard position={fen} onDrop={onDrop} width={400} />
    </div>
  );
};

export default App;
