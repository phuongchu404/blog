/**
 * http.js — Cấu hình base URL và HTTP helper dùng chung
 * Phụ thuộc: không có
 */

const DEFAULT_API_BASE = 'http://localhost:8055';
const DEFAULT_PUBLIC_BASE = 'http://localhost:5500';

const AppConfig = {
  getApiBaseUrl() {
    return this._normalizeBaseUrl(
      localStorage.getItem('apiBaseUrl')
      || window.APP_CONFIG?.apiBaseUrl
      || DEFAULT_API_BASE
    );
  },

  setApiBaseUrl(value) {
    const normalized = this._normalizeBaseUrl(value) || DEFAULT_API_BASE;
    localStorage.setItem('apiBaseUrl', normalized);
    return normalized;
  },

  getPublicBaseUrl() {
    return this._normalizeBaseUrl(
      localStorage.getItem('publicBaseUrl')
      || window.APP_CONFIG?.publicBaseUrl
      || DEFAULT_PUBLIC_BASE
    );
  },

  setPublicBaseUrl(value) {
    const normalized = this._normalizeBaseUrl(value) || DEFAULT_PUBLIC_BASE;
    localStorage.setItem('publicBaseUrl', normalized);
    return normalized;
  },

  buildPublicUrl(path = '', query = null, hash = '') {
    const base = this.getPublicBaseUrl();
    const normalizedPath = String(path || '').replace(/^\/+/, '');
    const url = new URL(normalizedPath, `${base}/`);
    if (query && typeof query === 'object') {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.set(key, String(val));
        }
      });
    }
    if (hash) url.hash = hash.startsWith('#') ? hash : `#${hash}`;
    return url.toString();
  },

  _normalizeBaseUrl(value) {
    if (!value) return '';
    return String(value).trim().replace(/\/+$/, '');
  },
};

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
    const apiBaseUrl = AppConfig.getApiBaseUrl();
    let res = await fetch(`${apiBaseUrl}${path}`, options);

    // Xử lý tự động dùng Refresh Token khi hết hạn (401)
    if (res.status === 401 && typeof Auth !== 'undefined' && !path.includes('/auth/refresh')) {
      try {
        const newData = await Auth.refresh(); // Thử gọi lấy token mới
        if (options.headers && options.headers['Authorization']) {
          options.headers['Authorization'] = `Bearer ${newData.accessToken}`;
        }
        // Gọi lại original request
        res = await fetch(`${apiBaseUrl}${path}`, options);
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
      try {
        const body = await res.json();
        msg = body.message || body.error || msg;
      } catch (_) { }
      throw new Error(msg);
    }

    if (res.status === 204) return null;

    const text = await res.text();
    if (!text) return null;

    try {
      const json = JSON.parse(text);
      // Unwrap ApiResponse wrapper: { success, message, data } → trả về data
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data;
      }
      return json;
    } catch (err) {
      return text; // Return as text if not JSON
    }
  },

  async get(path) {
    return this._fetch(path, { method: 'GET', headers: this._headers(false), cache: 'no-store' });
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
