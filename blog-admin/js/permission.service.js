/**
 * permission.service.js — Quản lý quyền hạn (permissions)
 * Phụ thuộc: http.js
 * API: /api/permissions
 */

const PermissionService = {
  /** Lấy tất cả permission (yêu cầu permission:read) */
  getAll()            { return Http.get('/api/permissions'); },

  /** Tạo permission mới (yêu cầu permission:create) */
  create(data)        { return Http.post('/api/permissions', data); },

  /** Cập nhật permission (yêu cầu permission:update) */
  update(id, data)    { return Http.put(`/api/permissions/${id}`, data); },

  /** Xóa permission (yêu cầu permission:delete) */
  delete(id)          { return Http.delete(`/api/permissions/${id}`); },
};
