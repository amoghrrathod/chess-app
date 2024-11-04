import React, { useState } from "react";

const Chat = ({ messages, socket }) => {
  const [messageInput, setMessageInput] = useState("");

  const sendMessage = () => {
    if (messageInput.trim()) {
      socket.emit("chatMessage", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}: </strong>
            {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Type your message..."
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
