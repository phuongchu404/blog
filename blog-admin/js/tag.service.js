/**
 * tag.service.js — Quản lý thẻ tag
 * Phụ thuộc: http.js
 * API: /api/tags
 */

const TagService = {
  getAll()            { return Http.get('/api/tags'); },
  getById(id)         { return Http.get(`/api/tags/${id}`); },
  getBySlug(slug)     { return Http.get(`/api/tags/slug/${slug}`); },

  create(data)        { return Http.post('/api/tags', data); },
  update(id, data)    { return Http.put(`/api/tags/${id}`, data); },
  delete(id)          { return Http.delete(`/api/tags/${id}`); },
};
