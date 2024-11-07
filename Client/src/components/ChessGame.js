// src/components/ChessGame.js

import React, { useState, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import io from "socket.io-client";
import "./ChessGame.css"; // Optional CSS for ChessGame

const socket = io("http://localhost:4000"); // Change this to your server address

function GameOverModal({ isOpen, message, winner, onNewGame, onExit }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{message}</h2>
        <p>{winner ? `${winner} wins!` : "It's a draw!"}</p>
        <div className="modal-buttons">
          <button onClick={onNewGame}>New Game</button>
          <button onClick={onExit}>Exit</button>
        </div>
      </div>
    </div>
  );
}

function ChessGame({ username }) {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState("");
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [gameOverState, setGameOverState] = useState({
    isOver: false,
    message: "",
    winner: null,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [players, setPlayers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    socket.on("gameJoined", ({ players }) => {
      setPlayers(players);
      setIsMyTurn(players.length === 1); // First player to join gets the first turn
    });

    socket.on("startGame", ({ board }) => {
      setGame(new Chess(board));
      setIsMyTurn(true); // Assuming the first player starts
    });

    socket.on("moveMade", ({ move, board }) => {
      setGame(new Chess(board));
      setIsMyTurn((prev) => !prev); // Toggle turn
      checkGameState(new Chess(board)); // Check game state after opponent's move
    });

    socket.on("gameOver", ({ winner }) => {
      setGameOverState({ isOver: true, message: "Game Over!", winner });
      setShowConfetti(true);
    });

    return () => {
      socket.off("gameJoined");
      socket.off("startGame");
      socket.off("moveMade");
      socket.off("gameOver");
    };
  }, []);

  const updateMoveHistory = useCallback((updatedGame) => {
    const moves = updatedGame.history({ verbose: true });
    const lastMove = moves[moves.length - 1];
    setMoveHistory((prevHistory) => [
      ...prevHistory,
      `${moves.length}. ${lastMove.color === "w" ? "" : "..."}${lastMove.san}`,
    ]);
  }, []);

  const checkGameState = useCallback((updatedGame) => {
    if (updatedGame.game_over()) {
      const winner = updatedGame.turn() === "w" ? "Black" : "White";
      socket.emit("gameOver", { winner });
    }
  }, []);

  const makeMove = (move) => {
    const updatedGame = { ...game };
    updatedGame.move(move);
    updateMoveHistory(updatedGame);
    checkGameState(updatedGame);
    socket.emit("moveMade", { move, board: updatedGame.fen() });
    setGame(updatedGame);
  };

  const handleSquareClick = (square) => {
    if (game.game_over()) return;

    const move = game.move({
      from: moveFrom,
      to: square,
      promotion: "q", // always promote to a queen for simplicity
    });

    if (move) {
      makeMove(move);
      setMoveFrom("");
    } else {
      setMoveFrom(square);
      // Highlight possible moves for the selected piece
      const possibleMoves = game.moves({ square, verbose: true });
      const highlightedMoves = {};
      possibleMoves.forEach((move) => {
        highlightedMoves[move.to] = true;
      });
      setMoveSquares(highlightedMoves);
    }
  };

  const handleRightClick = (square) => {
    // Right-click functionality to set or clear right-clicked squares
    setRightClickedSquares((prev) => ({
      ...prev,
      [square]: !prev[square],
    }));
  };

  const toggleBoardOrientation = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={isDarkMode ? "dark-mode" : "light-mode"}>
      <h1>Chess Game</h1>
      <h2>Players: {players.join(", ")}</h2>
      <h3>Your Username: {username}</h3>
      <button onClick={toggleBoardOrientation}>Toggle Board Orientation</button>
      <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
      <Chessboard
        position={game.fen()}
        onSquareClick={handleSquareClick}
        onSquareRightClick={handleRightClick}
        boardOrientation={boardOrientation}
        moveSquares={moveSquares}
        rightClickedSquares={rightClickedSquares}
      />
      <GameOverModal
        isOpen={gameOverState.isOver}
        message={gameOverState.message}
        winner={gameOverState.winner}
        onNewGame={() => {
          setGame(new Chess());
          setGameOverState({ isOver: false, message: "", winner: null });
          setShowConfetti(false);
          setMoveHistory([]);
          setRightClickedSquares({});
          setMoveSquares({});
        }}
        onExit={() => {
          // Handle exit logic
        }}
      />
      {showConfetti && <ReactConfetti width={width} height={height} />}
    </div>
  );
}

export default ChessGame;
