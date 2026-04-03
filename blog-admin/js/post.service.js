/**
 * post.service.js — Quản lý bài viết và metadata
 * Phụ thuộc: http.js
 * API: /api/posts, /api/posts/{id}/meta
 */

const PostService = {
  // ── Bài viết ────────────────────────────────────────────────────────────────

  /** Lấy tất cả bài viết (yêu cầu quyền post:read:all) */
  getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Http.get(`/api/posts${q ? '?' + q : ''}`);
  },

  /** Lấy danh sách bài viết đã publish (public) */
  getPublished(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Http.get(`/api/posts/published${q ? '?' + q : ''}`);
  },

  getById(id)          { return Http.get(`/api/posts/${id}`); },
  getBySlug(slug)      { return Http.get(`/api/posts/slug/${slug}`); },
  search(keyword)      { return Http.get(`/api/posts/search?keyword=${encodeURIComponent(keyword)}`); },
  getByAuthor(authorId){ return Http.get(`/api/posts/author/${authorId}`); },
  getByCategory(slug)  { return Http.get(`/api/posts/category/${slug}`); },
  getByTag(slug)       { return Http.get(`/api/posts/tag/${slug}`); },

  create(data)         { return Http.post('/api/posts', data); },
  update(id, data)     { return Http.put(`/api/posts/${id}`, data); },
  delete(id)           { return Http.delete(`/api/posts/${id}`); },

  /** Đăng bài (yêu cầu quyền post:publish) */
  publish(id)          { return Http.put(`/api/posts/${id}/publish`); },
  unpublish(id)        { return Http.put(`/api/posts/${id}/unpublish`); },

  // ── Metadata (SEO, custom key-value) ────────────────────────────────────────

  /** Lấy toàn bộ metadata của bài viết */
  getMeta(postId)              { return Http.get(`/api/posts/${postId}/meta`); },

  /** Lấy metadata theo key */
  getMetaByKey(postId, key)    { return Http.get(`/api/posts/${postId}/meta/${key}`); },

  /** Tạo hoặc cập nhật một metadata key */
  setMeta(postId, key, value)  { return Http.put(`/api/posts/${postId}/meta/${key}`, { value }); },

  /** Xóa một metadata key */
  deleteMeta(postId, key)      { return Http.delete(`/api/posts/${postId}/meta/${key}`); },

  /** Xóa toàn bộ metadata của bài viết */
  deleteAllMeta(postId)        { return Http.delete(`/api/posts/${postId}/meta`); },
};
