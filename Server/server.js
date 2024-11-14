const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const connectDB = require("./db");
const logger = require("./logger");
const User = require("./User");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 80;
const PORT_SOCK = process.env.PORT_SOCK || 5569;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
connectDB();

// Game state management
const games = new Map();

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create HTTP server and integrate it with socket.io
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5569",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});

// Socket.io setup - Remove the JWT middleware and handle authentication differently
io.on("connection", (socket) => {
  console.log("New connection attempt");

  socket.on("authenticate", ({ token, username }) => {
    if (!token) {
      socket.emit("authError", "No token provided");
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = { username: username || decoded.username };
      socket.emit("authenticated");
      console.log(`User authenticated: ${socket.user.username}`);

      // Send available rooms
      const availableRooms = Array.from(games.entries())
        .filter(([_, game]) => game.players.length === 1)
        .map(([code, game]) => ({
          code,
          host: game.players[0].username,
        }));

      socket.emit("roomsList", availableRooms);
    } catch (err) {
      socket.emit("authError", "Invalid token");
    }
  });

  socket.on("createRoom", ({ username }) => {
    if (!socket.user) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const roomCode = generateGameCode();
    console.log(`Creating room: ${roomCode} for user: ${socket.user.username}`);

    games.set(roomCode, {
      players: [
        { username: socket.user.username, socket: socket.id, color: "white" },
      ],
      gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    });

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, playerColor: "white" });

    // Update available rooms list
    io.emit(
      "roomsList",
      Array.from(games.entries())
        .filter(([_, game]) => game.players.length === 1)
        .map(([code, game]) => ({
          code,
          host: game.players[0].username,
        }))
    );
  });

  socket.on("joinRoom", ({ roomCode }) => {
    if (!socket.user) {
      socket.emit("error", "Not authenticated");
      return;
    }

    console.log(
      `Join room attempt: ${roomCode} by user: ${socket.user.username}`
    );

    const game = games.get(roomCode);
    if (!game) {
      socket.emit("error", "Room not found");
      return;
    }

    if (game.players.length >= 2) {
      socket.emit("error", "Room is full");
      return;
    }

    // Add player to room with black color
    game.players.push({
      username: socket.user.username,
      socket: socket.id,
      color: "black",
    });

    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, playerColor: "black" });

    console.log(`Room is full. Emitting gameStart event for room: ${roomCode}`);
    // Notify both players that game is starting
    io.to(roomCode).emit("gameStart", {
      white: game.players.find((p) => p.color === "white").username,
      black: game.players.find((p) => p.color === "black").username,
      fen: game.gameState,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.user) {
      console.log(`User disconnected: ${socket.user.username}`);

      // Clean up games
      for (const [code, game] of games.entries()) {
        const playerIndex = game.players.findIndex(
          (p) => p.socket === socket.id
        );
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          if (game.players.length === 0) {
            games.delete(code);
          } else {
            io.to(code).emit("playerLeft", { username: socket.user.username });
          }
        }
      }

      // Update available rooms
      io.emit(
        "roomsList",
        Array.from(games.entries())
          .filter(([_, game]) => game.players.length === 1)
          .map(([code, game]) => ({
            code,
            host: game.players[0].username,
          }))
      );
    }
  });
  socket.on("makeMove", ({ roomCode, move, fen }) => {
    if (!socket.user) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const game = games.get(roomCode);
    if (game) {
      game.gameState = fen;
      socket.to(roomCode).emit("moveMade", { move, fen });
    }
    socket.on("disconnect", () => {
      if (socket.user) {
        console.log(`User disconnected: ${socket.user.username}`);

        // Clean up games
        for (const [code, game] of games.entries()) {
          const playerIndex = game.players.findIndex(
            (p) => p.socket === socket.id
          );
          if (playerIndex !== -1) {
            game.players.splice(playerIndex, 1);
            if (game.players.length === 0) {
              games.delete(code);
            } else {
              io.to(code).emit("playerLeft", {
                username: socket.user.username,
              });
            }
          }
        }

        // Update available rooms
        io.emit(
          "roomsList",
          Array.from(games.entries())
            .filter(([_, game]) => game.players.length === 1)
            .map(([code, game]) => ({
              code,
              host: game.players[0].username,
            }))
        );
      }
    });
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

    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      message: "Login successful!",
      token,
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

// Start the servers
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});

server.listen(PORT_SOCK, () => {
  console.log(`Socket.IO Server is running on port ${PORT_SOCK}`);
});
