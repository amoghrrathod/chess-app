#!/bin/bash

# Function to get the local IP
get_local_ip() {
  ip=$(ip addr show wlan0 | awk '/inet / {print $2}' | cut -d'/' -f1)
  echo $ip
}

# Update the .env file in the server directory
update_env() {
  local ip=$(get_local_ip)
  if [[ -z "$ip" ]]; then
    echo "Error: Could not determine local IP address."
    exit 1
  fi

  sed -i "s/^LOCAL_IP=.*/LOCAL_IP=$ip/" ".env"
  echo "Updated LOCAL_IP in .env file to $ip"
}

# Start the client in a new Kitty window
run_client() {
  local client_path="$(pwd)/client"
  echo "Starting client in a new Kitty window..."
  kitty @ launch --title "Client" --cwd "$client_path" zsh -c "npm run start; exec zsh"
}

# Start the server in a new Kitty window
run_server() {
  local server_path="$(pwd)/server"
  echo "Starting server in a new Kitty window..."
  kitty @ launch --title "Server" --cwd "$server_path" zsh -c "sudo node server.js; exit"
}

# Main script logic
update_env
run_client
run_server
