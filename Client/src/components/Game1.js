import React, { useState } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";

const ChessGame = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w"); // 'w' for White, 'b' for Black
  const [error, setError] = useState(""); // Holds error messages

  const onDrop = ({ sourceSquare, targetSquare }) => {
    // Clear any previous error message
    setError("");

    // Check if it's the correct player's turn
    if (turn !== game.turn()) {
      setError("It's not your turn!");
      return;
    }

    try {
      // Attempt to make the move
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to a queen for simplicity
      });

      if (move) {
        // If move is valid, update FEN and switch turn
        setFen(game.fen());
        setTurn(turn === "w" ? "b" : "w");
      } else {
        // If move is invalid, show an error (won't change board state)
        setError("Invalid move from ${sourceSquare} to ${targetSquare}.");
      }
    } catch (error) {
      // Catch any error thrown by invalid moves and set error message
      setError("Invalid move.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Two-Player Chess</h1>
      <p>Current turn: {turn === "w" ? "White" : "Black"}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <Chessboard
        position={fen}
        onDrop={onDrop}
        width={400}
        draggable={true} // Allows piece dragging
        dropOffBoard="snapback" // Resets pieces to the original square on invalid moves
      />
    </div>
  );
};

export default ChessGame;
