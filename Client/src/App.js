import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import GameRoom from "./components/GameRoom";
import ChessGame from "./components/ChessGame";
// import LocalChessGame from "./LocalChessGame"; // Import your local chess game component

const App = () => {
  const [user, setUser] = useState(null); // Initialize user state

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/home" element={<Home user={user} />} />
        <Route path="/room" element={<GameRoom user={user} />} />
        <Route path="/chess/:roomCode" element={<ChessGame user={user} />} />
        <Route path="/chess" element={<ChessGame user={user} />} />
      </Routes>
    </Router>
  );
};

export default App;
