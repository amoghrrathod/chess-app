import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ user }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto p-4">
      <div className="w-full max-w-2xl mx-auto border rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Welcome to Chess Game</h2>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            <button
              className="w-full bg-blue-500 text-white py-2 rounded"
              onClick={() => navigate("/room")}
            >
              Play Online
            </button>

            <button
              className="w-full bg-green-500 text-white py-2 rounded"
              onClick={() => navigate("/chess")}
            >
              Play Locally
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
