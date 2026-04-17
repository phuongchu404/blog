/**
 * Login Page Logic
 */

// Nếu đã đăng nhập thì kiểm tra quyền trước khi chuyển hướng
if (Auth.isLoggedIn()) {
  try {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      const permissions = user.permissions || [];
      window.location.href = UI.getFirstAccessiblePage(permissions) || 'unauthorized.html';
    } else {
      window.location.href = 'index.html';
    }
  } catch (e) {
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const alert = document.getElementById('loginAlert');
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Signing in...';
      }
      if (alert) alert.classList.add('d-none');

      try {
        await Auth.login(username, password);

        // Lấy thông tin user sau khi login để lưu và kiểm tra quyền
        const user = await Auth.me();
        localStorage.setItem('user', JSON.stringify(user));

        const permissions = user.permissions || [];
        window.location.href = UI.getFirstAccessiblePage(permissions) || 'unauthorized.html';
      } catch (err) {
        if (alert) {
          alert.textContent = err.message || 'Invalid username or password.';
          alert.classList.remove('d-none');
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Sign In';
        }
      }
    });
  }
});
