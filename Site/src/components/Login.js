<<<<<<< HEAD
// src/components/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
=======
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
>>>>>>> 5ec6c8c433e90bc463a491b0da6bce97ee450e3d
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    // Basic validation
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // User exists and credentials are correct
        const data = await response.json();
        console.log(data.message);
        navigate("/chess"); // Redirect to chess game after login
      } else if (response.status === 401) {
        // User does not exist, redirect to register
        navigate("/register");
      } else {
        const data = await response.json();
        setError(data.message); // Display error message
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred. Please try again.");
    }
=======
    console.log("Email:", email, "Password:", password);
    onLogin(); // Call the onLogin prop to update the app state
    navigate("/chess"); // Redirect to the chess game after login
>>>>>>> 5ec6c8c433e90bc463a491b0da6bce97ee450e3d
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
