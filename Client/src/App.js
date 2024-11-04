// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ChessGame from "./components/ChessGame"; // Assuming Game1.js is renamed
import Game2 from "./components/Game2";
import { io } from "socket.io-client";

function App() {
  const [user, setUser] = useState(null);
  const socket = io("http://localhost:80"); // Update the port if necessary

  // Fetch user details after login
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("http://localhost:80/api/user");
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/game1"
          element={<ChessGame user={user} socket={socket} />}
        />
        <Route path="/game2" element={<Game2 />} />
      </Routes>
    </Router>
  );
}

export default App;
