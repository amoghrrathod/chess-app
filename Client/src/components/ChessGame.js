import React, { useState, useCallback, useRef, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./ChessGame.css";

import io from "socket.io-client";
const SOCKET_PORT = process.env.REACT_APP_SOCKET_PORT;
const LOCAL_IP = process.env.REACT_APP_LOCAL_IP || "localhost";

const socket = io(`http://${LOCAL_IP}:${SOCKET_PORT}`, {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

function WaitingRoom({ roomCode, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Waiting for Opponent</h2>
        <p>Share this room code with your friend:</p>
        <div className="room-code">{roomCode}</div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
}
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

function ChessGame({ user }) {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState("");
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gameOverState, setGameOverState] = useState({
    isOver: false,
    message: "",
    winner: null,
  });
  const [isOnlineGame, setIsOnlineGame] = useState(false);
  const [playerColor, setPlayerColor] = useState("white");
  const [opponent, setOpponent] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [isWaiting, setIsWaiting] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const chessboardRef = useRef();
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (roomCode) {
      setIsOnlineGame(true);
      const color = location.state?.playerColor || "white";
      setPlayerColor(color);
      setBoardOrientation(color);
      setIsMyTurn(color === "white");

      // Join room
      socket.emit("joinChessRoom", {
        roomCode,
        username: user?.username,
        token: localStorage.getItem("token"),
      });
    }
  }, [roomCode, user?.username, location.state, playerColor]);

  const updateMoveHistory = useCallback((updatedGame) => {
    const moves = updatedGame.history({ verbose: true });
    const lastMove = moves[moves.length - 1];

    if (lastMove) {
      setMoveHistory((prevHistory) => [
        ...prevHistory,
        `${moves.length}. ${lastMove.color === "w" ? "" : "..."}${
          lastMove.san
        }`,
      ]);
    } else {
      // Handle the case where there are no moves yet
      setMoveHistory([]);
    }
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
    [game]
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
        setGameOverState({
          isOver: true,
          message: "Checkmate!",
          winner: isOnlineGame
            ? winner.toLowerCase() === playerColor
              ? user?.username
              : opponent
            : winner,
        });
        setShowConfetti(true);
      } else if (gameCopy.isStalemate()) {
        setGameOverState({ isOver: true, message: "Stalemate!", winner: null });
      } else if (gameCopy.isDraw()) {
        setGameOverState({ isOver: true, message: "Draw!", winner: null });
      }
    },
    [findKingSquare, isOnlineGame, playerColor, user?.username, opponent]
  );
  // Initialize online game
  useEffect(() => {
    if (roomCode) {
      // Listen for game start
      socket.on("gameStart", (data) => {
        console.log("Game started with data:", data);
        setOpponent(data[playerColor === "white" ? "black" : "white"]);
        setIsWaiting(false);
        setGameStarted(true);
        setGame(new Chess(data.fen));
        setIsMyTurn(data.currentTurn === playerColor);
      });
      socket.on("moveMade", ({ move, fen, currentTurn }) => {
        console.log("Received move from opponent:", move, fen);
        const gameCopy = new Chess(fen);
        setGame(gameCopy);
        setMoveSquares({
          [move.from]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
          [move.to]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
        });
        setIsMyTurn(currentTurn === playerColor);
        updateMoveHistory(gameCopy);
        checkGameState(gameCopy);
      });

      socket.on("roomStatus", ({ players, status }) => {
        console.log("Room status updated:", status, players);
        if (status === "waiting") {
          setIsWaiting(true);
          setGameStarted(false);
        } else if (status === "ready") {
          setIsWaiting(false);
          setGameStarted(true);
          // Set opponent name based on player color
          setOpponent(players[playerColor === "white" ? "black" : "white"]);
        }
      });

      // Clean up function
      return () => {
        socket.off("gameStart");
        socket.off("roomStatus");
      };
    }
  }, [
    roomCode,
    user?.username,
    location.state,
    playerColor,
    updateMoveHistory,
    checkGameState,
  ]);

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
    // Prevent moves if it's not your turn in online game
    if (isOnlineGame && !isMyTurn) return;
    if (isOnlineGame && !gameStarted) return;

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

      if (isOnlineGame) {
        console.log("Emitting move:", move, gameCopy.fen());
        socket.emit("makeMove", {
          roomCode,
          move,
          fen: gameCopy.fen(),
          playerColor,
        });
        setIsMyTurn(false);
      }

      updateMoveHistory(gameCopy);
      checkGameState(gameCopy);
    } catch (e) {
      resetFirstMove(square);
    }
  }

  function onPieceDragBegin(piece, sourceSquare) {
    // Prevent moves if it's not your turn in online game
    if (isOnlineGame && !isMyTurn) return false;

    if (game.get(sourceSquare)?.color === game.turn()) {
      getMoveOptions(sourceSquare);
    }
  }

  function onPieceDragEnd() {
    setOptionSquares({});
  }

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (isOnlineGame && !isMyTurn) return false;
      if (isOnlineGame && !gameStarted) return false;

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

        if (isOnlineGame) {
          console.log("Emitting move:", move, gameCopy.fen());
          socket.emit("makeMove", {
            roomCode,
            move,
            fen: gameCopy.fen(),
            playerColor,
          });
          setIsMyTurn(false);
        }

        updateMoveHistory(gameCopy);
        checkGameState(gameCopy);

        return true;
      } catch (e) {
        return false;
      }
    },
    [
      game,
      updateMoveHistory,
      checkGameState,
      isOnlineGame,
      isMyTurn,
      roomCode,
      gameStarted,
      playerColor,
    ]
  );

  function flipBoard() {
    if (!isOnlineGame) {
      setBoardOrientation(boardOrientation === "white" ? "black" : "white");
    }
  }

  function resetGame() {
    if (isOnlineGame) {
      navigate("/room");
    } else {
      setGame(new Chess());
      setMoveHistory([]);
      setMoveSquares({});
      setOptionSquares({});
      setMoveFrom("");
      setGameOverState({ isOver: false, message: "", winner: null });
    }
  }

  function toggleDarkMode() {
    setIsDarkMode(!isDarkMode);
  }
  if (isOnlineGame && isWaiting) {
    return (
      <WaitingRoom
        roomCode={roomCode}
        onCancel={() => {
          socket.emit("leaveRoom", { roomCode });
          navigate("/room");
        }}
      />
    );
  }
  const handleNavigateHome = () => {
    navigate("/home");
  };

  const handleNavigateRoom = () => {
    navigate("/room");
  };
  return (
    <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
      {showConfetti && <ReactConfetti width={width} height={height} />}
      <div className="game-container">
        <div className="board-container">
          <div className="board-header">
            <div className="player-info">
              {isOnlineGame ? (
                <>
                  <span>
                    You: {user?.username} ({playerColor})
                  </span>
                  {opponent && <span>Opponent: {opponent}</span>}
                </>
              ) : (
                <span className="local-indicator">Local</span>
              )}
            </div>
            <button className="control-button" onClick={handleNavigateHome}>
              🏠 Home
            </button>
            <button className="control-button" onClick={handleNavigateRoom}>
              🔙 Room
            </button>
            <button className="control-button" onClick={resetGame}>
              {isOnlineGame ? "Exit Game" : "↺ New Game"}
            </button>
            {!isOnlineGame && (
              <button className="control-button" onClick={flipBoard}>
                ⇅ Flip Board
              </button>
            )}
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
                className={`player-tag ${
                  boardOrientation === "white" ? "bottom" : "top"
                }`}
              >
                White
                {isOnlineGame &&
                  ` (${playerColor === "white" ? user?.username : opponent})`}
              </div>
              <div
                className={`player-tag ${
                  boardOrientation === "black" ? "bottom" : "top"
                }`}
              >
                Black
                {isOnlineGame &&
                  ` (${playerColor === "black" ? user?.username : opponent})`}
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
            {isOnlineGame && (
              <div className="turn-indicator">
                {isMyTurn ? "Your turn" : "Opponent's turn"}
              </div>
            )}
          </div>
        </div>
      </div>

      <GameOverModal
        isOpen={gameOverState.isOver}
        message={gameOverState.message}
        winner={gameOverState.winner}
        onNewGame={resetGame}
        onExit={() => {
          setGameOverState({ isOver: false, message: "", winner: null });
          navigate("/home");
        }}
      />
    </div>
  );
}

export default ChessGame;
