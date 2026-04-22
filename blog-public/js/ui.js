/**
 * ui.js — Tiện ích giao diện dùng chung (blog-public)
 * Phụ thuộc: auth.js
 */

const UI = {
  _notifEventSource: null,
  _notifPollTimer: null,
  _notifStreamUrl: null,
  _notifLifecycleBound: false,

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
  _t(key) {
    return typeof I18n !== 'undefined' ? I18n.t(key) : key;
  },

  loading(container, message) {
    const msg = message ?? this._t('ui.loading');
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>${msg}</span>
      </div>`;
  },

  emptyState(container, title, desc = '') {
    const heading = title ?? this._t('ui.empty');
    container.innerHTML = `
      <div class="empty-state">
        <h3>${heading}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
      </div>`;
  },

  /* ── Format ─────────────────────────────────────────────── */
  _locale() {
    return typeof I18n !== 'undefined' && I18n.getLang() === 'en' ? 'en-US' : 'vi-VN';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(this._locale(), {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(this._locale(), {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return this._t('ui.time_just_now');
    if (m < 60) return this._t('ui.time_minutes').replace('{m}', m);
    const h = Math.floor(m / 60);
    if (h < 24) return this._t('ui.time_hours').replace('{h}', h);
    const d = Math.floor(h / 24);
    if (d < 30) return this._t('ui.time_days').replace('{d}', d);
    return this.formatDateShort(dateStr);
  },

  toSlug(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  },

  uniqueCategories(categories = []) {
    const seen = new Set();
    return categories.filter((category) => {
      if (!category) return false;
      const key = category.id ?? category.slug ?? category.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  buildCategoryTree(categories = []) {
    const nodes = categories.map((category) => ({ ...category, children: [] }));
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const roots = [];

    nodes.forEach((node) => {
      const parent = node.parentId ? nodeMap.get(node.parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });

    return roots;
  },

  renderMegaChildren(children = [], depth = 1) {
    if (!children.length) return '';
    return `
      <div class="mega-subtree">
        ${children.map((child) => `
          <div class="mega-subnode" style="--mega-depth:${depth}">
            <a href="category.html?slug=${child.slug}" class="mega-sub-item">
              ${child.title}
            </a>
            ${this.renderMegaChildren(child.children, depth + 1)}
          </div>
        `).join('')}
      </div>
    `;
  },

  renderMegaGroups(nodes = []) {
    return nodes.map((node) => `
      <div class="mega-group">
        <a href="category.html?slug=${node.slug}" class="mega-group-title">${node.title}</a>
        ${this.renderMegaChildren(node.children)}
      </div>
    `).join('');
  },

  renderMegaPanelSections(node) {
    if (!node?.children?.length) {
      return `
        <div class="mega-browser-empty">
          <a href="category.html?slug=${node.slug}" class="mega-browser-link">
            Xem bài viết trong ${node.title}
          </a>
        </div>
      `;
    }

    return node.children.map((child) => {
      if (!child.children?.length) {
        return `
          <div class="mega-browser-section">
            <div class="mega-browser-chip-row">
              <a href="category.html?slug=${child.slug}" class="mega-browser-chip">${child.title}</a>
            </div>
          </div>
        `;
      }

      return `
        <div class="mega-browser-section">
          <div class="mega-browser-section-head">
            <a href="category.html?slug=${child.slug}" class="mega-browser-section-title">${child.title}</a>
          </div>
          <div class="mega-browser-chip-row">
            ${child.children.map((grandchild) => `
              <a href="category.html?slug=${grandchild.slug}" class="mega-browser-chip">${grandchild.title}</a>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  renderCategoryTreeList(nodes = [], depth = 0) {
    if (!nodes.length) return '';
    const listClass = depth === 0 ? 'cat-list' : 'cat-children';
    return `
      <ul class="${listClass}">
        ${nodes.map((node) => `
          <li class="cat-item${node.children.length ? ' has-children open' : ''}">
            <div class="cat-row" style="--cat-depth:${depth}">
              ${node.children.length
                ? `<button type="button" class="cat-toggle" aria-expanded="true" aria-label="Toggle subcategories"
                   onclick="const item=this.closest('.cat-item'); item.classList.toggle('open'); this.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');"></button>`
                : '<span class="cat-toggle-spacer" aria-hidden="true"></span>'}
              <a href="category.html?slug=${node.slug}" class="cat-link">
                <span>${node.title}</span>
              </a>
            </div>
            ${node.children.length ? this.renderCategoryTreeList(node.children, depth + 1) : ''}
          </li>
        `).join('')}
      </ul>
    `;
  },

  /* ── Avatar placeholder ─────────────────────────────────── */
  avatarUrl(user) {
    if (user?.imageUrl) return user.imageUrl;
    const name = encodeURIComponent(user?.username || user?.fullName || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=80`;
  },

  _renderMembershipDropdown(user) {
    const t = (k) => this._t(k);
    const membershipStatus = user?.membershipStatus ?? 0;

    if (membershipStatus === 1) {
      return `
        <div class="user-dropdown-status">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0l2.122 4.298L14.828 5l-3.414 3.328.806 4.705L8 10.8l-4.22 2.233.806-4.705L1.172 5l4.706-.702L8 0z"/></svg>
          ${t('nav.membership_active')}
        </div>`;
    }

    if (membershipStatus === 2) {
      return `
        <div class="user-dropdown-status user-dropdown-status-pending">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 1 .5.5v3.293l2.146 2.147a.5.5 0 0 1-.707.707l-2.293-2.293A.5.5 0 0 1 7.5 7.5V4a.5.5 0 0 1 .5-.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm0-1A7 7 0 1 1 8 1a7 7 0 0 1 0 14z"/></svg>
          ${t('nav.membership_pending')}
        </div>`;
    }

    return `
      <a href="membership.html">
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0l2.122 4.298L14.828 5l-3.414 3.328.806 4.705L8 10.8l-4.22 2.233.806-4.705L1.172 5l4.706-.702L8 0z"/></svg>
        ${t('nav.upgrade_membership')}
      </a>`;
  },

  /* ── Render nav (header) ────────────────────────────────── */
  renderNav() {
    this._ensureNotifLifecycle();
    this.initTheme();

    const user = Auth.getUser();
    console.log('[renderNav] localStorage.user =', user?.username);
    const navAuth = document.getElementById('nav-auth');
    console.log('[renderNav] navAuth element:', navAuth);
    if (!navAuth) return;

    if (Auth.isLoggedIn() && user) {
      const t = (k) => this._t(k);
      navAuth.innerHTML = `
        <!-- Notification Bell -->
        <div class="notif-wrap" id="notif-wrap">
          <button class="notif-btn" id="notif-btn" aria-label="${t('ui.notif_label')}">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
            </svg>
            <span class="notif-badge" id="notif-badge" style="display:none">0</span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-header">
              <span>${t('ui.notif_label')}</span>
              <button class="notif-mark-all" id="notif-mark-all">${t('nav.mark_all_read') || (I18n.getLang() === 'en' ? 'Mark all read' : 'Đánh dấu đã đọc')}</button>
            </div>
            <div class="notif-list" id="notif-list">
              <div class="notif-empty">${t('ui.loading')}</div>
            </div>
          </div>
        </div>

        <!-- User Menu -->
        <div class="user-menu">
          <button class="user-avatar-btn" id="user-menu-btn" aria-expanded="false">
            <img class="user-avatar-img" src="${this.avatarUrl(user)}" alt="avatar" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff&size=80'">
            <span>${user.username || user.fullName || 'Me'}</span>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a href="profile.html">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z"/></svg>
              ${t('nav.profile')}
            </a>
            <hr>
            <a href="profile.html#doi-mat-khau">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v1h1.5A1.5 1.5 0 0 1 13 5.5v7A1.5 1.5 0 0 1 11.5 14h-7A1.5 1.5 0 0 1 3 12.5v-7A1.5 1.5 0 0 1 4.5 4H6V3a2 2 0 0 1 2-2zm1 3V3a1 1 0 1 0-2 0v1h2zm-1 3a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 8 7z"/><path d="M4.5 5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-7z"/></svg>
              ${t('nav.change_password')}
            </a>
            ${this._renderMembershipDropdown(user)}
            <hr>
            <button onclick="Auth.logout()">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>
              ${t('nav.logout')}
            </button>
          </div>
        </div>`;

      // User menu toggle
      document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('user-dropdown')?.classList.toggle('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      });

      // Notification bell toggle
      document.getElementById('notif-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = document.getElementById('notif-dropdown');
        const isOpen = dd?.classList.toggle('open');
        if (isOpen) this._loadNotifications();
        document.getElementById('user-dropdown')?.classList.remove('open');
      });

      // Mark all read
      document.getElementById('notif-mark-all')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await NotificationService.markAllRead();
        this._refreshNotifBadge();
        this._loadNotifications();
      });

      // Close dropdowns on outside click
      document.addEventListener('click', () => {
        document.getElementById('user-dropdown')?.classList.remove('open');
        document.getElementById('notif-dropdown')?.classList.remove('open');
      });

      // Load unread count on page load
      this._refreshNotifBadge();
      this._startNotifRealtime();

    } else {
      this._stopNotifRealtime();
      const t = (k) => this._t(k);
      navAuth.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">${t('nav.login')}</a>
        <a href="register.html" class="btn btn-primary btn-sm">${t('nav.register')}</a>`;
    }

    // Render categories megamenu (independent of auth state)
    this.renderCategoriesMegamenu();
  },

  _startNotifRealtime() {
    if (!window.EventSource || !Auth.isLoggedIn()) {
      this._stopNotifRealtime();
      this._startNotifPolling();
      return;
    }

    const streamUrl = NotificationService.getStreamUrl();
    if (!streamUrl) {
      this._stopNotifRealtime();
      this._startNotifPolling();
      return;
    }

    if (document.visibilityState === 'hidden') {
      this._stopNotifRealtime();
      this._startNotifPolling();
      return;
    }

    if (this._notifEventSource && this._notifStreamUrl === streamUrl && this._notifEventSource.readyState !== EventSource.CLOSED) {
      return;
    }

    this._stopNotifRealtime();

    const source = new EventSource(streamUrl);
    this._notifEventSource = source;
    this._notifStreamUrl = streamUrl;

    source.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse(event.data);
        this._applyNotifBadge(payload?.unreadCount ?? 0);
        const isOpen = document.getElementById('notif-dropdown')?.classList.contains('open');
        if (isOpen) this._loadNotifications();
      } catch (_) { }
    });

    source.onerror = async () => {
      this._stopNotifRealtime();
      this._startNotifPolling();
      await this._refreshNotifBadge();
    };
  },

  _stopNotifRealtime() {
    if (this._notifEventSource) {
      this._notifEventSource.close();
      this._notifEventSource = null;
    }
    this._notifStreamUrl = null;
    if (this._notifPollTimer) {
      clearInterval(this._notifPollTimer);
      this._notifPollTimer = null;
    }
  },

  _startNotifPolling() {
    if (this._notifPollTimer) return;
    this._notifPollTimer = setInterval(() => this._refreshNotifBadge(), NotificationService.POLL_INTERVAL_MS);
  },

  _ensureNotifLifecycle() {
    if (this._notifLifecycleBound) return;
    this._notifLifecycleBound = true;

    const handleVisibility = () => {
      if (!Auth.isLoggedIn()) {
        this._stopNotifRealtime();
        return;
      }
      if (document.visibilityState === 'hidden') {
        this._stopNotifRealtime();
      } else {
        this._startNotifRealtime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', () => this._stopNotifRealtime());
    window.addEventListener('beforeunload', () => this._stopNotifRealtime());
  },

  async _refreshNotifBadge() {
    if (!Auth.isLoggedIn()) return;
    try {
      const count = await NotificationService.getUnreadCount();
      this._applyNotifBadge(count);
    } catch (_) { }
  },

  _applyNotifBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  async _loadNotifications() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    try {
      const data = await NotificationService.getAll(0, 15);
      const items = data?.content || [];
      if (!items.length) {
        list.innerHTML = `<div class="notif-empty">${this._t('ui.no_notifications')}</div>`;
        return;
      }
      list.innerHTML = items.map(n => `
        <div class="notif-item${n.read ? '' : ' unread'}" data-id="${n.id}"
             onclick="UI._onNotifClick(${n.id}, '${n.postSlug || ''}', ${n.commentId || 'null'})">
          <div class="notif-icon ${n.type === 'REPLY_COMMENT' ? 'reply' : 'comment'}">
            ${n.type === 'REPLY_COMMENT'
          ? '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/></svg>'
          : '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12z"/></svg>'
        }
          </div>
          <div class="notif-content">
            <p>${n.message}</p>
            <span class="notif-time">${this.timeAgo(n.createdAt)}</span>
          </div>
          ${!n.read ? '<div class="notif-dot"></div>' : ''}
        </div>`).join('');
    } catch (_) {
      list.innerHTML = `<div class="notif-empty">${this._t('ui.cannot_load_notifications')}</div>`;
    }
  },

  async _onNotifClick(id, postSlug, commentId) {
    await NotificationService.markRead(id);
    const el = document.querySelector(`.notif-item[data-id="${id}"]`);
    el?.classList.remove('unread');
    el?.querySelector('.notif-dot')?.remove();
    this._refreshNotifBadge();
    if (postSlug) {
      const hash = commentId ? `#comment-${commentId}` : '';
      window.location.href = `post.html?slug=${postSlug}${hash}`;
    }
  },

  /* ── Render categories megamenu ─────────────────────────────── */
  async renderCategoriesMegamenu() {
    const trigger = document.getElementById('cat-mega-trigger');
    if (!trigger) return;
    try {
      const cats = await CategoryService.getAll();
      if (!cats?.length) return;

      // Build megamenu HTML
      const menuEl = document.getElementById('cat-megamenu');
      if (!menuEl) return;

      const roots = this.buildCategoryTree(cats || []);

      if (roots.length <= 6) {
        // Simple dropdown nếu ít danh mục
        menuEl.innerHTML = `
          <div class="mega-simple">
            ${this.renderMegaGroups(roots)}
            <div class="mega-divider"></div>
            <a href="blog.html" class="mega-item mega-all">${this._t('blog.title')} →</a>
          </div>`;
      } else {
        // Multi-column megamenu kiểu CellphoneS
        const COLS = 3;
        const perCol = Math.ceil(roots.length / COLS);
        const columns = [];
        for (let i = 0; i < COLS; i++) {
          columns.push(roots.slice(i * perCol, (i + 1) * perCol));
        }
        menuEl.innerHTML = `
          <div class="mega-grid">
            ${columns.map(col => `
              <div class="mega-col">
                ${this.renderMegaGroups(col)}
              </div>`).join('')}
          </div>
          <div class="mega-footer">
            <a href="blog.html" class="mega-all-posts">${this._t('blog.title')} →</a>
          </div>`;
      }
    } catch (_) { }
  },

  /* ── Theme toggle ────────────────────────────────────────── */
  async renderCategoriesMegamenu() {
    const trigger = document.getElementById('cat-mega-trigger');
    if (!trigger) return;
    try {
      const cats = await CategoryService.getAll();
      const menuEl = document.getElementById('cat-megamenu');
      if (!menuEl || !cats?.length) return;

      const roots = this.buildCategoryTree(cats || []);
      if (!roots.length) return;

      menuEl.innerHTML = `
        <div class="mega-browser">
          <div class="mega-browser-nav">
            ${roots.map((root, index) => `
              <button type="button" class="mega-browser-nav-item${index === 0 ? ' active' : ''}" data-root-id="${root.id}">
                <span>${root.title}</span>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            `).join('')}
          </div>
          <div class="mega-browser-content">
            ${roots.map((root, index) => `
              <section class="mega-browser-panel${index === 0 ? ' active' : ''}" data-root-panel="${root.id}">
                <div class="mega-browser-panel-head">
                  <a href="category.html?slug=${root.slug}" class="mega-browser-root-link">${root.title}</a>
                  <a href="blog.html" class="mega-browser-all-link">${this._t('blog.title')} -></a>
                </div>
                <div class="mega-browser-sections">
                  ${this.renderMegaPanelSections(root)}
                </div>
              </section>
            `).join('')}
          </div>
        </div>`;

      const navItems = menuEl.querySelectorAll('.mega-browser-nav-item');
      const panels = menuEl.querySelectorAll('.mega-browser-panel');
      const activateRoot = (rootId) => {
        navItems.forEach((item) => item.classList.toggle('active', item.dataset.rootId === rootId));
        panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.rootPanel === rootId));
      };

      navItems.forEach((item) => {
        item.addEventListener('mouseenter', () => activateRoot(item.dataset.rootId));
        item.addEventListener('focus', () => activateRoot(item.dataset.rootId));
      });
    } catch (_) { }
  },

  initTheme() {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    // Language switcher
    if (!document.getElementById('lang-toggle')) {
      const langBtn = document.createElement('button');
      langBtn.id = 'lang-toggle';
      langBtn.className = 'lang-toggle';
      const langLabel = this._t('lang.current');
      const switchLabel = this._t('lang.switch_label');
      langBtn.setAttribute('title', switchLabel);
      langBtn.textContent = langLabel;
      langBtn.addEventListener('click', () => {
        if (typeof I18n !== 'undefined') I18n.toggle();
      });
      navAuth.parentNode.insertBefore(langBtn, navAuth);
    }

    // Theme toggle
    if (!document.getElementById('theme-toggle')) {
      const btn = document.createElement('button');
      btn.id = 'theme-toggle';
      btn.className = 'theme-toggle';
      btn.setAttribute('aria-label', 'Toggle theme');
      btn.innerHTML = `
        <svg class="icon-moon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
        </svg>
        <svg class="icon-sun" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z"/>
        </svg>`;
      navAuth.parentNode.insertBefore(btn, navAuth);

      btn.addEventListener('click', () => {
        const isDark = document.documentElement.dataset.theme === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('blog-theme', next);
      });
    }
  },

  /* ── Active nav link ─────────────────────────────────────── */
  setActiveNav() {
    const path = window.location.pathname;
    // Chỉ highlight <a> trực tiếp, KHÔNG touch megamenu button
    document.querySelectorAll('.nav-links > a').forEach(link => {
      const href = link.getAttribute('href') || '';
      link.classList.remove('active');
      if (path.endsWith(href)) {
        link.classList.add('active');
      }
    });
  },

  /* ── Featured card (dùng ở trang chủ - 3 bài nổi bật) ──── */
  featuredCard(post) {
    const categories = this.uniqueCategories(post.categories).map(c =>
      `<a href="category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
    ).join('');
    const thumbUrl = post.imageUrl || post.thumbnailUrl;
    const thumb = thumbUrl
      ? `<div class="post-card-thumb"><img src="${thumbUrl}" alt="${post.title}" loading="lazy"></div>`
      : `<div class="post-card-no-thumb">📝</div>`;
    const authorName = post.author?.fullName || post.author?.username || this._t('ui.anonymous');
    const authorAvatar = this.avatarUrl(post.author);
    const readTime = this.readingTime(post.summary || post.title);

    return `
      <article class="post-card post-card--featured">
        <a href="post.html?slug=${post.slug}">${thumb}</a>
        <div class="post-card-body">
          <div class="featured-label">${this._t('post.featured_label')}</div>
          ${post.memberOnly ? `<div class="post-card-member-badge">🔒 Member Only</div>` : ''}
          ${categories ? `<div class="post-card-cats">${categories}</div>` : ''}
          <h2 class="post-card-title">
            <a href="post.html?slug=${post.slug}">${post.title}</a>
          </h2>
          ${post.summary ? `<p class="post-card-excerpt">${post.summary}</p>` : ''}
          <div class="post-card-meta">
            <img class="avatar-xs" src="${authorAvatar}" alt="${authorName}"
                 onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
            <span>${authorName}</span>
            <span>·</span>
            <span>${this.formatDateShort(post.publishedAt || post.createdAt)}</span>
            <span>·</span>
            <span class="read-time">⏱ ${readTime}</span>
          </div>
        </div>
      </article>`;
  },

  /* ── Reading time estimate ──────────────────────────────── */
  readingTime(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    return this._t('ui.min_read').replace('{n}', mins);
  },

  /* ── Post card HTML ─────────────────────────────────────── */
  postCard(post) {
    const categories = this.uniqueCategories(post.categories).map(c =>
      `<a href="category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
    ).join('');

    const thumbUrl = post.imageUrl || post.thumbnailUrl;
    const thumb = thumbUrl
      ? `<div class="post-card-thumb"><img src="${thumbUrl}" alt="${post.title}" loading="lazy"></div>`
      : `<div class="post-card-no-thumb">📝</div>`;

    const authorName = post.author?.fullName || post.author?.username || this._t('ui.anonymous');
    const authorAvatar = this.avatarUrl(post.author);
    const readTime = this.readingTime(post.summary || post.title);

    return `
      <article class="post-card">
        <a href="post.html?slug=${post.slug}">${thumb}</a>
        <div class="post-card-body">
          ${post.memberOnly ? `<div class="post-card-member-badge">🔒 Member Only</div>` : ''}
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
            <span>·</span>
            <span class="read-time">⏱ ${readTime}</span>
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

  /* ── Newsletter submit handler ──────────────────────────── */
  async newsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const email = input?.value?.trim();
    if (!email) return;

    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = this._t('ui.subscribing');

    try {
      await Http.post('/api/newsletter/subscribe', { email });
      this.toast(this._t('ui.newsletter_success'), 'success');
      input.value = '';
    } catch (err) {
      this.toast(err.message || this._t('ui.newsletter_failed'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  },

  /* ── Category sidebar widget ────────────────────────────── */
  async renderCategoryWidget(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const cats = await CategoryService.getAll();
      const roots = this.buildCategoryTree(cats || []).slice(0, 8);
      if (!roots.length) { el.innerHTML = `<p class="text-muted" style="font-size:.875rem">${this._t('ui.no_categories')}</p>`; return; }
      el.innerHTML = this.renderCategoryTreeList(roots);
    } catch (_) { }
  },

  /* ── Tag sidebar widget ─────────────────────────────────── */
  async renderTagWidget(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const tags = await TagService.getAll();
      if (!tags?.length) { el.innerHTML = `<p class="text-muted" style="font-size:.875rem">${this._t('ui.no_tags')}</p>`; return; }
      el.innerHTML = `<div class="tag-cloud">
        ${tags.slice(0, 20).map(t =>
        `<a href="tag.html?slug=${t.slug}" class="tag-chip tag">${t.title}</a>`
      ).join('')}
      </div>`;
    } catch (_) { }
  },

  /* ── Recent posts sidebar widget ────────────────────────── */
  async renderRecentWidget(containerId, excludeSlug = null) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const posts = await PostService.getPublished({ page: 0, size: excludeSlug ? 6 : 5 });
      const items = Array.isArray(posts) ? posts : (posts?.content || []);
      const list = items.filter(p => p.slug !== excludeSlug).slice(0, 5);
      if (!list.length) { el.innerHTML = `<p class="text-muted" style="font-size:.875rem">${this._t('ui.no_posts')}</p>`; return; }
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
    } catch (_) { }
  },
};
