/**
 * tag.service.js — Tag API (public)
 * Phụ thuộc: http.js
 */

const TagService = {
  getAll()        { return Http.get('/api/tags'); },
  getById(id)     { return Http.get(`/api/tags/${id}`); },
  getBySlug(slug) { return Http.get(`/api/tags/slug/${slug}`); },
};
