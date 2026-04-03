/**
 * category.service.js — Category API (public)
 * Phụ thuộc: http.js
 */

const CategoryService = {
  getAll()              { return Http.get('/api/categories'); },
  getRoots()            { return Http.get('/api/categories/root'); },
  getById(id)           { return Http.get(`/api/categories/${id}`); },
  getBySlug(slug)       { return Http.get(`/api/categories/slug/${slug}`); },
  getSubcategories(id)  { return Http.get(`/api/categories/${id}/subcategories`); },
};
