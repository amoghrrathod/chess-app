<<<<<<< HEAD
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
=======
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ChessGame from "./components/ChessGame";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>Chess 2.0</h1>
        {!isAuthenticated ? (
          <nav>
            <Link to="/login">Login</Link> |{" "}
            <Link to="/register">Register</Link>
          </nav>
        ) : (
          <p>Welcome to Chess!</p>
        )}
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/register"
            element={<Register onRegister={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/chess"
            element={
              isAuthenticated ? (
                <ChessGame />
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
        </Routes>
      </div>
>>>>>>> 5ec6c8c433e90bc463a491b0da6bce97ee450e3d
    </Router>
  );
};

export default App;
