/**
 * http.js — HTTP client dùng chung cho blog-public
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

  async _fetch(path, options) {
    let res = await fetch(`${API_BASE}${path}`, options);

    // Auto-refresh token if 401 and not already a refresh request
    if (res.status === 401 && typeof Auth !== 'undefined' && !path.includes('/auth/refresh')) {
      try {
        const newData = await Auth.refresh();
        if (options.headers && options.headers['Authorization']) {
          options.headers['Authorization'] = `Bearer ${newData.accessToken}`;
        }
        // Retry original request
        res = await fetch(`${API_BASE}${path}`, options);
      } catch (err) {
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `login.html?returnUrl=${returnUrl}`;
        throw new Error('Session expired');
      }
    }

    return this._handle(res);
  },

  async _handle(res) {
    if (!res) return null;

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        msg = body.message || body.error || msg;
      } catch (_) { }
      throw new Error(msg);
    }

    if (res.status === 204) return null;
    const json = await res.json();

    // Unwrap ApiResponse wrapper: { success, message, data } → return data
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data;
    }
    return json;
  },

  async get(path) {
    return this._fetch(path, { method: 'GET', headers: this._headers(false) });
  },

  async post(path, data) {
    return this._fetch(path, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data),
    });
  },

  async put(path, data) {
    return this._fetch(path, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(data),
    });
  },

  async delete(path) {
    return this._fetch(path, {
      method: 'DELETE',
      headers: this._headers(false),
    });
  },
};
