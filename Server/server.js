// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db");
const logger = require("./logger");
const User = require("./User");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(bodyParser.json());
connectDB();

// Socket.IO for multiplayer
io.on("connection", (socket) => {
  socket.on("joinGame", (username) => {
    socket.broadcast.emit("opponentJoined", username);
  });

  socket.on("move", (move) => {
    socket.broadcast.emit("move", move);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      return res.status(200).json({ message: "Login successful!" });
    }
    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
