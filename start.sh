#!/usr/bin/env bash
cd ./frontend
PORT=8080 npm run start &
cd ../game-backend/
sudo node server.js 
