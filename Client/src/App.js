// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import Chess from "./components/ChessGame";
import Game2 from "./components/Game2";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/game2" element={<Game2 />} />
      </Routes>
    </Router>
  );
}

export default App;
