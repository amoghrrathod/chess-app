import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import Chat from "./Chat";

const ChessGame = ({ user, socket }) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [turn, setTurn] = useState("w");
  const [error, setError] = useState("");
  const [opponent, setOpponent] = useState(null);
  const [color, setColor] = useState(null); // Store player's color
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("joinGame", user.username);

    socket.on("colorAssigned", (assignedColor) => {
      setColor(assignedColor);
    });

    socket.on("move", (move) => {
      game.move(move);
      setFen(game.fen());
      setTurn(game.turn());
    });

    socket.on("opponentJoined", (opponentName) => {
      setOpponent(opponentName);
    });

    socket.on("chatMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("move");
      socket.off("opponentJoined");
      socket.off("chatMessage");
      socket.off("colorAssigned");
    };
  }, [socket, game]);

  const onDrop = ({ sourceSquare, targetSquare }) => {
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
    <div className="chess-game-container">
      <h1>Two-Player Chess</h1>
      <p>Current turn: {turn === "w" ? "White" : "Black"}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display player colors */}
      <p>{color === "white" ? "You are White" : "You are Black"}</p>
      <p>
        Player 1: {user?.username || "You"} (
        {color === "white" ? "White" : "Black"})
      </p>
      <p>
        Player 2: {opponent || "Waiting for opponent..."} (
        {color === "black" ? "Black" : "White"})
      </p>

      <Chessboard
        position={fen}
        onDrop={onDrop}
        width={400}
        draggable={true}
        dropOffBoard="snapback"
      />

      {/* Chat Component */}
      <Chat messages={messages} socket={socket} />
    </div>
  );
};

export default ChessGame;
