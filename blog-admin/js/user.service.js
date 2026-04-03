/**
 * user.service.js — Quản lý người dùng
 * Phụ thuộc: http.js
 * API: /api/users, /auth/register
 */

const UserService = {
  /** Lấy thông tin user đang đăng nhập */
  me()                      { return Http.get('/api/users/me'); },

  getByUsername(username)   { return Http.get(`/api/users?username=${encodeURIComponent(username)}`); },

  /** Lấy danh sách tất cả user (yêu cầu user:read:all) */
  getAll()                  { return Http.get('/api/users/all'); },

  getById(id)               { return Http.get(`/api/users/${id}`); },
  getByEmail(email)         { return Http.get(`/api/users/email/${encodeURIComponent(email)}`); },

  /** Tìm kiếm user theo từ khóa */
  search(keyword)           { return Http.get(`/api/users/search?keyword=${encodeURIComponent(keyword)}`); },

  update(id, data)          { return Http.put(`/api/users/${id}`, data); },

  /** Xóa user (yêu cầu user:delete) */
  delete(id)                { return Http.delete(`/api/users/${id}`); },

  /** Gán danh sách role cho user (yêu cầu user:assign-role) */
  assignRoles(id, roleIds)  { return Http.post(`/api/users/${id}/roles`, { roleIds }); },
};
