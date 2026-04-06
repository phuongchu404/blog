/**
 * http.js — HTTP client dùng chung cho blog-public
 */

const API_BASE = localStorage.getItem('apiBaseUrl') || 'http://localhost:8080';

const Http = {
  _token() {
    return localStorage.getItem('token');
  },

  _headers(isJson = true) {
    const h = {};
    if (isJson) h['Content-Type'] = 'application/json';
    const token = this._token();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async _handle(res) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Không redirect tự động — để auth.js xử lý
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        msg = body.message || body.error || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this._headers(false),
    });
    return this._handle(res);
  },

  async post(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data),
    });
    return this._handle(res);
  },

  async put(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(data),
    });
    return this._handle(res);
  },

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this._headers(false),
    });
    return this._handle(res);
  },
};
