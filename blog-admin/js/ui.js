/**
 * ui.js — Các tiện ích giao diện dùng chung
 * Phụ thuộc: auth.js (cho renderCurrentUser)
 */

const UI = {
  /**
   * Hiển thị toast thông báo góc trên phải, tự biến mất sau 3.5 giây.
   * @param {string} message - Nội dung thông báo
   * @param {'success'|'danger'|'warning'|'info'} type
   */
  toast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;min-width:260px';
      document.body.appendChild(container);
    }
    const icons = {
      success: 'bi-check-circle-fill',
      danger:  'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill',
    };
    const id = 'toast-' + Date.now();
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show mb-2" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi ${icons[type] || ''} me-2"></i>${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`);
    setTimeout(() => document.getElementById(id)?.remove(), 3500);
  },

  /**
   * Hiển thị spinner loading bên trong một container.
   * @param {HTMLElement} container
   */
  loading(container) {
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>`;
  },

  /**
   * Trả về HTML badge màu theo trạng thái bài viết.
   * @param {'PUBLISHED'|'DRAFT'|'ARCHIVED'} status
   */
  statusBadge(status) {
    const map = {
      PUBLISHED: 'text-bg-success',
      DRAFT:     'text-bg-warning',
      ARCHIVED:  'text-bg-secondary',
    };
    return `<span class="badge ${map[status] || 'text-bg-secondary'}">${status || 'DRAFT'}</span>`;
  },

  /**
   * Điền tên/email/role của user đang đăng nhập vào các element
   * có class .current-user-name / .current-user-email / .current-user-role.
   */
  async renderCurrentUser() {
    try {
      const user = await Auth.me();
      localStorage.setItem('user', JSON.stringify(user));
      document.querySelectorAll('.current-user-name')
        .forEach(el => { el.textContent = user.username || user.name || 'Admin'; });
      document.querySelectorAll('.current-user-email')
        .forEach(el => { el.textContent = user.email || ''; });
      document.querySelectorAll('.current-user-role')
        .forEach(el => { el.textContent = (user.roles || []).join(', ') || 'User'; });
    } catch (_) {}
  },

  /**
   * Format chuỗi datetime thành dd/MM/yyyy (locale Việt Nam).
   * @param {string} dateStr
   */
  formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  },

  /** Hiện hộp xác nhận trình duyệt, trả về true/false. */
  confirm(message) {
    return window.confirm(message);
  },

  /**
   * Chuyển chuỗi thành slug URL-friendly.
   * Hỗ trợ bỏ dấu tiếng Việt.
   * @param {string} str
   */
  toSlug(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  },
};
