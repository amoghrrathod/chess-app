// src/components/ChessGame.js
import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";

const ChessGame = ({ user, socket }) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w");
  const [error, setError] = useState("");
  const [opponent, setOpponent] = useState(null);

  // Listen for opponent moves
  useEffect(() => {
    socket.on("move", (move) => {
      game.move(move);
      setFen(game.fen());
      setTurn(game.turn());
    });

    socket.on("opponentJoined", (opponentName) => {
      setOpponent(opponentName);
    });

    return () => {
      socket.off("move");
      socket.off("opponentJoined");
    };
  }, [socket, game]);

  const onDrop = ({ sourceSquare, targetSquare }) => {
    setError("");

    if (turn !== game.turn()) {
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
        socket.emit("move", move);
      } else {
        setError(`Invalid move from ${sourceSquare} to ${targetSquare}.`);
      }
    } catch (error) {
      setError("Invalid move.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Two-Player Chess</h1>
      <p>Current turn: {turn === "w" ? "White" : "Black"}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>Player 1: {user?.username || "You"} (White)</p>
      <p>Player 2: {opponent || "Waiting for opponent..."} (Black)</p>
      <Chessboard
        position={fen}
        onDrop={onDrop}
        width={400}
        draggable={true}
        dropOffBoard="snapback"
      />
    </div>
  );
};

export default ChessGame;
