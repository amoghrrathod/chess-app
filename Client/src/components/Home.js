import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold">Welcome, {user.username}!</h2>
      <div className="space-y-4">
        <button
          className="w-full bg-blue-500 text-white py-2 rounded"
          onClick={() => navigate("/room")}
        >
          Play Chess
        </button>

        <button
          className="w-full bg-green-500 text-white py-2 rounded"
          onClick={() => navigate("/game2")} // Assuming you have a route for Game2
        >
          Play Game 2
        </button>
      </div>
    </div>
  );
};

export default Home;
