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
      danger: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
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

      // Cập nhật avatar nếu user có ảnh đại diện
      const defaultAvatar = 'assets/images/user2-160x160.jpg';
      if (user.imageUrl) {
        document.querySelectorAll('.user-image, .user-header img, #profilePhotoPreview').forEach(img => {
          img.src = user.imageUrl;
          img.onerror = function () {
            this.onerror = null;
            // Tính đường dẫn tương đối dựa trên độ sâu của trang hiện tại
            const depth = window.location.pathname.split('/').filter(Boolean).length;
            const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
            this.src = prefix + defaultAvatar;
          };
        });
      }

      // Cập nhật giao diện theo quyền (với data mới từ server)
      this.applyAccessControl(user);
    } catch (_) { }
  },

  /**
   * Ẩn/Hiện menu dựa trên Permissions của user.
   * @param {Object} user
   */
  applyAccessControl(user) {
    const permissions = user?.permissions || [];

    // Ánh xạ Keyword trên sidebar text thành thẻ Quyền: menu:* 
    const permissionMap = {
      'DASHBOARD': 'menu:dashboard',
      'ALL POSTS': 'menu:posts',
      'CREATE POST': 'menu:posts',
      'POSTS': 'menu:posts', // thư mục ngoài
      'CATEGORIES': 'menu:categories',
      'TAGS': 'menu:tags',
      'COMMENTS': 'menu:comment',
      'USERS': 'menu:users',
      'ROLES': 'menu:roles',
      'PERMISSIONS': 'menu:permissions',
      'AUDIT LOGS': 'menu:audit-logs', // Mặc định không có, giả sử map với menu:audit-logs
      'SETTINGS': 'menu:settings',
    };

    const headerKeywords = ['MAIN MENU', 'ACCESS CONTROL', 'SETTINGS'];

    let hasAnyPermission = false;
    let allowedToViewCurrentPage = false;
    // Current Path
    const path = window.location.pathname.toLowerCase();

    document.querySelectorAll('.app-sidebar .nav-item').forEach(item => {
      // Bỏ qua nếu item này là header, sẽ xử lý sau
      if (item.classList.contains('nav-header')) return;

      const link = item.querySelector('a.nav-link');
      if (!link) return;

      const text = link.textContent.trim().toUpperCase()
        // Lọc bỏ mũi tên dropdown của treeview
        .replace(/[<>]/g, '').trim();

      // Mặc định cho phép logout
      if (text === 'LOGOUT') return;

      let isAllowed = false;

      // Nếu có mapping
      for (const key of Object.keys(permissionMap)) {
        if (text.includes(key)) {
          const requiredPerm = permissionMap[key];
          isAllowed = permissions.includes(requiredPerm);
          break; // Đã match keyword thì dừng
        }
      }

      // Những cái nào không nằm trong permissionMap thì auto cho mượn đường (hiển thị)
      // Ví dụ submenu hoặc link đặc biệt, nhưng ở đây hầu hết đã được cover
      if (typeof isAllowed !== 'undefined') {
        item.style.display = isAllowed ? '' : 'none';

        // Cập nhật Allowed flag nếu item link đang trỏ tới page của mình (page hiện tại)
        if (isAllowed) {
          hasAnyPermission = true;
          // Nếu link chứa path hiện tại (gần đúng)
          const linkHref = link.getAttribute('href');
          if (linkHref && linkHref !== '#' && linkHref !== '') {
            // Kiểm tra xem href có nằm trong pathname hiện tại không
            const hrefPart = linkHref.replace('../', '').replace('./', '');
            if (path.includes(hrefPart) || (hrefPart === 'index.html' && path.endsWith('/blog-admin/'))) {
              // Allowed to view current context
            }
          }
        }
      }
    });

    // Ẩn Header nếu tất cả item bên dưới bị ẩn
    // Khó phân tích nextElementSibling dễ bị sai, ở đây hardcode theo logic
    const sections = [
      { key: 'ACCESS CONTROL', childItems: ['ROLES', 'PERMISSIONS'] },
      { key: 'SETTINGS', childItems: ['AUDIT LOGS', 'SETTINGS'] },
    ];
    document.querySelectorAll('.app-sidebar .nav-header').forEach(header => {
      const text = header.textContent.trim().toUpperCase();
      let headerAllowed = true;
      const sec = sections.find(s => text.includes(s.key));
      if (sec) {
        // Kiểm tra xem user có quyền nào trong mục đó không
        const requiredPerms = sec.childItems.map(c => permissionMap[c]);
        headerAllowed = requiredPerms.some(p => permissions.includes(p));
      }
      header.style.display = headerAllowed ? '' : 'none';
    });

    // Guard route hiện hành (Nếu user không có quyền vào trang đang đứng, chuyển về trang khác)
    this.routeGuard(permissions, path, permissionMap);
  },

  /**
   * Chuyển hướng người dùng nếu ko có quyền truy cập trang hiện tại
   */
  routeGuard(permissions, path, permissionMap) {
    if (path.includes('login.html') || path.includes('unauthorized.html')) return;

    // Lọc bỏ chuỗi rỗng để tính toán đoạn URL chính xác
    const filteredSegments = path.split('/').filter(Boolean);
    let lastDir = '';
    if (path.endsWith('.html')) {
      lastDir = filteredSegments.length > 1 ? filteredSegments[filteredSegments.length - 2] : filteredSegments[0];
    } else {
      lastDir = filteredSegments[filteredSegments.length - 1];
    }

    let requiredPerm = null;
    if (lastDir === 'blog-admin' || lastDir === 'index.html' || lastDir === '') requiredPerm = 'menu:dashboard';
    else if (lastDir === 'posts') requiredPerm = 'menu:posts';
    else if (lastDir === 'categories') requiredPerm = 'menu:categories';
    else if (lastDir === 'tags') requiredPerm = 'menu:tags';
    else if (lastDir === 'comments') requiredPerm = 'menu:comment';
    else if (lastDir === 'users') requiredPerm = 'menu:users';
    else if (lastDir === 'roles') requiredPerm = 'menu:roles';
    else if (lastDir === 'permissions') requiredPerm = 'menu:permissions';
    else if (lastDir === 'audit-logs') requiredPerm = 'menu:audit-logs';
    else if (path.includes('settings.html')) requiredPerm = 'menu:settings';

    // Allow user to stay if they have the necessary permission or if no permission is mapped
    if (requiredPerm && !permissions.includes(requiredPerm)) {
      let relativePrefix = '';
      const uiScript = document.querySelector('script[src$="js/ui.js"]');
      if (uiScript) {
        const src = uiScript.getAttribute('src');
        relativePrefix = src.replace('js/ui.js', '');
      }

      const fallbackPath = this.getFirstAccessiblePage(permissions, relativePrefix);
      if (fallbackPath) {
        document.body.style.display = 'none';
        window.location.href = fallbackPath;
      } else {
        // Fallback to unauthorized page if they lack admin access
        document.body.style.display = 'none';
        window.location.href = relativePrefix + 'unauthorized.html';
      }
    }
  },

  getFirstAccessiblePage(permissions = [], relativePrefix = '') {
    const landingPages = [
      { permission: 'menu:dashboard', path: 'index.html' },
      { permission: 'menu:posts', path: 'posts/index.html' },
      { permission: 'menu:categories', path: 'categories/index.html' },
      { permission: 'menu:tags', path: 'tags/index.html' },
      { permission: 'menu:comment', path: 'comments/index.html' },
      { permission: 'menu:users', path: 'users/index.html' },
      { permission: 'menu:roles', path: 'roles/index.html' },
      { permission: 'menu:permissions', path: 'permissions/index.html' },
      { permission: 'menu:audit-logs', path: 'audit-logs/index.html' },
      { permission: 'menu:settings', path: 'settings.html' },
    ];

    const matchedPage = landingPages.find(item => permissions.includes(item.permission));
    return matchedPage ? relativePrefix + matchedPage.path : null;
  },

  /**
   * Khởi tạo Overlay Scrollbars cho sidebar (chỉ trên desktop).
   */
  initSidebar() {
    const sidebarWrapper = document.querySelector('.sidebar-wrapper');
    if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
      OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
        scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
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

  /**
   * Hiện hộp xác nhận tùy chỉnh (Premium), trả về Promise<boolean>.
   * @param {string} message - Nội dung câu hỏi
   * @param {string} title - Tiêu đề (mặc định: "Confirm Action")
   */
  async confirm(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
      const id = 'confirm-' + Date.now();
      const html = `
        <div class="confirm-dialog-overlay" id="${id}">
          <div class="confirm-dialog-box">
            <div class="confirm-dialog-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <h4 class="confirm-dialog-title">${title}</h4>
            <p class="confirm-dialog-message">${message}</p>
            <div class="confirm-dialog-actions">
              <button type="button" class="btn btn-cancel" id="${id}-cancel">Hủy</button>
              <button type="button" class="btn btn-confirm" id="${id}-ok">Xác nhận</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);

      const overlay = document.getElementById(id);
      const okBtn = document.getElementById(`${id}-ok`);
      const cancelBtn = document.getElementById(`${id}-cancel`);

      // Trigger animation
      setTimeout(() => overlay.classList.add('show'), 10);

      const close = (result) => {
        overlay.classList.remove('show');
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      okBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    });
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
      const user = JSON.parse(cachedUser);
      UI.applyAccessControl(user);

      // Áp dụng avatar từ cache ngay lập tức để tránh flash ảnh mặc định
      if (user.imageUrl) {
        document.querySelectorAll('.user-image, .user-header img, #profilePhotoPreview').forEach(img => {
          img.src = user.imageUrl;
        });
      }
    }
  } catch (e) { }
})();
