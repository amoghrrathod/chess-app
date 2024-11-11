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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.io setup - Remove the JWT middleware and handle authentication differently
io.on("connection", (socket) => {
  console.log("New connection attempt");

  // Handle authentication after connection
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

      // Send available rooms only after authentication
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

    const roomCode = generateGameCode(); // Generate the game code
    console.log(`Generated room code: ${roomCode}`); // Log the generated code

    games.set(roomCode, {
      players: [
        { username: socket.user.username, socket: socket.id, color: "white" },
      ],
      gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Initial FEN
    });

    console.log(`Room created with code: ${roomCode}`); // Log room creation
    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, playerColor: "white" });

    // Emit the updated rooms list
    io.emit(
      "roomsList",
      Array.from(games.entries())
        .filter(([_, game]) => game.players.length === 1)
        .map(([code, game]) => ({
          code,
          host: game.players[0].username,
        })),
    );
  });

  socket.on("joinRoom", ({ roomCode }) => {
    if (!socket.user) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const game = games.get(roomCode);
    if (game && game.players.length === 1) {
      game.players.push({
        username: socket.user.username,
        socket: socket.id,
        color: "black",
      });

      socket.join(roomCode);
      socket.emit("roomJoined", { roomCode, playerColor: "black" });

      io.to(roomCode).emit("gameStart", {
        white: game.players[0].username,
        black: game.players[1].username,
        fen: game.gameState,
      });

      // Update available rooms list
      io.emit(
        "roomsList",
        Array.from(games.entries())
          .filter(([_, game]) => game.players.length === 1)
          .map(([code, game]) => ({
            code,
            host: game.players[0].username,
          })),
      );
    } else {
      socket.emit("error", "Room not available");
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
  });

  socket.on("disconnect", () => {
    if (socket.user) {
      console.log(`User disconnected: ${socket.user.username}`);

      // Clean up games
      for (const [code, game] of games.entries()) {
        const playerIndex = game.players.findIndex(
          (p) => p.socket === socket.id,
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
          })),
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
        `Failed login attempt - incorrect password for user: ${username}`,
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
      `Server error on login attempt for user: ${username} - ${error.message}`,
    );
    res.status(500).json({ message: "Server error" });
  }
});

// Start the servers
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://10.1.4.91:${PORT}`);
});

server.listen(PORT_SOCK, () => {
  console.log(`Socket.io Server is running on port ${PORT_SOCK}`);
});
