'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';

export default function ChatWidget() {
  const chat = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isTyping]);

  return (
    <div className={`chat-widget ${chat.isOpen ? 'open' : ''}`}>
      <div className="chat-window">
        <div className="chat-header">
          <div className="avatar">C</div>
          <div className="info">
            <div className="name">Cloudie Bot</div>
            <div className="status">
              {chat.isTyping ? 'typing...' : "we're online!"}
            </div>
          </div>
          <button className="close-btn" onClick={chat.toggle}>
            ×
          </button>
        </div>

        <div className="chat-body">
          {chat.messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.from}`}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          ))}

          {/* Typing indicator */}
          {chat.isTyping && (
            <div className="chat-msg bot chat-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic follow-up suggestions */}
        {chat.followUps.length > 0 && !chat.isTyping && (
          <div className="chat-quick">
            {chat.followUps.map((text) => (
              <button key={text} onClick={() => chat.handleQuickReply(text)}>
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-wrap">
          <input
            type="text"
            placeholder="Type your message..."
            value={chat.input}
            onChange={(e) => chat.setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && chat.sendMessage(chat.input)}
          />
          <button className="send-btn" onClick={() => chat.sendMessage(chat.input)}>
            →
          </button>
        </div>
      </div>

      <button className="chat-toggle" onClick={chat.toggle}>
        💬
        <div className="badge-dot" />
      </button>
    </div>
  );
}
