/**
 * notification.service.js — Notification API client (blog-public)
 * Phụ thuộc: http.js, auth.js
 */

const NotificationService = {
  BASE: '/api/notifications',

  /** Lấy danh sách thông báo của user hiện tại */
  async getAll(page = 0, size = 20) {
    return Http.get(`${this.BASE}?page=${page}&size=${size}`);
  },

  /** Lấy số thông báo chưa đọc */
  async getUnreadCount() {
    const res = await Http.get(`${this.BASE}/unread-count`);
    return res?.count ?? 0;
  },

  /** Đánh dấu 1 thông báo đã đọc */
  async markRead(id) {
    return Http.put(`${this.BASE}/${id}/read`);
  },

  /** Đánh dấu tất cả đã đọc */
  async markAllRead() {
    return Http.put(`${this.BASE}/read-all`);
  },
};
