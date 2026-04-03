/**
 * role.service.js — Quản lý vai trò (roles)
 * Phụ thuộc: http.js
 * API: /api/roles
 */

const RoleService = {
  /** Lấy tất cả role (yêu cầu role:read) */
  getAll()                          { return Http.get('/api/roles'); },

  /** Tạo role mới (yêu cầu role:create) */
  create(data)                      { return Http.post('/api/roles', data); },

  /** Cập nhật role (yêu cầu role:update) */
  update(id, data)                  { return Http.put(`/api/roles/${id}`, data); },

  /** Xóa role (yêu cầu role:delete) */
  delete(id)                        { return Http.delete(`/api/roles/${id}`); },

  /** Gán danh sách permission cho role (yêu cầu role:assign) */
  assignPermissions(id, permissionIds) {
    return Http.post(`/api/roles/${id}/permissions`, { permissionIds });
  },

  /** Khởi tạo các role mặc định (ADMIN, MODERATOR, AUTHOR, USER) */
  initDefaults()                    { return Http.post('/api/roles/init', {}); },
};
