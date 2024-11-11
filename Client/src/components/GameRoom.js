import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
const socket = io("http://localhost:5569");
const GameRoom = ({ user }) => {
  const [rooms, setRooms] = useState([]);
  const [gameCode, setGameCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for available rooms
    socket.on("roomsList", (roomsList) => {
      setRooms(roomsList);
    });

    socket.on("roomJoined", ({ roomCode, playerColor }) => {
      navigate(`/chess/${roomCode}`, { state: { playerColor } });
    });

    return () => {
      socket.off("roomsList");
      socket.off("roomJoined");
    };
  }, [navigate]);

  const createGame = () => {
    console.log("Create Game button clicked");
    console.log("User :", user);
    if (user?.username) {
      socket.emit("createRoom", { username: user.username });
    } else {
      console.error("User  is not defined or username is missing");
    }
  };

  const joinGame = () => {
    if (gameCode) {
      socket.emit("joinRoom", { roomCode: gameCode, username: user?.username });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-2xl mx-auto border rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">
            Welcome, {user?.username || "Guest"}
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                className="w-full bg-blue-500 text-white py-2 rounded"
                onClick={createGame}
              >
                Create New Game
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                className="border rounded p-2 flex-1"
              />
              <button
                className="bg-green-500 text-white py-2 rounded"
                onClick={joinGame}
              >
                Join Game
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Available Rooms</h3>
              <div className="grid gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.code}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">Room: {room.code}</p>
                      <p className="text-sm text-gray-600">Host: {room.host}</p>
                    </div>
                    <button
                      className="bg-blue-500 text-white py-2 rounded"
                      onClick={() => {
                        setGameCode(room.code);
                        joinGame();
                      }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
