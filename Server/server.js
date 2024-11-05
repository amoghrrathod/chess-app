// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
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

// Login endpoint with password comparison
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username or email
        const user = await User.findOne({ 
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            logger.warn(`Failed login attempt - user not found: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Failed login attempt - incorrect password for user: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        logger.info(`Login successful for user: ${username}`);
        
        // Return user data (excluding password)
        const userData = user.toObject();
        delete userData.password;
        
        return res.status(200).json({ 
            message: 'Login successful!',
            user: userData
        });
    } catch (error) {
        logger.error(`Server error on login attempt for user: ${username} - ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password, fullname } = req.body;

    try {
        // Validate username format
        if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ 
                message: 'Username must be at least 3 characters and can only contain letters, numbers, and underscores'
            });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            logger.warn(`Registration failed - user already exists: ${email}`);
            return res.status(400).json({ 
                message: existingUser.email === email ? 
                    'Email already registered' : 
                    'Username already taken'
            });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            password,
            fullname
        });

        await newUser.save();
        
        logger.info(`New user registered: ${email}`);

        // Return user data (excluding password)
        const userData = newUser.toObject();
        delete userData.password;

        res.status(201).json({
            message: 'Registration successful!',
            user: userData
        });
    } catch (error) {
        logger.error(`Registration error for email ${email}: ${error.message}`);
        res.status(500).json({ 
            message: error.code === 11000 ? 
                'Email or username already exists' : 
                'Server error during registration'
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});