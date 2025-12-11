// frontend/src/api.jsx
const API_BASE = import.meta.env.VITE_API_BASE || (
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:4000/api'
    : '/api'
);

export const getMessages = async () => {
  const res = await fetch(`${API_BASE}/messages`);
  return res.json();
};

export const postMessage = async (text, model) => {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model })
  });
  return res.json();
};

export const clearMessages = async () => {
  const res = await fetch(`${API_BASE}/messages/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }});
  return res.json();
};

export const getModels = async () => {
  const res = await fetch(`${API_BASE}/models`);
  return res.json();
};

export const getStats = async () => {
  const res = await fetch(`${API_BASE}/messages/stats`);
  return res.json();
};

export default { getMessages, postMessage, clearMessages, getModels, getStats };
