// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login"; // Ensure this path is correct
import Register from "./components/Register"; // Import Register
import ChessGame from "./components/ChessGame"; // Assuming this is your chess component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chess" element={<ChessGame />} />
      </Routes>
    </Router>
  );
};

export default App;
