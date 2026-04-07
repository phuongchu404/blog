/**
 * Login Page Logic
 */

// Nếu đã đăng nhập thì chuyển thẳng vào dashboard
if (Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
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
        window.location.href = 'index.html';
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
