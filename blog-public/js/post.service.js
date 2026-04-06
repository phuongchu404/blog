/**
 * post.service.js — Public blog post API
 * Phụ thuộc: http.js
 */

const PostService = {
  getPublished(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Http.get(`/api/posts/published${q ? '?' + q : ''}`);
  },
  getBySlug(slug)       { return Http.get(`/api/posts/slug/${slug}`); },
  getById(id)           { return Http.get(`/api/posts/${id}`); },
  search(keyword)       { return Http.get(`/api/posts/search?keyword=${encodeURIComponent(keyword)}`); },
  getByAuthor(authorId) { return Http.get(`/api/posts/author/${authorId}`); },
  getByCategory(slug)   { return Http.get(`/api/posts/category/${slug}`); },
  getByTag(slug)        { return Http.get(`/api/posts/tag/${slug}`); },

  // Tạo bài viết (user phải đăng nhập)
  create(data)          { return Http.post('/api/posts', data); },
};
