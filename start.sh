#!/usr/bin/env bash
cd ./frontend
npm run start &
cd ../game-backend/
sudo node server.js
