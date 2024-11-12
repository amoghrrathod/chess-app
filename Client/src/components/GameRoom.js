import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:80");

const GameRoom = ({ user }) => {
  const [roomCode, setRoomCode] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Authenticate the user when the component mounts
    socket.emit("authenticate", { username: user.username });

    // Listen for the list of available rooms
    socket.on("roomsList", (rooms) => {
      setAvailableRooms(rooms);
    });

    // Clean up the socket listener on unmount
    return () => {
      socket.off("roomsList");
    };
  }, [user.username]);

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateGameCode();
    socket.emit("createRoom", { username: user.username }); // Emit create room event
    navigate(`/chess/${code}`); // Navigate to the room
  };

  const handleJoinRoom = () => {
    if (roomCode) {
      socket.emit("joinRoom", { roomCode });
      navigate(`/chess/${roomCode}`); // Navigate to the chess game
    }
  };

  const handlePlayLocally = () => {
    navigate("/chess"); // Navigate to the local chess game component
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
            onChange={(e) => setRoomCode(e.target.value)}
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
        <ul>
          {availableRooms.map((room) => (
            <li key={room.code}>
              Room Code: {room.code}, Host: {room.host}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameRoom;
