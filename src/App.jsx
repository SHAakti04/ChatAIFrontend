// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from './api.jsx';
import './styles.css';

function DaySeparator({ dateStr }) {
  return (
    <div className="day-sep" aria-hidden>
      <span>{dateStr}</span>
    </div>
  );
}

function MessageBubble({ m }) {
  const cls = m.role === 'user' ? 'bubble user' : 'bubble ai';
  return (
    <div className={cls} title={`${m.tokens || 0} tokens • ${new Date(m.createdAt).toLocaleString()}`}>
      <div className="role">{m.role === 'user' ? 'You' : 'AI'}</div>
      <div className="text">{m.text}</div>
      <div className="meta">{m.tokens || 0} tokens</div>
    </div>
  );
}

// Typing indicator bubble
function TypingBubble() {
  return (
    <div className="message-row ai">
      <div className="bubble ai typing" aria-hidden>
        <div className="dots" aria-hidden>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// Group messages by day
function groupByDay(messages) {
  const groups = [];
  messages.forEach((m) => {
    const d = new Date(m.createdAt);
    const key = d.toISOString().slice(0, 10);
    const existing = groups.find(g => g.dateKey === key);
    if (existing) existing.messages.push(m);
    else groups.push({ dateKey: key, date: d, messages: [m] });
  });
  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return groups;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [stats, setStats] = useState({ totalMessages: 0, totalTokens: 0 });
  const bottomRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [res, modelsRes, statsRes] = await Promise.all([
        api.getMessages(),
        api.getModels(),
        api.getStats()
      ]);
      if (res && res.success) setMessages(res.messages || []);
      if (modelsRes && modelsRes.success) {
        setModels(modelsRes.models || []);
        if (!selectedModel && modelsRes.models && modelsRes.models.length > 0) {
          setSelectedModel(modelsRes.models[0].id);
        }
      }
      if (statsRes && statsRes.success) setStats({ totalMessages: statsRes.totalMessages, totalTokens: statsRes.totalTokens });
    } catch (err) {
      console.error('FetchAll error:', err);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      setTimeout(() => bottomRef.current.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTyping(true);
    const userText = input.trim();
    setInput('');

    try {
      const res = await api.postMessage(userText, selectedModel);
      if (res && res.success) {
        setMessages(res.messages || []);
        const st = await api.getStats();
        if (st && st.success) setStats({ totalMessages: st.totalMessages, totalTokens: st.totalTokens });
      } else {
        console.error('Send failed', res);
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      const res = await api.clearMessages();
      if (res && res.success) {
        setMessages([]);
        setStats({ totalMessages: 0, totalTokens: 0 });
      } else {
        console.error('Clear failed', res);
      }
    } catch (err) {
      console.error('Clear error', err);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const grouped = groupByDay(messages);

  return (
    <div className="app">
      <h1 id="chat-title">AI Chat App</h1>

      <div className="chatContainer" role="application" aria-labelledby="chat-title">
        <div className="topbar" role="region" aria-label="Chat controls">
          <div className="controls">
            <label className="model-select">
              Model:
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>

            <div className="stats" aria-hidden>
              <div>{stats.totalMessages} msgs</div>
              <div>{stats.totalTokens} tokens</div>
            </div>

            <button className="clear-btn" onClick={clearAll} aria-label="Clear chat history">Clear</button>
          </div>
        </div>

        <div className="messages" role="log" aria-live="polite">
          {grouped.length === 0 ? (
            <div className="empty">No messages yet — say hi!</div>
          ) : (
            grouped.map(g => (
              <div key={g.dateKey} className="day-group">
                <DaySeparator dateStr={new Date(g.dateKey).toLocaleDateString()} />
                {g.messages.map(m => (
                  <div
                    key={m._id || m.createdAt}
                    className={`message-row ${m.role === 'user' ? 'user' : 'ai'}`}
                  >
                    <MessageBubble m={m} />
                  </div>
                ))}
              </div>
            ))
          )}

          {typing && <TypingBubble />}

          <div ref={bottomRef} />
        </div>

        <div className="inputBar" role="region" aria-label="Message input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            aria-label="Type a message"
          />
          <button onClick={send} disabled={loading} aria-label="Send message">
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
