/**
 * category.service.js — Quản lý danh mục bài viết
 * Phụ thuộc: http.js
 * API: /api/categories
 */

const CategoryService = {
  /** Lấy toàn bộ danh mục */
  getAll()                { return Http.get('/api/categories'); },

  /**
   * Lấy danh mục theo trang (server-side pagination).
   * Trả về { content, totalElements, totalPages, number } nếu backend hỗ trợ,
   * hoặc fallback sang getAll() nếu backend chưa hỗ trợ.
   */
  getPage(page = 0, size = 10) {
    return Http.get(`/api/categories?page=${page}&size=${size}`);
  },

  /** Lấy danh mục gốc (không có parent) */
  getRoots()              { return Http.get('/api/categories/root'); },

  getById(id)             { return Http.get(`/api/categories/${id}`); },
  getBySlug(slug)         { return Http.get(`/api/categories/slug/${slug}`); },
  search(keyword)         { return Http.get(`/api/categories/search?q=${encodeURIComponent(keyword)}`); },

  /** Lấy danh mục con */
  getSubcategories(id)    { return Http.get(`/api/categories/${id}/subcategories`); },

  create(data)            { return Http.post('/api/categories', data); },
  update(id, data)        { return Http.put(`/api/categories/${id}`, data); },
  delete(id)              { return Http.delete(`/api/categories/${id}`); },
};
