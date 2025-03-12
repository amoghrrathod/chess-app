// file App.js
import React, { useState, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import GameRoom from "./components/GameRoom";
import ChessGame from "./components/ChessGame";
import Aboutus from "./components/Aboutus";

const SonicGame = React.lazy(() => import("./components/SonicGame"));

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
        <Route
          path="/sonic"
          element={
            <Suspense
              fallback={<div className="loader">Loading Sonic Game...</div>}
            >
              <SonicGame />
            </Suspense>
          }
        />
        <Route path="/about" element={<Aboutus />} />
      </Routes>
    </Router>
  );
};

export default App;
