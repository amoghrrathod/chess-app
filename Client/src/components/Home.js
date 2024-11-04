import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <h2>Home Page</h2>
      <Link to="/game1">Play Chess</Link>
      {/* Add links to other games or features here */}
    </div>
  );
}

export default Home;
