/**
 * series.service.js — Series API
 * Phụ thuộc: http.js
 */

const SeriesService = {
  /** GET /api/series — tất cả series đã publish (public) */
  getAll()          { return Http.get('/api/series'); },

  /** GET /api/series/slug/{slug} — chi tiết series kèm bài viết (public) */
  getBySlug(slug)   { return Http.get(`/api/series/slug/${slug}`); },
};
