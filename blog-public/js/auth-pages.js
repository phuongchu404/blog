/**
 * auth-pages.js — Logic cho login, register, profile
 * Phụ thuộc: http.js, auth.js, ui.js
 */

const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:8055';

/* ══════════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════════ */

function setLoading(btnId, loading, text = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '...' : text;
}

function showFormError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.display = message ? 'block' : 'none';
}

function clearErrors(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
  document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function loginOAuth(provider) {
  window.location.href = `${API_BASE_URL}/oauth2/authorize/${provider}?redirect_uri=${encodeURIComponent(window.location.origin + '/index.html')}`;
}

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input')?.value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

/* ══════════════════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════════════════ */

async function handleLogin(e) {
  e.preventDefault();
  clearErrors('username-error', 'password-error', 'login-error');

  const username = document.getElementById('username')?.value.trim();
  const password = document.getElementById('password')?.value;
  let valid = true;

  if (!username) {
    document.getElementById('username')?.classList.add('error');
    showFormError('username-error', 'Vui lòng nhập tên đăng nhập');
    valid = false;
  }
  if (!password) {
    document.getElementById('password')?.classList.add('error');
    showFormError('password-error', 'Vui lòng nhập mật khẩu');
    valid = false;
  }
  if (!valid) return;

  setLoading('login-btn', true, 'Đăng nhập');
  try {
    await Auth.login(username, password);
    UI.toast('Đăng nhập thành công!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
  } catch (err) {
    showFormError('login-error', err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
  } finally {
    setLoading('login-btn', false, 'Đăng nhập');
  }
}

/* ══════════════════════════════════════════════════════
   REGISTER PAGE
══════════════════════════════════════════════════════ */

async function handleRegister(e) {
  e.preventDefault();
  clearErrors('username-error', 'email-error', 'password-error', 'confirmPassword-error', 'register-error');

  const fullName   = document.getElementById('fullName')?.value.trim();
  const username   = document.getElementById('username')?.value.trim();
  const email      = document.getElementById('email')?.value.trim();
  const password   = document.getElementById('password')?.value;
  const confirmPwd = document.getElementById('confirmPassword')?.value;
  let valid = true;

  if (!username) {
    document.getElementById('username')?.classList.add('error');
    showFormError('username-error', 'Vui lòng nhập tên đăng nhập');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('email')?.classList.add('error');
    showFormError('email-error', 'Vui lòng nhập email hợp lệ');
    valid = false;
  }
  if (!password || password.length < 6) {
    document.getElementById('password')?.classList.add('error');
    showFormError('password-error', 'Mật khẩu phải có ít nhất 6 ký tự');
    valid = false;
  }
  if (password !== confirmPwd) {
    document.getElementById('confirmPassword')?.classList.add('error');
    showFormError('confirmPassword-error', 'Mật khẩu xác nhận không khớp');
    valid = false;
  }
  if (!valid) return;

  setLoading('register-btn', true, 'Tạo tài khoản');
  try {
    await Auth.register({ username, email, password, fullName: fullName || undefined });
    UI.toast('Đăng ký thành công! Đang đăng nhập...', 'success');
    await Auth.login(username, password);
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  } catch (err) {
    showFormError('register-error', err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
  } finally {
    setLoading('register-btn', false, 'Tạo tài khoản');
  }
}

/* ══════════════════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════════════════ */

let profileUser = null;

function switchTab(tab, btn) {
  document.getElementById('tab-posts').style.display = tab === 'posts' ? 'block' : 'none';
  document.getElementById('tab-edit').style.display  = tab === 'edit'  ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.style.color = 'var(--text-muted)';
    b.style.borderBottom = 'none';
  });
  if (btn) {
    btn.style.color = 'var(--primary)';
    btn.style.borderBottom = '2px solid var(--primary)';
  }
}

function renderProfileHeader(user) {
  const el = document.getElementById('profile-header');
  if (!el) return;
  const avatar = UI.avatarUrl(user);
  const roles = (user.roles || []).map(r =>
    `<span class="tag-chip">${r}</span>`
  ).join('');

  el.innerHTML = `
    <div class="profile-header">
      <img class="profile-avatar" src="${avatar}" alt="${user.username}"
           onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
      <div class="profile-info">
        <h2>${user.fullName || user.username}</h2>
        <div class="profile-email">@${user.username}${user.email ? ' · ' + user.email : ''}</div>
        ${user.intro ? `<p style="font-size:.9rem;color:var(--text-muted);margin-top:.35rem">${user.intro}</p>` : ''}
        ${roles ? `<div class="profile-roles">${roles}</div>` : ''}
      </div>
    </div>`;
}

function populateEditForm(user) {
  const fields = { firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, email: user.email, mobile: user.mobile, intro: user.intro, imageUrl: user.imageUrl };
  for (const [key, val] of Object.entries(fields)) {
    const el = document.getElementById(`edit-${key}`);
    if (el) el.value = val || '';
  }
}

async function loadMyPosts(userId) {
  const grid = document.getElementById('my-posts-grid');
  if (!grid) return;
  UI.loading(grid, 'Đang tải bài viết...');
  try {
    const posts = await PostService.getByAuthor(userId);
    const list = Array.isArray(posts) ? posts : (posts?.content || []);
    if (!list.length) { UI.emptyState(grid, 'Bạn chưa có bài viết nào'); return; }
    grid.innerHTML = list.map(p => UI.postCard(p)).join('');
  } catch (_) {
    UI.emptyState(grid, 'Không thể tải bài viết');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  clearErrors('profile-update-error');
  if (!profileUser) return;

  const data = {
    firstName: document.getElementById('edit-firstName')?.value.trim() || undefined,
    lastName:  document.getElementById('edit-lastName')?.value.trim()  || undefined,
    fullName:  document.getElementById('edit-fullName')?.value.trim()  || undefined,
    email:     document.getElementById('edit-email')?.value.trim()     || undefined,
    mobile:    document.getElementById('edit-mobile')?.value.trim()    || undefined,
    intro:     document.getElementById('edit-intro')?.value.trim()     || undefined,
    imageUrl:  document.getElementById('edit-imageUrl')?.value.trim()  || undefined,
  };

  setLoading('profile-save-btn', true, 'Lưu thay đổi');
  try {
    await Http.put(`/api/users/${profileUser.id}`, data);
    const updated = await Auth.me();
    localStorage.setItem('user', JSON.stringify(updated));
    profileUser = updated;
    renderProfileHeader(updated);
    UI.renderNav();
    UI.toast('Cập nhật hồ sơ thành công!', 'success');
    switchTab('posts', document.querySelector('.tab-btn'));
  } catch (err) {
    showFormError('profile-update-error', err.message || 'Cập nhật thất bại.');
  } finally {
    setLoading('profile-save-btn', false, 'Lưu thay đổi');
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  clearErrors('confirm-password-error');
  const newPwd     = document.getElementById('new-password')?.value;
  const confirmPwd = document.getElementById('confirm-new-password')?.value;

  if (!newPwd || newPwd.length < 6) {
    showFormError('confirm-password-error', 'Mật khẩu phải có ít nhất 6 ký tự');
    return;
  }
  if (newPwd !== confirmPwd) {
    showFormError('confirm-password-error', 'Mật khẩu xác nhận không khớp');
    return;
  }

  setLoading('password-save-btn', true, 'Đổi mật khẩu');
  try {
    await Http.post('/auth/change-password', {
      userName: profileUser.username,
      newPassword: newPwd,
    });
    UI.toast('Đổi mật khẩu thành công!', 'success');
    document.getElementById('password-form').reset();
  } catch (err) {
    showFormError('confirm-password-error', err.message || 'Đổi mật khẩu thất bại.');
  } finally {
    setLoading('password-save-btn', false, 'Đổi mật khẩu');
  }
}

/* ══════════════════════════════════════════════════════
   INIT (chạy theo trang hiện tại)
══════════════════════════════════════════════════════ */

(async function init() {
  const path = window.location.pathname;
  const isLogin    = path.includes('login');
  const isRegister = path.includes('register');
  const isProfile  = path.includes('profile');

  // Nếu đã đăng nhập và vào login/register → redirect về trang chủ
  if ((isLogin || isRegister) && Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // Profile page — yêu cầu đăng nhập
  if (isProfile) {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    UI.renderNav();

    document.getElementById('nav-toggle')?.addEventListener('click', () => {
      document.getElementById('nav-links')?.classList.toggle('open');
    });

    try {
      profileUser = await Auth.me();
      localStorage.setItem('user', JSON.stringify(profileUser));
      renderProfileHeader(profileUser);
      populateEditForm(profileUser);
      await loadMyPosts(profileUser.id);
    } catch (err) {
      document.getElementById('profile-header').innerHTML =
        `<div class="empty-state"><h3>Không thể tải hồ sơ</h3><p>${err.message}</p></div>`;
    }
  }
})();
