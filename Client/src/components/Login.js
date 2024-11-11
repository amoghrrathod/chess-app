import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

import io from "socket.io-client";
class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.username = null;
  }

  connect(token, username) {
    if (this.socket) {
      return;
    }

    this.token = token;
    this.username = username;

    this.socket = io("http://localhost:5569", {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.authenticate();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return this.socket;
  }

  authenticate() {
    if (this.socket && this.token && this.username) {
      this.socket.emit("authenticate", {
        token: this.token,
        username: this.username,
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Helper methods for game actions
  createRoom() {
    if (this.socket) {
      this.socket.emit("createRoom", { username: this.username });
    }
  }

  joinRoom(roomCode) {
    if (this.socket) {
      this.socket.emit("joinRoom", { roomCode });
    }
  }

  makeMove(roomCode, move, fen) {
    if (this.socket) {
      this.socket.emit("makeMove", { roomCode, move, fen });
    }
  }

  // Add event listeners
  onAuthenticated(callback) {
    if (this.socket) {
      this.socket.on("authenticated", callback);
    }
  }

  onAuthError(callback) {
    if (this.socket) {
      this.socket.on("authError", callback);
    }
  }

  onRoomsList(callback) {
    if (this.socket) {
      this.socket.on("roomsList", callback);
    }
  }

  onRoomJoined(callback) {
    if (this.socket) {
      this.socket.on("roomJoined", callback);
    }
  }

  onGameStart(callback) {
    if (this.socket) {
      this.socket.on("gameStart", callback);
    }
  }

  onMoveMade(callback) {
    if (this.socket) {
      this.socket.on("moveMade", callback);
    }
  }

  onPlayerLeft(callback) {
    if (this.socket) {
      this.socket.on("playerLeft", callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }
}

const socketService = new SocketService();
function Login({ setUser }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullname: "",
    email: "",
    signupUsername: "", // New field for signup username
    repeatPassword: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "login" ? "signup" : "login"));
    setFormData({
      username: "",
      password: "",
      fullname: "",
      email: "",
      signupUsername: "",
      repeatPassword: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === "signup") {
      if (!formData.fullname.trim()) {
        newErrors.fullname = "Full name is required";
      }

      if (!formData.signupUsername.trim()) {
        newErrors.signupUsername = "Username is required";
      } else if (formData.signupUsername.length < 3) {
        newErrors.signupUsername = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.signupUsername)) {
        newErrors.signupUsername =
          "Username can only contain letters, numbers, and underscores";
      }

      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }

      if (formData.password.length < 4) {
        newErrors.password = "Password must be at least 4 characters";
      }

      if (formData.password !== formData.repeatPassword) {
        newErrors.repeatPassword = "Passwords do not match";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (!formData.username && mode === "login") {
      newErrors.username = "Username or email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  // In your Login.js component, update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const response = await fetch(`http://localhost${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? {
                username: formData.username,
                password: formData.password,
              }
            : {
                username: formData.signupUsername,
                password: formData.password,
                fullname: formData.fullname,
                email: formData.email,
              },
        ),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("chessToken", data.token);

        if (setUser) {
          setUser(data.user);
        }

        // Initialize socket connection
        socketService.connect(data.token, data.user.username);

        navigate("/home");
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: data.message || "An error occurred",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: "Network error. Please try again.",
      }));
    }
  };

  const renderError = (fieldName) => {
    return (
      errors[fieldName] && (
        <div
          className="error-message"
          style={{
            color: "#ff6b6b",
            fontSize: "12px",
            marginTop: "-10px",
            marginBottom: "10px",
          }}
        >
          {errors[fieldName]}
        </div>
      )
    );
  };

  return (
    <div className={`app app--is-${mode}`}>
      <div className={`form-block-wrapper form-block-wrapper--is-${mode}`} />
      <section className={`form-block form-block--is-${mode}`}>
        <header className="form-block__header">
          <h1>{mode === "login" ? "Welcome back!" : "Sign up"}</h1>
          <div className="form-block__toggle-block">
            <span>
              {mode === "login" ? "Don't" : "Already"} have an account? Click
              here →
            </span>
            <input id="form-toggler" type="checkbox" onClick={toggleMode} />
            <label htmlFor="form-toggler"></label>
          </div>
        </header>

        {errors.submit && (
          <div
            className="error-message"
            style={{
              color: "#ff6b6b",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-block__input-wrapper">
            <div className="form-group form-group--login">
              {mode === "login" && (
                <>
                  <input
                    type="text"
                    id="username"
                    className="form-group__input"
                    placeholder="Username or Email"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {renderError("username")}
                  <input
                    type="password"
                    id="password"
                    className="form-group__input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {renderError("password")}
                </>
              )}
            </div>
            <div className="form-group form-group--signup">
              {mode === "signup" && (
                <>
                  <input
                    type="text"
                    id="fullname"
                    className="form-group__input"
                    placeholder="Full Name"
                    value={formData.fullname}
                    onChange={handleChange}
                  />
                  {renderError("fullname")}
                  <input
                    type="text"
                    id="signupUsername"
                    className="form-group__input"
                    placeholder="Username"
                    value={formData.signupUsername}
                    onChange={handleChange}
                  />
                  {renderError("signupUsername")}
                  <input
                    type="email"
                    id="email"
                    className="form-group__input"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {renderError("email")}
                  <input
                    type="password"
                    id="password"
                    className="form-group__input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {renderError("password")}
                  <input
                    type="password"
                    id="repeatPassword"
                    className="form-group__input"
                    placeholder="Repeat Password"
                    value={formData.repeatPassword}
                    onChange={handleChange}
                  />
                  {renderError("repeatPassword")}
                </>
              )}
            </div>
          </div>
          <button className="button button--primary full-width" type="submit">
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;
