/**
 * user.service.js — User API (public)
 * Phụ thuộc: http.js
 */

const UserService = {
  getById(id)           { return Http.get(`/api/users/${id}`); },
  getByUsername(name)   { return Http.get(`/api/users?username=${encodeURIComponent(name)}`); },
  getCurrent()          { return Http.get('/api/users/me'); },
};
