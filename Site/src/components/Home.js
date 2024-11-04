// src/components/Home.js

import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const Home = () => {
  const [showLogin, setShowLogin] = useState(false); // Toggle for login/register

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Welcome to the Chess Game</h1>
      <div className="slider">
        <button onClick={toggleForm}>
          {showLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
      {showLogin ? <Login /> : <Register />}
    </div>
  );
};

export default Home;
