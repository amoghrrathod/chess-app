import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import ChessGame from "./components/ChessGame";
import Game2 from "./components/Game2"; // Assuming you have another game component
import { io } from "socket.io-client";

function App() {
  const [user, setUser] = useState(null);
  const socket = io("http://localhost:80"); // Update port if necessary

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
