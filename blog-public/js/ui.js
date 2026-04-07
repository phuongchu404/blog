/**
 * ui.js — Tiện ích giao diện dùng chung (blog-public)
 * Phụ thuộc: auth.js
 */

const UI = {
  /* ── Toast ─────────────────────────────────────────────── */
  toast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const id = 'toast-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || '•'}</span> ${message}`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(110%)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3500);
  },

  /* ── Loading ────────────────────────────────────────────── */
  loading(container, message = 'Đang tải...') {
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>${message}</span>
      </div>`;
  },

  emptyState(container, title = 'Không có dữ liệu', desc = '') {
    container.innerHTML = `
      <div class="empty-state">
        <h3>${title}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
      </div>`;
  },

  /* ── Format ─────────────────────────────────────────────── */
  formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ngày trước`;
    return this.formatDateShort(dateStr);
  },

  toSlug(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  },

  /* ── Avatar placeholder ─────────────────────────────────── */
  avatarUrl(user) {
    if (user?.imageUrl) return user.imageUrl;
    const name = encodeURIComponent(user?.username || user?.fullName || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=80`;
  },

  /* ── Render nav (header) ────────────────────────────────── */
  renderNav() {
    const user = Auth.getUser();
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (Auth.isLoggedIn() && user) {
      navAuth.innerHTML = `
        <div class="user-menu">
          <button class="user-avatar-btn" id="user-menu-btn" aria-expanded="false">
            <img class="user-avatar-img" src="${this.avatarUrl(user)}" alt="avatar" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff&size=80'">
            <span>${user.username || user.fullName || 'Tôi'}</span>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a href="profile.html">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z"/></svg>
              Trang cá nhân
            </a>
            <hr>
            <button onclick="Auth.logout()">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>
              Đăng xuất
            </button>
          </div>
        </div>`;

      document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = document.getElementById('user-dropdown');
        dd?.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        document.getElementById('user-dropdown')?.classList.remove('open');
      });
    } else {
      navAuth.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">Đăng nhập</a>
        <a href="register.html" class="btn btn-primary btn-sm">Đăng ký</a>`;
    }
  },

  /* ── Active nav link ─────────────────────────────────────── */
  setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (path.endsWith(href) || (href !== 'index.html' && path.includes(href.split('.')[0]))) {
        link.classList.add('active');
      }
    });
  },

  /* ── Post card HTML ─────────────────────────────────────── */
  postCard(post) {
    const categories = (post.categories || []).map(c =>
      `<a href="category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
    ).join('');

    const thumbUrl = post.imageUrl || post.thumbnailUrl;
    const thumb = thumbUrl
      ? `<div class="post-card-thumb"><img src="${thumbUrl}" alt="${post.title}" loading="lazy"></div>`
      : `<div class="post-card-no-thumb">📝</div>`;

    const authorName = post.author?.fullName || post.author?.username || 'Ẩn danh';
    const authorAvatar = this.avatarUrl(post.author);

    return `
      <article class="post-card">
        <a href="post.html?slug=${post.slug}">${thumb}</a>
        <div class="post-card-body">
          ${categories ? `<div class="post-card-cats">${categories}</div>` : ''}
          <h2 class="post-card-title">
            <a href="post.html?slug=${post.slug}">${post.title}</a>
          </h2>
          ${post.summary ? `<p class="post-card-excerpt">${post.summary}</p>` : ''}
          <div class="post-card-meta">
            <img class="avatar-xs" src="${authorAvatar}" alt="${authorName}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
            <span>${authorName}</span>
            <span>·</span>
            <span>${this.formatDateShort(post.publishedAt || post.createdAt)}</span>
          </div>
        </div>
      </article>`;
  },

  /* ── Pagination ─────────────────────────────────────────── */
  renderPagination(container, { page, total, size, onPageChange }) {
    const totalPages = Math.ceil(total / size);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let btns = '';
    btns += `<button ${page === 0 ? 'disabled' : ''} onclick="(${onPageChange})(${page - 1})">&#8592;</button>`;
    for (let i = 0; i < totalPages; i++) {
      btns += `<button class="${i === page ? 'active' : ''}" onclick="(${onPageChange})(${i})">${i + 1}</button>`;
    }
    btns += `<button ${page === totalPages - 1 ? 'disabled' : ''} onclick="(${onPageChange})(${page + 1})">&#8594;</button>`;
    container.innerHTML = `<div class="pagination">${btns}</div>`;
  },

  /* ── Category sidebar widget ────────────────────────────── */
  async renderCategoryWidget(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const cats = await CategoryService.getAll();
      const roots = (cats || []).filter(c => !c.parentId).slice(0, 8);
      if (!roots.length) { el.innerHTML = '<p class="text-muted" style="font-size:.875rem">Chưa có danh mục</p>'; return; }
      el.innerHTML = `<ul class="cat-list">
        ${roots.map(c => `
          <li><a href="category.html?slug=${c.slug}">
            <span>${c.title}</span>
          </a></li>`).join('')}
      </ul>`;
    } catch (_) {}
  },

  /* ── Tag sidebar widget ─────────────────────────────────── */
  async renderTagWidget(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const tags = await TagService.getAll();
      if (!tags?.length) { el.innerHTML = '<p class="text-muted" style="font-size:.875rem">Chưa có tag</p>'; return; }
      el.innerHTML = `<div class="tag-cloud">
        ${tags.slice(0, 20).map(t =>
          `<a href="tag.html?slug=${t.slug}" class="tag-chip tag">${t.title}</a>`
        ).join('')}
      </div>`;
    } catch (_) {}
  },

  /* ── Recent posts sidebar widget ────────────────────────── */
  async renderRecentWidget(containerId, excludeSlug = null) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const posts = await PostService.getPublished();
      const list = (posts || []).filter(p => p.slug !== excludeSlug).slice(0, 5);
      if (!list.length) { el.innerHTML = '<p class="text-muted" style="font-size:.875rem">Chưa có bài viết</p>'; return; }
      el.innerHTML = `<ul class="recent-list">
        ${list.map(p => {
          const thumbUrl = p.imageUrl || p.thumbnailUrl;
          return `
          <li class="recent-item">
            <div class="recent-thumb">
              ${thumbUrl
                ? `<img src="${thumbUrl}" alt="${p.title}" loading="lazy">`
                : `<div style="width:100%;height:100%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.2rem">📝</div>`
              }
            </div>
            <div class="recent-info">
              <a href="post.html?slug=${p.slug}">${p.title}</a>
              <div class="recent-date">${this.formatDateShort(p.publishedAt || p.createdAt)}</div>
            </div>
          </li>`;
        }).join('')}
      </ul>`;
    } catch (_) {}
  },
};
