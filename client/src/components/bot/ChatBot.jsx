import React, { useState } from 'react';
import './ChatIcon.css';
import apis from '../../utils/apis'; // ✅ Ensure path is correct

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! Ask me anything.' }]);
  const [input, setInput] = useState('');

  const toggleChat = () => setOpen(!open);


  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch(apis().getChat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      if (response.ok) {
        const botMsg = { sender: 'bot', text: data.reply };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Bot error: ' + data.error }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Network error.' }]);
    }
  };


  return (
    <div>
      <div className="chat-icon" onClick={toggleChat}>💬</div>

      {open && (
        <div className="chat-box">
          <div className="chat-header">
            ChatBot <button onClick={toggleChat}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={msg.sender === 'bot' ? 'bot-msg' : 'user-msg'}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
