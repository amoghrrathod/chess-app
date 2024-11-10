import React, { useState, useCallback, useRef, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import io from "socket.io-client";
import "./ChessGame.css";

const socket = io("http://localhost:5569"); // Change this to your server address

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

function App() {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState("");
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [gameOverState, setGameOverState] = useState({
    isOver: false,
    message: "",
    winner: null,
  });
  const chessboardRef = useRef();
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    socket.on("gameJoined", ({ gameId, players }) => {
      setGameId(gameId);
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
    });

    return () => {
      socket.off("gameJoined");
      socket.off("startGame");
      socket.off("moveMade");
    };
  }, []);

  const joinGame = () => {
    socket.emit("joinGame", { username });
  };

  const updateMoveHistory = useCallback((updatedGame) => {
    const moves = updatedGame.history({ verbose: true });
    const lastMove = moves[moves.length - 1];
    setMoveHistory((prevHistory) => [
      ...prevHistory,
      `${moves.length}. ${lastMove.color === "w" ? "" : "..."}${lastMove.san}`,
    ]);
  }, []);

  const findKingSquare = useCallback(
    (color) => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const square = String.fromCharCode(97 + j) + (8 - i);
          const piece = game.get(square);
          if (piece && piece.type === "k" && piece.color === color) {
            return square;
          }
        }
      }
      return null;
    },
    [game],
  );

  const checkGameState = useCallback(
    (gameCopy) => {
      if (gameCopy.isCheck()) {
        const kingSquare = findKingSquare(gameCopy.turn());
        if (kingSquare) {
          setMoveSquares((prev) => ({
            ...prev,
            [kingSquare]: { backgroundColor: "rgba(255, 0, 0, 0.4)" },
          }));
        }
      }

      if (gameCopy.isCheckmate()) {
        const winner = gameCopy.turn() === "w" ? "Black" : "White";
        setGameOverState({ isOver: true, message: "Checkmate!", winner });
        setShowConfetti(true);
      } else if (gameCopy.isStalemate()) {
        setGameOverState({ isOver: true, message: "Stalemate!", winner: null });
      } else if (gameCopy.isDraw()) {
        setGameOverState({ isOver: true, message: "Draw!", winner: null });
      }
    },
    [findKingSquare],
  );

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  function getMoveOptions(square) {
    if (!square) return;

    const moves = game.moves({
      square,
      verbose: true,
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return;
    }

    const newSquares = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
  }

  function onSquareClick(square) {
    setRightClickedSquares({});

    function resetFirstMove(square) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    }

    if (moveFrom === square) {
      setMoveFrom("");
      setOptionSquares({});
      return;
    }

    if (!moveFrom) {
      resetFirstMove(square);
      return;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      if (move === null) {
        resetFirstMove(square);
        return;
      }

      setGame(gameCopy);
      setMoveFrom("");
      setOptionSquares({});
      setMoveSquares({
        [moveFrom]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
        [square]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
      });

      updateMoveHistory(gameCopy);
      checkGameState(gameCopy);
      socket.emit("makeMove", { gameId, move }); // Emit move to server
    } catch (e) {
      resetFirstMove(square);
    }
  }

  function onPieceDragBegin(piece, sourceSquare) {
    if (game.get(sourceSquare)?.color === game.turn()) {
      getMoveOptions(sourceSquare);
    }
  }

  function onPieceDragEnd() {
    setOptionSquares({});
  }

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (!isMyTurn) return false; // Prevent moves if it's not the player's turn

      try {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (move === null) return false;

        setGame(gameCopy);
        setMoveSquares({
          [sourceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
          [targetSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
        });

        updateMoveHistory(gameCopy);
        checkGameState(gameCopy);
        socket.emit("makeMove", { gameId, move }); // Emit move to server

        return true;
      } catch (e) {
        return false;
      }
    },
    [game, updateMoveHistory, checkGameState, isMyTurn],
  );

  function flipBoard() {
    setBoardOrientation(boardOrientation === "white" ? "black" : "white");
  }

  function resetGame() {
    setGame(new Chess());
    setMoveHistory([]);
    setMoveSquares({});
    setOptionSquares({});
    setMoveFrom("");
    setGameOverState({ isOver: false, message: "", winner: null });
    socket.emit("resetGame", gameId); // Notify server to reset the game
  }

  function toggleDarkMode() {
    setIsDarkMode(!isDarkMode);
  }

  return (
    <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
      {showConfetti && <ReactConfetti width={width} height={height} />}
      <div className="game-container">
        <div className="board-container">
          <div className="board-header">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
            <button onClick={joinGame}>Join Game</button>
            <button className="control-button" onClick={resetGame}>
              ↺ New Game
            </button>
            <button className="control-button" onClick={flipBoard}>
              ⇅ Flip Board
            </button>
            <button
              className="control-button mode-toggle"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <Chessboard
            id="ClickToMove"
            animationDuration={200}
            arePiecesDraggable={true}
            position={game.fen()}
            onSquareClick={onSquareClick}
            onPieceDragBegin={onPieceDragBegin}
            onPieceDragEnd={onPieceDragEnd}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
            customBoardStyle={{
              borderRadius: "8px",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
            }}
            customSquareStyles={{
              ...moveSquares,
              ...optionSquares,
              ...rightClickedSquares,
            }}
            ref={chessboardRef}
            boardWidth={560}
          />

          <div className="board-footer">
            <div className="player-tags">
              <div
                className={`player-tag ${boardOrientation === "white" ? "bottom" : "top"}`}
              >
                White
              </div>
              <div
                className={`player-tag ${boardOrientation === "black" ? "bottom" : "top"}`}
              >
                Black
              </div>
            </div>
          </div>
        </div>

        <div className="game-info">
          <div className="move-history">
            <h3>♟ Move History</h3>
            <div className="move-list">
              {moveHistory.map((move, index) => (
                <div key={index} className="move-item">
                  {move}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={gameOverState.isOver}
        message={gameOverState.message}
        winner={gameOverState.winner}
        onNewGame={resetGame}
        onExit={() =>
          setGameOverState({ isOver: false, message: "", winner: null })
        }
      />
    </div>
  );
}

export default App;
