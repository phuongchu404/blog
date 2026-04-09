/**
 * tag.service.js — Quản lý thẻ tag
 * Phụ thuộc: http.js
 * API: /api/tags
 */

const TagService = {
  getAll()            { return Http.get('/api/tags'); },

  /**
   * Lấy tag theo trang (server-side pagination).
   * Trả về Spring Page { content, totalElements, totalPages } hoặc mảng nếu backend chưa hỗ trợ.
   */
  getPage(page = 0, size = 10) {
    return Http.get(`/api/tags?page=${page}&size=${size}`);
  },

  getById(id)         { return Http.get(`/api/tags/${id}`); },
  getBySlug(slug)     { return Http.get(`/api/tags/slug/${slug}`); },
  search(keyword)     { return Http.get(`/api/tags/search?q=${encodeURIComponent(keyword)}`); },

  create(data)        { return Http.post('/api/tags', data); },
  update(id, data)    { return Http.put(`/api/tags/${id}`, data); },
  delete(id)          { return Http.delete(`/api/tags/${id}`); },
};
