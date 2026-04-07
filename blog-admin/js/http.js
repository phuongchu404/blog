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

  async _fetch(path, options) {
    let res = await fetch(`${API_BASE}${path}`, options);

    // Xử lý tự động dùng Refresh Token khi hết hạn (401)
    if (res.status === 401 && typeof Auth !== 'undefined' && !path.includes('/auth/refresh')) {
      try {
        const newData = await Auth.refresh(); // Thử gọi lấy token mới
        if (options.headers && options.headers['Authorization']) {
          options.headers['Authorization'] = `Bearer ${newData.accessToken}`;
        }
        // Gọi lại original request
        res = await fetch(`${API_BASE}${path}`, options);
      } catch (err) {
        // Hết cứu (refresh token hỏng/hết hạn), đá ra login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = Auth._loginPath();
        return;
      }
    }

    return this._handle(res);
  },

  async _handle(res) {
    if (!res) return null;

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof Auth !== 'undefined') {
        window.location.href = Auth._loginPath();
      } else {
        window.location.href = '../login.html';
      }
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

  async upload(path, formData) {
    return this._fetch(path, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._token()}`
        // Do NOT set Content-Type here; browser will automatically set multipart/form-data with boundaries
      },
      body: formData,
    });
  },
};
