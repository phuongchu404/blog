/**
 * auth.js — Xác thực người dùng (public site)
 * Phụ thuộc: http.js
 */

const Auth = {
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (_) { return null; }
  },

  /** Đăng nhập — lưu token vào localStorage */
  async login(username, password) {
    const data = await Http.post('/auth/login', { username, password });
    localStorage.setItem('token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    // Lấy thông tin user
    const user = await Http.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  /** Đăng ký tài khoản mới */
  async register(data) {
    return Http.post('/auth/register', data);
  },

  /** Lấy thông tin user hiện tại (từ server) */
  async me() {
    return Http.get('/auth/me');
  },

  /** Làm mới access token */
  async refresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const data = await Http.post('/auth/refresh', { refreshToken });
    localStorage.setItem('token', data.accessToken);
    return data;
  },

  /** Đăng xuất */
  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      Http.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  /** Yêu cầu đăng nhập để thực hiện hành động (không redirect, trả về false) */
  requireLogin() {
    if (!this.isLoggedIn()) {
      UI.toast('Bạn cần đăng nhập để thực hiện thao tác này.', 'info');
      return false;
    }
    return true;
  },
};
