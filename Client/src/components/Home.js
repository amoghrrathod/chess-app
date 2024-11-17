import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import chess_img from "./chess.jpg";
import sonic_img from "./sonic.png";
const games = [
  {
    id: 1,
    title: "Chess Game",
    description:
      "Play chess against other players. Challenge your strategic thinking and improve your skills in this classic board game.",
    image: chess_img,
    route: "/room",
    players: "2 Players",
    difficulty: "Intermediate",
  },
  {
    id: 2,
    title: "Sonic Adventure",
    description:
      "Classic platformer with Sonic the Hedgehog. Speed through amazing levels, collect rings, and defeat Dr. Robotnik!",
    image: sonic_img,
    route: "/sonic",
    players: "1 Player",
    difficulty: "All Levels",
  },
];

function Home({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    user = null;
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="home-app">
      <div className="container">
        {user && (
          <div className="welcome-card">
            <div className="welcome-header">
              <div>
                <h2 className="welcome-text">
                  Welcome back, {user.username}! 🎮
                </h2>
                <p className="welcome-subtext">
                  Ready to continue your gaming adventure?
                </p>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        )}
        <h1 className="gallery-title">My Games</h1>

        <div className="game-gallery">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card"
              onClick={() => navigate(game.route)}
            >
              <div className="game-image-container">
                <img src={game.image} alt={game.title} className="game-image" />
                <div className="game-image-overlay"></div>
              </div>

              <div className="game-content">
                <div className="game-header">
                  <h2 className="game-title">{game.title}</h2>
                  <div className="game-meta">
                    <span className="game-badge badge-players">
                      {game.players}
                    </span>
                    <span className="game-badge badge-difficulty">
                      {game.difficulty}
                    </span>
                  </div>
                </div>

                <p className="game-description">{game.description}</p>

                <div className="play-now">
                  Play Now
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
