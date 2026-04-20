/**
 * membership.js — Logic trang Membership
 * Phụ thuộc: http.js, auth.js, ui.js
 */

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

/* ── Render status card theo trạng thái membership ────────── */
function renderStatusCard(user) {
  const card = document.getElementById('membership-status-card');
  if (!card) return;

  const status = user?.membershipStatus ?? 0;

  if (status === 1) {
    // Active
    const expText = user.membershipExpiredAt
      ? I18n.t('membership.valid_until', { date: `<strong>${new Date(user.membershipExpiredAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>` })
      : I18n.t('membership.no_expiry');
    card.innerHTML = `
      <div class="membership-status membership-status--active">
        <div class="ms-icon">✅</div>
        <div class="ms-body">
          <div class="ms-title">${I18n.t('membership.active_title')}</div>
          <div class="ms-desc">${expText}</div>
        </div>
      </div>`;
  } else if (status === 2) {
    // Pending
    card.innerHTML = `
      <div class="membership-status membership-status--pending">
        <div class="ms-icon">⏳</div>
        <div class="ms-body">
          <div class="ms-title">${I18n.t('membership.pending_title')}</div>
          <div class="ms-desc">${I18n.t('membership.pending_desc')}</div>
        </div>
      </div>`;
  } else if (!user) {
    // Chưa đăng nhập
    card.innerHTML = `
      <div class="membership-status membership-status--guest">
        <div class="ms-icon">🔒</div>
        <div class="ms-body">
          <div class="ms-title">${I18n.t('membership.guest_title')}</div>
          <div class="ms-desc">${I18n.t('membership.guest_desc')}</div>
          <a href="login.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">${I18n.t('nav.login')}</a>
        </div>
      </div>`;
  } else {
    // None — cho phép gửi yêu cầu
    card.innerHTML = `
      <div class="membership-status membership-status--none">
        <div class="ms-icon">🎫</div>
        <div class="ms-body">
          <div class="ms-title">${I18n.t('membership.none_title')}</div>
          <div class="ms-desc">${I18n.t('membership.none_desc')}</div>
          <button class="btn btn-primary" id="btn-request-membership" style="margin-top:1rem" onclick="submitRequest()">
            ${I18n.t('membership.btn_request')}
          </button>
        </div>
      </div>`;
  }
}

/* ── Gửi yêu cầu membership ──────────────────────────────── */
async function submitRequest() {
  const btn = document.getElementById('btn-request-membership');
  if (btn) { btn.disabled = true; btn.textContent = I18n.t('membership.sending'); }
  try {
    await Http.post('/api/membership/request', {});
    UI.toast(I18n.t('membership.request_success'), 'success');
    // Cập nhật lại card
    const stored = Auth.getUser() || {};
    localStorage.setItem('user', JSON.stringify({ ...stored, membershipStatus: 2 }));
    renderStatusCard({ ...stored, membershipStatus: 2 });
  } catch (err) {
    UI.toast(err.message || I18n.t('membership.request_failed'), 'error');
    if (btn) { btn.disabled = false; btn.textContent = I18n.t('membership.btn_request'); }
  }
}

/* ── Init ─────────────────────────────────────────────────── */
async function init() {
  UI.renderNav();

  const isLoggedIn = Auth.isLoggedIn();
  if (!isLoggedIn) {
    renderStatusCard(null);
    return;
  }

  try {
    // Lấy thông tin user mới nhất từ server để có membershipStatus chính xác
    const me = await Http.get('/api/users/me');
    // Cập nhật user cache trong localStorage
    const stored = Auth.getUser() || {};
    localStorage.setItem('user', JSON.stringify({ ...stored, membershipStatus: me.membershipStatus, membershipExpiredAt: me.membershipExpiredAt }));
    renderStatusCard(me);
  } catch (_) {
    renderStatusCard(Auth.getUser());
  }
}

init();
