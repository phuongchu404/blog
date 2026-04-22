/**
 * notification.service.js - Notification API client (blog-public)
 * Depends on: http.js, auth.js
 */

const NotificationService = {
  BASE: '/api/notifications',
  POLL_INTERVAL_MS: 60000,

  getApiBaseUrl() {
    return (localStorage.getItem('apiBaseUrl') || window.APP_CONFIG?.apiBaseUrl || 'http://localhost:8055')
      .replace(/\/+$/, '');
  },

  getStreamUrl() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const url = new URL(`${this.BASE}/stream`, `${this.getApiBaseUrl()}/`);
    url.searchParams.set('token', token);
    return url.toString();
  },

  async getAll(page = 0, size = 20) {
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
