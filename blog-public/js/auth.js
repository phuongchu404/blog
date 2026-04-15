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
    // Xóa session cũ TRƯỚC KHI gọi API để tránh refreshToken cũ can thiệp
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    const data = await Http.post('/auth/login', { username, password });
    if (!data?.accessToken) throw new Error('Đăng nhập thất bại: không nhận được token.');

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
    if (data?.accessToken) localStorage.setItem('token', data.accessToken);
    return data;
  },

  /** Đăng xuất */
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await Http.post('/auth/logout', { refreshToken });
      } catch (e) {
        console.error("Logout failed:", e);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html'; // Chuyển về home sau khi logout ở public site
  },

  /** Yêu cầu đăng nhập để thực hiện hành động — redirect về login.html nếu chưa đăng nhập */
  requireLogin() {
    if (!this.isLoggedIn()) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `login.html?returnUrl=${returnUrl}`;
      return false;
    }
    return true;
  },
};
