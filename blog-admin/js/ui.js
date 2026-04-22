/**
 * ui.js — Các tiện ích giao diện dùng chung
 * Phụ thuộc: auth.js (cho renderCurrentUser)
 */

const UI = {
  getRelativePrefix() {
    const uiScript = document.querySelector('script[src$="js/ui.js"]');
    if (!uiScript) return '';

    const src = uiScript.getAttribute('src') || '';
    return src.replace(/js\/ui\.js$/, '');
  },

  getCurrentPageKey() {
    const path = window.location.pathname.toLowerCase();

    if (path.endsWith('/blog-admin/') || path.endsWith('/blog-admin/index.html')) return 'dashboard';
    if (path.includes('/posts/create.html')) return 'posts-create';
    if (path.includes('/posts/index.html')) return 'posts-index';
    if (path.includes('/categories/')) return 'categories';
    if (path.includes('/tags/')) return 'tags';
    if (path.includes('/comments/')) return 'comments';
    if (path.includes('/users/')) return 'users';
    if (path.includes('/roles/')) return 'roles';
    if (path.includes('/permissions/')) return 'permissions';
    if (path.includes('/audit-logs/')) return 'audit-logs';
    if (path.includes('/profile.html')) return 'profile';
    if (path.includes('/settings.html')) return 'settings';

    return '';
  },

  renderSharedLayout() {
    const wrapper = document.querySelector('.app-wrapper');
    if (!wrapper) return;

    const headerHost = document.querySelector('[data-admin-header]');
    const sidebarHost = document.querySelector('[data-admin-sidebar]');
    const footerHost = document.querySelector('[data-admin-footer]');
    if (!headerHost && !sidebarHost && !footerHost) return;

    const prefix = this.getRelativePrefix();
    const currentPage = this.getCurrentPageKey();
    const isActive = (...keys) => keys.includes(currentPage);
    const postsOpen = isActive('posts-index', 'posts-create');
    const asset = (path) => `${prefix}${path}`;
    const t = (key) => (typeof I18n !== 'undefined' ? I18n.t(key) : key);
    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    const langLabel = t('lang.current');
    const switchLabel = t('lang.switch_label');

    if (headerHost) {
      headerHost.outerHTML = `
        <nav class="app-header navbar navbar-expand bg-body">
          <div class="container-fluid">
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link" data-lte-toggle="sidebar" href="#" role="button">
                  <i class="bi bi-list"></i>
                </a>
              </li>
              <li class="nav-item d-none d-md-block">
                <a href="${asset('index.html')}" class="nav-link">${t('nav.dashboard')}</a>
              </li>
            </ul>
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link" href="#" data-lte-toggle="fullscreen">
                  <i data-lte-icon="maximize" class="bi bi-arrows-fullscreen"></i>
                  <i data-lte-icon="minimize" class="bi bi-fullscreen-exit" style="display: none"></i>
                </a>
              </li>
              <li class="nav-item" title="${switchLabel}">
                <button class="nav-link btn btn-link lang-switcher-btn" onclick="I18n.toggle()" style="min-width:2.5rem;font-weight:600;font-size:.8rem;letter-spacing:.05em">
                  ${langLabel}
                </button>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link" data-bs-toggle="dropdown" href="#" id="admin-notif-dropdown-toggle">
                  <i class="bi bi-bell-fill"></i>
                  <span class="badge bg-danger navbar-badge" id="admin-notif-badge" style="display: none">0</span>
                </a>
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-end" style="min-width: 300px; max-width: 340px">
                  <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <span class="fw-semibold small">${t('notif.title')}</span>
                    <button class="btn btn-sm btn-link p-0 text-decoration-none" id="admin-notif-mark-all">
                      ${t('notif.mark_all')}
                    </button>
                  </div>
                  <div id="admin-notif-list" style="max-height: 320px; overflow-y: auto">
                    <div class="dropdown-item text-center text-muted py-3">
                      ${t('notif.loading')}
                    </div>
                  </div>
                </div>
              </li>
              <li class="nav-item dropdown user-menu">
                <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                  <img src="${asset('assets/images/user.jpg')}" class="user-image rounded-circle shadow" alt="Admin" />
                  <span class="d-none d-md-inline current-user-name">Admin</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                  <li class="user-header text-bg-primary">
                    <img src="${asset('assets/images/user.jpg')}" class="rounded-circle shadow" alt="Admin" />
                    <p id="menuUserName">Admin <small>Blog Administrator</small></p>
                  </li>
                  <li class="user-footer">
                    <a href="${asset('profile.html')}" class="btn btn-outline-secondary">${t('nav.profile')}</a>
                    <a href="${asset('login.html')}" class="btn btn-outline-danger float-end" data-action="logout">${t('nav.sign_out')}</a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>`;
    }

    if (sidebarHost) {
      sidebarHost.outerHTML = `
        <aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
          <div class="sidebar-brand">
            <a href="${asset('index.html')}" class="brand-link">
               <img src="${asset('assets/images/logo.jpg')}" alt="Logo" class="brand-image opacity-75 shadow" />
              <span class="brand-text fw-light">Blog Admin</span>
            </a>
          </div>
          <div class="sidebar-wrapper">
            <nav class="mt-2">
              <ul class="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="navigation"
                aria-label="Main navigation" data-accordion="false">
                <li class="nav-header" data-section="main">${t('nav.main_menu')}</li>
                <li class="nav-item">
                  <a href="${asset('index.html')}" class="nav-link ${isActive('dashboard') ? 'active' : ''}" data-nav-key="dashboard">
                    <i class="nav-icon bi bi-speedometer2"></i>
                    <p>${t('nav.dashboard')}</p>
                  </a>
                </li>
                <li class="nav-item ${postsOpen ? 'menu-open' : ''}">
                  <a href="#" class="nav-link ${postsOpen ? 'active' : ''}" data-nav-key="posts">
                    <i class="nav-icon bi bi-file-earmark-text"></i>
                    <p>${t('nav.posts')} <i class="nav-arrow bi bi-chevron-right"></i></p>
                  </a>
                  <ul class="nav nav-treeview">
                    <li class="nav-item">
                      <a href="${asset('posts/index.html')}" class="nav-link ${isActive('posts-index') ? 'active' : ''}" data-nav-key="posts">
                        <i class="nav-icon bi bi-circle"></i>
                        <p>${t('nav.all_posts')}</p>
                      </a>
                    </li>
                    <li class="nav-item">
                      <a href="${asset('posts/create.html')}" class="nav-link ${isActive('posts-create') ? 'active' : ''}" data-nav-key="posts">
                        <i class="nav-icon bi bi-circle"></i>
                        <p>${t('nav.create_post')}</p>
                      </a>
                    </li>
                  </ul>
                </li>
                <li class="nav-item">
                  <a href="${asset('categories/index.html')}" class="nav-link ${isActive('categories') ? 'active' : ''}" data-nav-key="categories">
                    <i class="nav-icon bi bi-tags"></i>
                    <p>${t('nav.categories')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('tags/index.html')}" class="nav-link ${isActive('tags') ? 'active' : ''}" data-nav-key="tags">
                    <i class="nav-icon bi bi-hash"></i>
                    <p>${t('nav.tags')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('comments/index.html')}" class="nav-link ${isActive('comments') ? 'active' : ''}" data-nav-key="comments">
                    <i class="nav-icon bi bi-chat-dots"></i>
                    <p>${t('nav.comments')}</p>
                  </a>
                </li>
                <li class="nav-header" data-section="access">${t('nav.access_control')}</li>
                <li class="nav-item">
                  <a href="${asset('users/index.html')}" class="nav-link ${isActive('users') ? 'active' : ''}" data-nav-key="users">
                    <i class="nav-icon bi bi-people"></i>
                    <p>${t('nav.users')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('roles/index.html')}" class="nav-link ${isActive('roles') ? 'active' : ''}" data-nav-key="roles">
                    <i class="nav-icon bi bi-shield-check"></i>
                    <p>${t('nav.roles')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('permissions/index.html')}" class="nav-link ${isActive('permissions') ? 'active' : ''}" data-nav-key="permissions">
                    <i class="nav-icon bi bi-key"></i>
                    <p>${t('nav.permissions')}</p>
                  </a>
                </li>
                <li class="nav-header" data-section="settings">${t('nav.settings_section')}</li>
                <li class="nav-item">
                  <a href="${asset('audit-logs/index.html')}" class="nav-link ${isActive('audit-logs') ? 'active' : ''}" data-nav-key="audit-logs">
                    <i class="nav-icon bi bi-journal-text"></i>
                    <p>${t('nav.audit_logs')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('settings.html')}" class="nav-link ${isActive('settings') ? 'active' : ''}" data-nav-key="settings">
                    <i class="nav-icon bi bi-gear"></i>
                    <p>${t('nav.settings')}</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a href="${asset('login.html')}" class="nav-link" data-action="logout">
                    <i class="nav-icon bi bi-box-arrow-right"></i>
                    <p>${t('nav.logout')}</p>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>`;
    }

    if (footerHost) {
      footerHost.outerHTML = `
        <footer class="app-footer">
          <div class="float-end d-none d-sm-inline">${t('common.version')}</div>
          <strong>${t('common.copyright')}</strong>
        </footer>`;
    }
  },
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
      const defaultAvatar = 'assets/images/user.png';
      const prefix = this.getRelativePrefix();
      if (user.imageUrl) {
        document.querySelectorAll('.user-image, .user-header img, #profilePhotoPreview').forEach(img => {
          img.src = user.imageUrl;
          img.onerror = function () {
            this.onerror = null;
            // Tính đường dẫn tương đối dựa trên độ sâu của trang hiện tại
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

    // Map data-nav-key → required permission (language-independent)
    const permissionMap = {
      'dashboard':   'menu:dashboard',
      'posts':       'menu:posts',
      'categories':  'menu:categories',
      'tags':        'menu:tags',
      'comments':    'menu:comment',
      'users':       'menu:users',
      'roles':       'menu:roles',
      'permissions': 'menu:permissions',
      'audit-logs':  'menu:audit-logs',
      'settings':    'menu:settings',
    };

    const path = window.location.pathname.toLowerCase();

    document.querySelectorAll('.app-sidebar .nav-item').forEach(item => {
      if (item.classList.contains('nav-header')) return;

      const link = item.querySelector('a.nav-link');
      if (!link) return;

      // Skip logout link
      if (link.dataset.action === 'logout') return;

      const navKey = link.dataset.navKey;
      if (!navKey) return;

      const requiredPerm = permissionMap[navKey];
      if (!requiredPerm) return;

      const isAllowed = permissions.includes(requiredPerm);
      item.style.display = isAllowed ? '' : 'none';
    });

    // Ẩn section header nếu tất cả item bên dưới bị ẩn
    const sectionPerms = {
      'access':   ['menu:users', 'menu:roles', 'menu:permissions'],
      'settings': ['menu:audit-logs', 'menu:settings'],
    };
    document.querySelectorAll('.app-sidebar .nav-header[data-section]').forEach(header => {
      const section = header.dataset.section;
      const required = sectionPerms[section];
      if (required) {
        header.style.display = required.some(p => permissions.includes(p)) ? '' : 'none';
      }
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
      const relativePrefix = this.getRelativePrefix();
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
UI.renderSharedLayout();

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

