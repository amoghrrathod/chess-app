<<<<<<< HEAD
// src/components/Register.js

import React, { useState } from "react";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
=======
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
>>>>>>> 5ec6c8c433e90bc463a491b0da6bce97ee450e3d

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      setSuccess(data.message);
      setUsername(""); // Clear input
      setPassword(""); // Clear input
      setError("");
    } catch (error) {
      setError(error.message);
      setSuccess("");
    }
=======
    console.log("Username:", username, "Email:", email, "Password:", password);
    onRegister(); // Call the onRegister prop to update the app state
    navigate("/chess"); // Redirect to the chess game after registration
>>>>>>> 5ec6c8c433e90bc463a491b0da6bce97ee450e3d
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
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
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
