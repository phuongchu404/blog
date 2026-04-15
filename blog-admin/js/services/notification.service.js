/**
 * notification.service.js — Notification API client (blog-admin)
 * Phụ thuộc: http.js, auth.js
 */

const NotificationService = {
  BASE: '/api/notifications',

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

/* ── Admin notification bell init ───────────────────────────── */
const AdminNotif = {
  async init() {
    await this.refreshBadge();
    setInterval(() => this.refreshBadge(), 60000);

    document.getElementById('admin-notif-mark-all')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await NotificationService.markAllRead();
      await this.refreshBadge();
      await this.loadList();
    });

    // Load list when dropdown opens
    const dropdownEl = document.getElementById('admin-notif-dropdown-toggle');
    if (dropdownEl) {
      dropdownEl.addEventListener('show.bs.dropdown', () => this.loadList());
    }
  },

  async refreshBadge() {
    if (!Auth.isLoggedIn()) return;
    try {
      const count = await NotificationService.getUnreadCount();
      const badge = document.getElementById('admin-notif-badge');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    } catch (_) {}
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
        <a class="dropdown-item${n.read ? '' : ' fw-semibold bg-light'}" href="#"
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
      list.innerHTML = '<div class="dropdown-item text-center text-muted py-3">Không thể tải thông báo</div>';
    }
  },

  async onItemClick(e, id, postSlug, commentId) {
    e.preventDefault();
    await NotificationService.markRead(id);
    await this.refreshBadge();
    if (postSlug) {
      const hash = commentId ? `#comment-${commentId}` : '';
      window.location.href = `../blog-public/post.html?slug=${postSlug}${hash}`;
    } else {
      await this.loadList();
    }
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
  },
};
