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
    // Http._handle() tự động unwrap ApiResponse → nhận { accessToken, refreshToken, ... }
    const data = await Http.post('/auth/login', { username, password });
    console.log('login data', data);
    if (!data?.accessToken) throw new Error('Login failed: no access token received.');
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
    // Http._handle() tự động unwrap ApiResponse → nhận { accessToken, refreshToken }
    const data = await Http.post('/auth/refresh', { refreshToken });
    if (data?.accessToken) localStorage.setItem('token', data.accessToken);
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

// Global listener to capture clicks on logout links (any link pointing to login.html)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.getAttribute('href') && link.getAttribute('href').endsWith('login.html')) {
    e.preventDefault();
    Auth.logout();
  }
});
