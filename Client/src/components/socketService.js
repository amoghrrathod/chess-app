// src/services/socketService.js
import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.username = null;
  }

  connect(token, username) {
    if (this.socket) {
      return;
    }

    this.token = token;
    this.username = username;

    this.socket = io("http://localhost:5569", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.authenticate();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return this.socket;
  }

  authenticate() {
    if (this.socket && this.token && this.username) {
      this.socket.emit("authenticate", {
        token: this.token,
        username: this.username,
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Helper methods for game actions
  createRoom() {
    if (this.socket) {
      this.socket.emit("createRoom", { username: this.username });
    }
  }

  joinRoom(roomCode) {
    if (this.socket) {
      this.socket.emit("joinRoom", { roomCode });
    }
  }

  makeMove(roomCode, move, fen) {
    if (this.socket) {
      this.socket.emit("makeMove", { roomCode, move, fen });
    }
  }

  // Add event listeners
  onAuthenticated(callback) {
    if (this.socket) {
      this.socket.on("authenticated", callback);
    }
  }

  onAuthError(callback) {
    if (this.socket) {
      this.socket.on("authError", callback);
    }
  }

  onRoomsList(callback) {
    if (this.socket) {
      this.socket.on("roomsList", callback);
    }
  }

  onRoomJoined(callback) {
    if (this.socket) {
      this.socket.on("roomJoined", callback);
    }
  }

  onGameStart(callback) {
    if (this.socket) {
      this.socket.on("gameStart", callback);
    }
  }

  onMoveMade(callback) {
    if (this.socket) {
      this.socket.on("moveMade", callback);
    }
  }

  onPlayerLeft(callback) {
    if (this.socket) {
      this.socket.on("playerLeft", callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }
}

export const socketService = new SocketService();
