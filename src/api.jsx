// frontend/src/api.jsx
const rawBase = import.meta.env.VITE_API_BASE || (
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:4000/api'
    : '/api'
);

// strip trailing slash if present
export const API_BASE = rawBase.replace(/\/+$/, ''); // no trailing slash

async function safeFetch(path, opts) {
  // ensure path starts with a single slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return { success: false, raw: text, status: res.status }; }
}

export const getMessages = () => safeFetch('/messages');
export const postMessage = (text, model) => safeFetch('/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, model })
});
export const clearMessages = () => safeFetch('/messages/clear', { method: 'POST' });
export const getModels = () => safeFetch('/models');
export const getStats = () => safeFetch('/messages/stats');

export default { getMessages, postMessage, clearMessages, getModels, getStats };
