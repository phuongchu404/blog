/**
 * notification.service.js - Notification API client (blog-admin)
 * Depends on: http.js, auth.js
 */

const NotificationService = {
  BASE: '/api/notifications',
  POLL_INTERVAL_MS: 60000,

  getStreamUrl() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const url = new URL(`${this.BASE}/stream`, `${AppConfig.getApiBaseUrl()}/`);
    url.searchParams.set('token', token);
    return url.toString();
  },

  async getAll(page = 0, size = 15) {
    return Http.get(`${this.BASE}?page=${page}&size=${size}`);
  },

  async getUnreadCount() {
    const res = await Http.get(`${this.BASE}/unread-count`);
    return res?.count ?? 0;
  },

  async markRead(id) {
    return Http.put(`${this.BASE}/${id}/read`);
  },

  async markAllRead() {
    return Http.put(`${this.BASE}/read-all`);
  },
};

const AdminNotif = {
  _eventSource: null,
  _pollTimer: null,
  _streamUrl: null,
  _lifecycleBound: false,

  async init() {
    this.bindLifecycle();
    await this.refreshBadge();
    this.startRealtime();

    document.getElementById('admin-notif-mark-all')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await NotificationService.markAllRead();
      await this.refreshBadge();
      await this.loadList();
    });

    const dropdownEl = document.getElementById('admin-notif-dropdown-toggle');
    if (dropdownEl) {
      dropdownEl.addEventListener('show.bs.dropdown', () => this.loadList());
    }
  },

  startRealtime() {
    if (!window.EventSource || !Auth.isLoggedIn()) {
      this.stopRealtime();
      this.startPolling();
      return;
    }

    const streamUrl = NotificationService.getStreamUrl();
    if (!streamUrl) {
      this.stopRealtime();
      this.startPolling();
      return;
    }

    if (document.visibilityState === 'hidden') {
      this.stopRealtime();
      this.startPolling();
      return;
    }

    if (this._eventSource && this._streamUrl === streamUrl && this._eventSource.readyState !== EventSource.CLOSED) {
      return;
    }

    this.stopRealtime();

    const source = new EventSource(streamUrl);
    this._eventSource = source;
    this._streamUrl = streamUrl;

    source.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.applyUnreadCount(payload?.unreadCount ?? 0);
        const isOpen = document
          .getElementById('admin-notif-dropdown-toggle')
          ?.closest('.dropdown')
          ?.querySelector('.dropdown-menu')
          ?.classList.contains('show');
        if (isOpen) this.loadList();
      } catch (_) {}
    });

    source.onerror = async () => {
      this.stopRealtime();
      this.startPolling();
      await this.refreshBadge();
    };
  },

  stopRealtime() {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
    this._streamUrl = null;
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => this.refreshBadge(), NotificationService.POLL_INTERVAL_MS);
  },

  bindLifecycle() {
    if (this._lifecycleBound) return;
    this._lifecycleBound = true;

    const handleVisibility = () => {
      if (!Auth.isLoggedIn()) {
        this.stopRealtime();
        return;
      }
      if (document.visibilityState === 'hidden') {
        this.stopRealtime();
      } else {
        this.startRealtime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', () => this.stopRealtime());
    window.addEventListener('beforeunload', () => this.stopRealtime());
  },

  async refreshBadge() {
    if (!Auth.isLoggedIn()) return;
    try {
      const count = await NotificationService.getUnreadCount();
      this.applyUnreadCount(count);
    } catch (_) {}
  },

  applyUnreadCount(count) {
    const badge = document.getElementById('admin-notif-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  },

  async loadList() {
    const list = document.getElementById('admin-notif-list');
    if (!list) return;
    try {
      const data = await NotificationService.getAll(0, 10);
      const items = data?.content || [];
      if (!items.length) {
        list.innerHTML = '<div class="dropdown-item text-center text-muted py-3">Chưa có thông báo</div>';
        return;
      }
      list.innerHTML = items.map(n => `
        <a class="dropdown-item${n.read ? '' : ' fw-semibold bg-light'}" href="${AdminNotif.buildItemUrl(n.postSlug, n.commentId)}"
           ${n.postSlug ? 'target="_blank" rel="noopener noreferrer"' : ''}
           onclick="AdminNotif.onItemClick(event, ${n.id}, '${n.postSlug || ''}', ${n.commentId || 'null'})">
          <div class="d-flex align-items-start gap-2">
            <div class="flex-shrink-0 mt-1">
              <i class="bi ${n.type === 'REPLY_COMMENT' ? 'bi-reply-fill text-success' : 'bi-chat-dots-fill text-primary'}" style="font-size:.9rem"></i>
            </div>
            <div class="flex-grow-1" style="min-width:0">
              <div style="font-size:.82rem;white-space:normal;word-break:break-word">${n.message}</div>
              <small class="text-muted">${AdminNotif.timeAgo(n.createdAt)}</small>
            </div>
            ${!n.read ? '<span class="flex-shrink-0 mt-1"><i class="bi bi-circle-fill text-primary" style="font-size:.5rem"></i></span>' : ''}
          </div>
        </a>`).join('');
    } catch (_) {
      list.innerHTML = '<div class="dropdown-item text-center text-muted py-3">Khong the tai thong bao</div>';
    }
  },

  buildItemUrl(postSlug, commentId) {
    if (!postSlug) return '#';
    const hash = commentId ? `comment-${commentId}` : '';
    return AppConfig.buildPublicUrl('post.html', { slug: postSlug }, hash);
  },

  async onItemClick(e, id, postSlug, commentId) {
    await NotificationService.markRead(id);
    await this.refreshBadge();
    if (postSlug) {
      await this.loadList();
      return;
    } else {
      e.preventDefault();
      await this.loadList();
    }
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vua xong';
    if (m < 60) return `${m} phut truoc`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} gio truoc`;
    return `${Math.floor(h / 24)} ngay truoc`;
  },
};
