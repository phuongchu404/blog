/**
 * comment.service.js — Comment API (public)
 * Phụ thuộc: http.js
 */

const CommentService = {
  getPublishedByPost(postId) { return Http.get(`/api/comments/post/${postId}/published`); },
  getReplies(commentId)      { return Http.get(`/api/comments/${commentId}/replies`); },
  create(data)               { return Http.post('/api/comments', data); },
  delete(id)                 { return Http.delete(`/api/comments/${id}`); },
};
