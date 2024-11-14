import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5569", {
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
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold">Game Room</h2>
      <div className="space-y-4">
        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={handleCreateRoom}
        >
          Create Room
        </button>

        <div>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="border p-2 rounded w-full"
          />
          <button
            className="w-full bg-green-500 text-white py-2 rounded mt-2"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
        </div>

        <button
          className="w-full bg-yellow-500 text-white py-2 rounded"
          onClick={handlePlayLocally}
        >
          Play Locally
        </button>

        <h3 className="text-lg font-semibold">Available Rooms:</h3>
        <ul className="space-y-2">
          {availableRooms.map((room) => (
            <li key={room.code} className="border p-2 rounded">
              Room Code: {room.code} - Host: {room.host}
              <button
                className="ml-4 bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setRoomCode(room.code);
                  handleJoinRoom();
                }}
              >
                Join
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameRoom;
