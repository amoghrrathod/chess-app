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
        <h1>Chess </h1>
        <nav>
          <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </nav>
        <h1>Chess Application</h1>
        {!isAuthenticated ? (
          <nav>
            <Link to="/login">Login</Link> |{" "}
            <Link to="/register">Register</Link>
          </nav>
        ) : (
          <p>Welcome to the chess game!</p>
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
    </Router>
  );
}

export default App;
