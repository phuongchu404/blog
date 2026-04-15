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
  // Dùng URL của trang hiện tại (login.html) làm redirect_uri — tự động đúng với mọi cấu hình server
  const redirectUri = window.location.origin + window.location.pathname;
  console.log(`[OAuth] Redirecting to provider ${provider} with redirect_uri:`, redirectUri);
  console.log("window.location.origin:", window.location.origin);
  console.log("window.location.pathname:", window.location.pathname);
  window.location.href = `${API_BASE_URL}/oauth2/authorize/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log("window.location.href set to:", window.location.href);
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
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    setTimeout(() => { window.location.href = returnUrl || 'index.html'; }, 600);
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

  const fullName = document.getElementById('fullName')?.value.trim();
  const username = document.getElementById('username')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
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
  document.getElementById('tab-edit').style.display = tab === 'edit' ? 'block' : 'none';
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
  const fields = { firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, email: user.email, mobile: user.mobile, intro: user.intro };
  for (const [key, val] of Object.entries(fields)) {
    const el = document.getElementById(`edit-${key}`);
    if (el) el.value = val || '';
  }

  const isOAuth = user.provider && user.provider !== 'local';

  if (isOAuth) {
    // OAuth2: hiển thị ảnh từ provider, không cho upload
    document.getElementById('avatar-oauth').style.display = 'block';
    document.getElementById('avatar-local').style.display = 'none';
    const oauthImg = document.getElementById('oauth-avatar-img');
    if (oauthImg && user.imageUrl) oauthImg.src = user.imageUrl;
    const providerEl = document.getElementById('oauth-provider-name');
    if (providerEl) providerEl.textContent = user.provider;
  } else {
    // Local: cho upload ảnh
    document.getElementById('avatar-local').style.display = 'block';
    document.getElementById('avatar-oauth').style.display = 'none';
    const imgUrlInput = document.getElementById('edit-imageUrl');
    if (imgUrlInput) imgUrlInput.value = user.imageUrl || '';
    if (user.imageUrl) {
      const preview = document.getElementById('avatar-preview');
      if (preview) { preview.src = user.imageUrl; preview.style.display = 'block'; }
    }
  }
}

// Upload ảnh đại diện — chỉ chạy cho local user
(function initAvatarUpload() {
  document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('avatar-file-input');
    if (!fileInput) return;
    fileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;
      // Preview ngay lập tức
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('avatar-preview');
        if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
      // Upload lên MinIO
      const formData = new FormData();
      formData.append('upload', file);
      try {
        const res = await Http.upload('/api/files/upload?folder=blog/avatars', formData);
        if (res && res.path) {
          document.getElementById('edit-imageUrl').value = res.path;
          UI.toast('Ảnh đại diện đã được tải lên!', 'success');
        }
      } catch (err) {
        UI.toast('Upload thất bại: ' + err.message, 'danger');
      }
    });
  });
})();

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
    lastName: document.getElementById('edit-lastName')?.value.trim() || undefined,
    fullName: document.getElementById('edit-fullName')?.value.trim() || undefined,
    email: document.getElementById('edit-email')?.value.trim() || undefined,
    mobile: document.getElementById('edit-mobile')?.value.trim() || undefined,
    intro: document.getElementById('edit-intro')?.value.trim() || undefined,
    imageUrl: document.getElementById('edit-imageUrl')?.value.trim() || undefined,
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
  const newPwd = document.getElementById('new-password')?.value;
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
  const isLogin = path.includes('login');
  const isRegister = path.includes('register');
  const isProfile = path.includes('profile');

  // ── Xử lý OAuth2 redirect (chạy trước mọi thứ) ──────────────────────────
  if (isLogin) {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthRefresh = params.get('refreshToken');
    const oauthError = params.get('error');

    if (oauthToken) {
      // OAuth2 thành công — xóa session cũ, lưu token mới và lấy thông tin user
      // Giải mã JWT payload để xem token thuộc về user nào
      let jwtSubject = null;
      try {
        const parts = oauthToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          jwtSubject = payload.sub;
        }
      } catch (_) {}
      const _dbg = { step: 'callback-start', time: new Date().toISOString(), tokenPrefix: oauthToken.slice(0, 20), jwtSubject };
      console.log('[OAuth] Callback nhận token → JWT subject (username):', jwtSubject);
      sessionStorage.setItem('_oauthDebug', JSON.stringify(_dbg));

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      localStorage.setItem('token', oauthToken);
      if (oauthRefresh) localStorage.setItem('refreshToken', oauthRefresh);
      try {
        const user = await Http.get('/auth/me');
        console.log('[OAuth] /auth/me trả về user:', user?.username);
        _dbg.step = 'me-success';
        _dbg.username = user?.username;
        _dbg.email = user?.email;
        _dbg.provider = user?.provider;
        sessionStorage.setItem('_oauthDebug', JSON.stringify(_dbg));
        localStorage.setItem('user', JSON.stringify(user));
        console.log('[OAuth] Đã lưu user vào localStorage:', user?.username);
      } catch (err) {
        // Nếu không lấy được user info, xóa token để tránh hiển thị sai
        _dbg.step = 'me-error';
        _dbg.error = err.message;
        sessionStorage.setItem('_oauthDebug', JSON.stringify(_dbg));
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
          errorEl.textContent = 'Đăng nhập thành công nhưng không thể lấy thông tin tài khoản. Vui lòng thử lại.';
          errorEl.style.display = 'block';
        }
        return;
      }
      const returnUrl = params.get('returnUrl');
      window.location.href = returnUrl || 'index.html';
      return;
    }

    if (oauthError) {
      // OAuth2 thất bại — hiển thị thông báo lỗi, giữ nguyên trên trang login
      // Xóa session cũ để tránh redirect về index.html
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      const errorEl = document.getElementById('login-error');
      if (errorEl) {
        errorEl.textContent = decodeURIComponent(oauthError);
        errorEl.style.display = 'block';
      }
      // Xóa query param khỏi URL cho gọn
      window.history.replaceState({}, document.title, window.location.pathname);
      return; // Dừng lại để hiển thị lỗi, không redirect về index.html
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Nếu đã đăng nhập và vào login/register → hiển thị thông báo thay vì redirect im lặng
  if ((isLogin || isRegister) && Auth.isLoggedIn()) {
    const user = Auth.getUser();
    const username = user?.username || user?.fullName || 'của bạn';
    const card = document.querySelector('.auth-card');
    if (card) {
      card.innerHTML = `
        <div class="auth-logo">
          <a href="index.html">My<span style="color:var(--text-dark)">Blog</span></a>
        </div>
        <div style="text-align:center;padding:1rem 0">
          <div style="font-size:2.5rem;margin-bottom:1rem">👤</div>
          <h2 style="margin-bottom:.5rem">Bạn đã đăng nhập</h2>
          <p style="color:var(--text-muted);margin-bottom:1.5rem">
            Đang đăng nhập với tài khoản <strong>${username}</strong>
          </p>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <a href="index.html" class="btn btn-primary" style="justify-content:center;text-align:center">
              Về trang chủ
            </a>
            <button onclick="Auth.logout()" class="btn btn-ghost" style="justify-content:center">
              Đăng xuất để đổi tài khoản
            </button>
          </div>
        </div>`;
    } else {
      window.location.href = 'index.html';
    }
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

      // Nếu vào từ link #doi-mat-khau → chuyển sang tab edit và scroll đến form
      if (window.location.hash === '#doi-mat-khau') {
        const editBtn = document.querySelectorAll('.tab-btn')[1];
        switchTab('edit', editBtn);
        setTimeout(() => {
          document.getElementById('doi-mat-khau')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      document.getElementById('profile-header').innerHTML =
        `<div class="empty-state"><h3>Không thể tải hồ sơ</h3><p>${err.message}</p></div>`;
    }
  }
})();
