import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./GameRoom.css";

const SOCKET_PORT = 5569;
const LOCAL_IP = process.env.LOCAL_IP || "localhost";

const socket = io(`http://${LOCAL_IP}:${SOCKET_PORT}`, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const GameRoom = ({ user }) => {
  const [roomCode, setRoomCode] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Authenticate when component mounts
    socket.emit("authenticate", {
      token: localStorage.getItem("username"),
      username: user.username,
    });
    // Listen for authentication success
    socket.on("authenticated", () => {
      console.log("Socket authenticated");
    });

    // Listen for room events
    socket.on("roomCreated", ({ roomCode, playerColor }) => {
      navigate(`/chess/${roomCode}`, { state: { playerColor } });
    });

    socket.on("roomJoined", ({ roomCode, playerColor }) => {
      navigate(`/chess/${roomCode}`, { state: { playerColor } });
    });

    socket.on("roomsList", (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      alert(error);
    });
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });

    return () => {
      socket.off("authenticated");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("roomsList");
      socket.off("error");
    };
  }, [user.username, navigate]);

  const handleCreateRoom = () => {
    socket.emit("createRoom", { username: user.username });
  };

  const handleJoinRoom = () => {
    if (roomCode) {
      socket.emit("joinRoom", { roomCode });
    }
  };

  const handlePlayLocally = () => {
    navigate("/chess");
  };
  return (
    <div className="gameroom-app">
      <div className="game-container">
        <div className="game-content">
          {/* Title */}
          <h1 className="game-title">Game Room</h1>

          {/* Buttons Container */}
          <div className="controls-container">
            {/* Create Room */}
            <button onClick={handleCreateRoom} className="btn btn-create">
              ➕ Create Room
            </button>

            {/* Join Room */}
            <div className="join-container">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="room-input"
              />
              <button onClick={handleJoinRoom} className="btn btn-join">
                Join
              </button>
            </div>

            {/* Play Locally */}
            <button onClick={handlePlayLocally} className="btn btn-play">
              🎮 Play Locally
            </button>
          </div>

          {/* Available Rooms */}
          <div className="rooms-section">
            <h2 className="rooms-title">Available Rooms</h2>

            <div className="rooms-container">
              {availableRooms.length === 0 ? (
                <p className="no-rooms">No rooms available</p>
              ) : (
                <div className="room-list">
                  {availableRooms.map((room) => (
                    <div key={room.code} className="room-item">
                      <span className="room-code" color="black">
                        Room Code: {room.code}
                      </span>
                      <button
                        onClick={() => {
                          setRoomCode(room.code);
                          handleJoinRoom();
                        }}
                        className="btn btn-join-small"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
