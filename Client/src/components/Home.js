// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h2>Home Page</h2>
            <Link to="/game1">Game 1</Link>
            <Link to="/game2">Game 2</Link>
        </div>
    );
}

export default Home;
