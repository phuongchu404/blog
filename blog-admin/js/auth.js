/**
 * auth.js — Xác thực người dùng (login, logout, guard, token)
 * Phụ thuộc: http.js
 */

const Auth = {
  _loginPath() {
    console.log("pathname", window.location.pathname);
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    console.log("depth", depth);
    const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
    return prefix + 'login.html';
  },

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  /** Chuyển hướng về login nếu chưa đăng nhập */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = this._loginPath();
    }
  },

  /** Đăng nhập — lưu token vào localStorage */
  async login(username, password) {
    const data = await Http.post('/auth/login', { username, password });
    localStorage.setItem('token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  /** Lấy thông tin user hiện tại */
  async me() {
    return Http.get('/auth/me');
  },

  /** Làm mới access token bằng refresh token */
  async refresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    const data = await Http.post('/auth/refresh', { refreshToken });
    localStorage.setItem('token', data.accessToken);
    return data;
  },

  /** Đăng xuất — xóa token và chuyển về trang login */
  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      Http.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = this._loginPath();
  },
};
