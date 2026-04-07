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
    const statusMap = {
      0: { label: 'DRAFT', class: 'text-bg-warning' },
      1: { label: 'PUBLISHED', class: 'text-bg-success' },
      2: { label: 'ARCHIVED', class: 'text-bg-secondary' },
      'DRAFT': { label: 'DRAFT', class: 'text-bg-warning' },
      'PUBLISHED': { label: 'PUBLISHED', class: 'text-bg-success' },
      'ARCHIVED': { label: 'ARCHIVED', class: 'text-bg-secondary' }
    };
    const s = statusMap[status] || { label: status || 'DRAFT', class: 'text-bg-secondary' };
    return `<span class="badge ${s.class}">${s.label}</span>`;
  },

  /**
   * Điền tên/email/role của user đang đăng nhập vào các element
   * có class .current-user-name / .current-user-email / .current-user-role.
   */
  async renderCurrentUser() {
    try {
      const user = await Auth.me();
      localStorage.setItem('user', JSON.stringify(user));
      const displayName = user.username || user.name || 'Admin';
      const roleText = (user.roles || []).map(r => r.name || r).join(', ') || 'User';

      document.querySelectorAll('.current-user-name, .user-menu .d-none.d-md-inline, #headerUserName')
        .forEach(el => { el.textContent = displayName; });
        
      document.querySelectorAll('.current-user-email')
        .forEach(el => { el.textContent = user.email || ''; });
        
      document.querySelectorAll('.current-user-role')
        .forEach(el => { el.textContent = roleText; });

      // AdminLTE user menu dropdown profile text
      document.querySelectorAll('.user-header p, #menuUserName').forEach(el => {
        el.innerHTML = `${displayName} <small>${roleText}</small>`;
      });

      // Cập nhật giao diện theo quyền (với data mới từ server)
      this.applyAccessControl(user);
    } catch (_) {}
  },

  /**
   * Ẩn/Hiện menu dựa trên Roles của user.
   * @param {Object} user 
   */
  applyAccessControl(user) {
    const userRoles = (user?.roles || []).map(r => typeof r === 'string' ? r.toUpperCase() : (r.name || '').toUpperCase());
    // Hỗ trợ cả 'ADMIN' và 'ROLE_ADMIN'
    const isAdmin = userRoles.some(r => r.includes('ADMIN'));

    if (!isAdmin) {
      // Hide Admin-only links by checking text content
      document.querySelectorAll('.app-sidebar .nav-item').forEach(item => {
        const link = item.querySelector('a.nav-link');
        if (!link) return;
        const text = link.textContent.trim().toUpperCase();
        
        if (text === 'USERS' || text === 'ROLES' || text === 'PERMISSIONS' || text === 'SETTINGS') {
          item.style.display = 'none';
        }
      });
      
      // Hide Admin-only headers
      document.querySelectorAll('.app-sidebar .nav-header').forEach(header => {
        const text = header.textContent.trim().toUpperCase();
        if (text.includes('ACCESS CONTROL') || text.includes('SETTINGS')) {
          header.style.display = 'none';
        }
      });
    } else {
      // Dành cho trường hợp reload hoặc clear filter (show lại nếu là ADMIN)
      document.querySelectorAll('.app-sidebar .nav-item').forEach(item => {
        const link = item.querySelector('a.nav-link');
        if (!link) return;
        const text = link.textContent.trim().toUpperCase();
        if (text === 'USERS' || text === 'ROLES' || text === 'PERMISSIONS' || text === 'SETTINGS') {
          item.style.display = '';
        }
      });
      document.querySelectorAll('.app-sidebar .nav-header').forEach(header => {
        const text = header.textContent.trim().toUpperCase();
        if (text.includes('ACCESS CONTROL') || text.includes('SETTINGS')) {
          header.style.display = '';
        }
      });
    }
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
   * Hỗ trợ đầy đủ tiếng Việt.
   * @param {string} str
   */
  toSlug(str) {
    if (!str) return '';
    let slug = str.toLowerCase();

    // Thay thế các ký tự tiếng Việt đặc biệt
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ặ|ẵ|â|ấ|ầ|ẩ|ậ|ẫ/g, 'a');
    slug = slug.replace(/é|è|ẻ|ẹ|ẽ|ê|ế|ề|ể|ệ|ễ/g, 'e');
    slug = slug.replace(/i|í|ì|ỉ|ị|ĩ/g, 'i');
    slug = slug.replace(/ó|ò|ỏ|ọ|õ|ô|ố|ồ|ổ|ộ|ỗ|ơ|ớ|ờ|ở|ợ|ỡ/g, 'o');
    slug = slug.replace(/ú|ù|ủ|ụ|ũ|ư|ứ|ừ|ử|ự|ữ/g, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỵ|ỹ/g, 'y');
    slug = slug.replace(/đ/g, 'd');

    return slug
      .normalize('NFD')                     // Chuẩn hóa Unicode
      .replace(/[\u0300-\u036f]/g, '')      // Xóa các dấu phụ còn sót lại
      .replace(/[^a-z0-9\s-]/g, '')         // Xóa ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-')                 // Thay khoảng trắng bằng gạch ngang
      .replace(/-+/g, '-')                  // Nén nhiều gạch ngang thành một
      .replace(/^-+|-+$/g, '');             // Xóa gạch ngang ở đầu và cuối
  },
};

// Thực thi đồng bộ sớm (Synchronous execution) để ẩn menu ngay lập tức dựa trên cache, tránh flicker
(function applyCachedAccessControl() {
  try {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      UI.applyAccessControl(JSON.parse(cachedUser));
    }
  } catch (e) {}
})();
