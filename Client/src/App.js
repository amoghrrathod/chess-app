import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import Chess from "./components/ChessGame";
import GameRoom from "./components/GameRoom";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/home" element={<Home user={user} />} />
        <Route path="/room" element={<GameRoom user={user} />} />
        <Route path="/chess" element={<Chess user={user} />} />
        <Route path="/chess/:roomCode" element={<Chess user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
