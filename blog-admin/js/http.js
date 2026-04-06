/**
 * http.js — Cấu hình base URL và HTTP helper dùng chung
 * Phụ thuộc: không có
 */

const API_BASE = localStorage.getItem('apiBaseUrl') || 'http://localhost:8055';

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
      localStorage.removeItem('user');
      window.location.href = Auth._loginPath();
      return;
    }
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const body = await res.json(); msg = body.message || body.error || msg; } catch (_) { }
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    const json = await res.json();
    // Unwrap ApiResponse wrapper: { success, message, data } → trả về data
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data;
    }
    return json;
  },

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: this._headers(false) });
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
