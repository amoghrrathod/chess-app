const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketIO = require("socket.io");
require("dotenv").config();

const connectDB = require("./db");
const logger = require("./logger");
const User = require("./User");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 80;
const SOCKET_PORT = 5569;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
connectDB();

// Store active game rooms and socket sessions
const gameRooms = new Map();
const userSockets = new Map();

// Generate a random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  // Handle authentication
  socket.on("authenticate", async ({ username }) => {
    try {
      const user = await User.findOne({ username });
      if (user) {
        // Store socket-user mapping
        userSockets.set(socket.id, username);
        socket.username = username;
        socket.emit("authenticated");

        // Send list of available rooms
        const availableRooms = Array.from(gameRooms.entries())
          .filter(([_, room]) => !room.isFull)
          .map(([code, room]) => ({
            code,
            host: room.host,
          }));
        socket.emit("roomsList", availableRooms);
      } else {
        socket.emit("error", "Authentication failed");
      }
    } catch (error) {
      socket.emit("error", "Server error during authentication");
    }
  });

  // Handle room creation
  socket.on("createRoom", ({ username }) => {
    if (!socket.username) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const roomCode = generateRoomCode();
    gameRooms.set(roomCode, {
      host: username,
      players: { white: username },
      isFull: false,
      game: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        currentTurn: "white",
      },
    });

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, playerColor: "white" });

    // Broadcast updated room list
    io.emit(
      "roomsList",
      Array.from(gameRooms.entries())
        .filter(([_, room]) => !room.isFull)
        .map(([code, room]) => ({
          code,
          host: room.host,
        }))
    );
  });

  // Handle joining room
  socket.on("joinRoom", ({ roomCode }) => {
    if (!socket.username) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const room = gameRooms.get(roomCode);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (room.isFull) {
      socket.emit("error", "Room is full");
      return;
    }

    // Add player to room
    room.players.black = socket.username;
    room.isFull = true;
    socket.join(roomCode);

    // Notify players and start game
    socket.emit("roomJoined", { roomCode, playerColor: "black" });
    io.to(roomCode).emit("gameStart", {
      white: room.players.white,
      black: room.players.black,
      fen: room.game.fen,
      currentTurn: room.game.currentTurn,
    });

    // Update room list
    io.emit(
      "roomsList",
      Array.from(gameRooms.entries())
        .filter(([_, room]) => !room.isFull)
        .map(([code, room]) => ({
          code,
          host: room.host,
        }))
    );
  });

  // Handle chess moves
  socket.on("makeMove", ({ roomCode, move, fen, playerColor }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.game.fen = fen;
    room.game.currentTurn = playerColor === "white" ? "black" : "white";

    // Broadcast move to other player
    socket.to(roomCode).emit("moveMade", {
      move,
      fen,
      currentTurn: room.game.currentTurn,
    });
  });

  // Handle joining chess room
  socket.on("joinChessRoom", ({ roomCode, username }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    socket.join(roomCode);
    io.to(roomCode).emit("roomStatus", {
      players: room.players,
      status: room.isFull ? "ready" : "waiting",
    });
  });

  // Handle leaving room
  socket.on("leaveRoom", ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (room) {
      socket.leave(roomCode);
      gameRooms.delete(roomCode);
      io.to(roomCode).emit("playerLeft");

      // Update room list
      io.emit(
        "roomsList",
        Array.from(gameRooms.entries())
          .filter(([_, room]) => !room.isFull)
          .map(([code, room]) => ({
            code,
            host: room.host,
          }))
      );
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = userSockets.get(socket.id);
    if (username) {
      userSockets.delete(socket.id);

      // Clean up any rooms where this user was playing
      for (const [roomCode, room] of gameRooms.entries()) {
        if (
          room.players.white === username ||
          room.players.black === username
        ) {
          io.to(roomCode).emit("playerLeft");
          gameRooms.delete(roomCode);
        }
      }

      // Update room list
      io.emit(
        "roomsList",
        Array.from(gameRooms.entries())
          .filter(([_, room]) => !room.isFull)
          .map(([code, room]) => ({
            code,
            host: room.host,
          }))
      );
    }
  });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user) {
      logger.warn(`Failed login attempt - user not found: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(
        `Failed login attempt - incorrect password for user: ${username}`
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    logger.info(`Login successful for user: ${username}`);

    return res.status(200).json({
      message: "Login successful!",
      user: {
        username: user.username,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    logger.error(
      `Server error on login attempt for user: ${username} - ${error.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// User verification endpoint
app.get("/api/verify-user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      res.json({
        valid: true,
        user: {
          username: user.username,
          email: user.email,
          fullname: user.fullname,
        },
      });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

// Start the servers
app.listen(PORT, () => {
  console.log(`HTTP Server running on http://localhost:${PORT}`);
});

server.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${SOCKET_PORT}`);
});
