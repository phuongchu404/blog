/**
 * comment.service.js — Quản lý và kiểm duyệt bình luận
 * Phụ thuộc: http.js
 * API: /api/comments
 */

const CommentService = {
  /** Lấy tất cả bình luận (yêu cầu comment:read:all) */
  getAll()                  { return Http.get('/api/comments'); },

  /** Lấy tất cả bình luận của một bài viết (yêu cầu comment:read:all) */
  getByPost(postId)         { return Http.get(`/api/comments/post/${postId}`); },

  /** Lấy bình luận đã duyệt của bài viết (public) */
  getPublishedByPost(postId){ return Http.get(`/api/comments/post/${postId}/published`); },

  /** Lấy các reply của một bình luận */
  getReplies(commentId)     { return Http.get(`/api/comments/${commentId}/replies`); },

  create(data)              { return Http.post('/api/comments', data); },
  update(id, data)          { return Http.put(`/api/comments/${id}`, data); },
  delete(id)                { return Http.delete(`/api/comments/${id}`); },

  /** Duyệt bình luận (yêu cầu comment:moderate) */
  approve(id)               { return Http.put(`/api/comments/${id}/approve`); },

  /** Từ chối / đánh dấu spam (yêu cầu comment:moderate) */
  reject(id)                { return Http.put(`/api/comments/${id}/reject`); },
};
