import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import io from "socket.io-client";

const socket = io("http://localhost:80"); // Connect to the Socket.io server

const ChessGame = ({ username }) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w"); // 'w' for White, 'b' for Black
  const [error, setError] = useState(""); // Holds error messages
  const [isMyTurn, setIsMyTurn] = useState(true); // Track if it's the player's turn
  const [playerColor, setPlayerColor] = useState("w"); // Default to White for simplicity

  useEffect(() => {
    // Join the game on mount
    socket.emit("joinGame", username);

    // Listen for opponent moves
    socket.on("opponentMove", (moveData) => {
      game.move(moveData);
      setFen(game.fen());
      setTurn(game.turn());
      setIsMyTurn(turn === playerColor);
    });

    return () => {
      socket.off("opponentMove");
    };
  }, [game, turn, playerColor, username]);

  const onDrop = ({ sourceSquare, targetSquare }) => {
    setError("");

    // Check if it's the correct player's turn
    if (!isMyTurn) {
      setError("It's not your turn!");
      return;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setFen(game.fen());
        setTurn(game.turn());
        setIsMyTurn(false); // Switch turns after making a move

        // Send move to server
        socket.emit("move", move);
      } else {
        setError("Invalid move.");
      }
    } catch (error) {
      setError("Invalid move.");
    }
  };

  return (
    <div className="chess-game-container">
      <h1>Two-Player Chess</h1>
      <p>Player: {username}</p>
      <p>Current turn: {turn === "w" ? "White" : "Black"}</p>
      {error && <p className="error-message">{error}</p>}
      <Chessboard
        position={fen}
        onDrop={onDrop}
        width={400}
        draggable={isMyTurn} // Only allow dragging if it's your turn
        dropOffBoard="snapback" // Resets pieces to original square on invalid moves
      />
    </div>
  );
};

export default ChessGame;
