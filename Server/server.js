// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./db');
const logger = require('./logger');
const User = require('./User');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
connectDB();

// Sample login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (user) {
            logger.info(`Login successful for user: ${username}`);
            return res.status(200).json({ message: 'Login successful!' });
        }
        logger.warn(`Failed login attempt for user: ${username}`);
        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        logger.error(`Server error on login attempt for user: ${username} - ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
