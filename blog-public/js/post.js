/**
 * post.js — Logic trang chi tiết bài viết
 * Phụ thuộc: http.js, auth.js, ui.js, post.service.js, comment.service.js
 */

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `/blog-public/search.html?q=${encodeURIComponent(kw)}`;
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

let currentPost = null;

/* ── Render post header ─────────────────────────────────── */
function renderPostHeader(post) {
  const authorName = post.author?.fullName || post.author?.username || 'Ẩn danh';
  const authorAvatar = UI.avatarUrl(post.author);
  const categories = (post.categories || []).map(c =>
    `<a href="/blog-public/category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
  ).join('');

  document.getElementById('breadcrumb-title').textContent = post.title;
  document.title = `${post.title} - Blog`;

  document.getElementById('post-header-content').innerHTML = `
    ${categories ? `<div class="post-card-cats" style="margin-bottom:.75rem">${categories}</div>` : ''}
    <h1 class="post-title">${post.title}</h1>
    ${post.summary ? `<p class="post-summary">${post.summary}</p>` : ''}
    <div class="post-author-bar">
      <img class="author-avatar"
           src="${authorAvatar}"
           alt="${authorName}"
           onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
      <div class="author-info">
        <div class="author-name">
          <a href="/blog-public/author.html?id=${post.author?.id}">${authorName}</a>
        </div>
        <div class="post-meta-row">
          <span>${UI.formatDate(post.publishedAt || post.createdAt)}</span>
          ${post.viewCount != null ? `<span>· 👁 ${post.viewCount} lượt xem</span>` : ''}
        </div>
      </div>
    </div>`;

  if (post.thumbnailUrl) {
    document.getElementById('post-cover').innerHTML =
      `<div class="post-cover"><img src="${post.thumbnailUrl}" alt="${post.title}"></div>`;
  }
}

/* ── Render post content ─────────────────────────────────── */
function renderPostContent(post) {
  const tags = (post.tags || []).map(t =>
    `<a href="/blog-public/tag.html?slug=${t.slug}" class="tag-chip tag">${t.title}</a>`
  ).join('');

  document.getElementById('post-content-wrap').innerHTML = `
    <div class="post-content">
      <div class="post-body">${post.content || '<p style="color:var(--text-muted)">Bài viết chưa có nội dung.</p>'}</div>
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
    </div>`;
}

/* ── Comments ────────────────────────────────────────────── */
async function loadComments(postId) {
  const wrap = document.getElementById('comments-section-wrap');
  let comments = [];
  try {
    const res = await CommentService.getPublishedByPost(postId);
    comments = Array.isArray(res) ? res : [];
  } catch (_) {}

  const isLoggedIn = Auth.isLoggedIn();
  const user = Auth.getUser();

  wrap.innerHTML = `
    <div class="comments-section">
      <h3 class="comments-count">💬 ${comments.length} bình luận</h3>

      ${isLoggedIn ? `
        <div class="comment-form" style="margin-bottom:2rem">
          <textarea id="new-comment-text" placeholder="Viết bình luận của bạn..."></textarea>
          <div class="comment-form-footer">
            <button class="btn btn-primary btn-sm" onclick="submitComment()">Gửi bình luận</button>
          </div>
        </div>` : `
        <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:1rem 1.25rem;margin-bottom:2rem;font-size:.9rem;color:var(--primary)">
          <a href="/blog-public/login.html" style="font-weight:600">Đăng nhập</a> để bình luận bài viết này.
        </div>`}

      <div class="comment-list" id="comment-list">
        ${comments.length === 0
          ? `<div class="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên!</div>`
          : comments.filter(c => !c.parentId).map(c => renderComment(c, comments, user)).join('')}
      </div>
    </div>`;
}

function renderComment(comment, allComments, currentUser) {
  const authorName = comment.user?.fullName || comment.user?.username || 'Người dùng';
  const avatar = UI.avatarUrl(comment.user);
  const replies = allComments.filter(c => c.parentId === comment.id);
  const isOwner = currentUser && comment.user?.id === currentUser.id;

  return `
    <div class="comment-item" id="comment-${comment.id}">
      <div class="comment-header">
        <img class="comment-avatar" src="${avatar}" alt="${authorName}"
             onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
        <div>
          <div class="comment-author">${authorName}</div>
          <div class="comment-date">${UI.timeAgo(comment.createdAt)}</div>
        </div>
      </div>
      <div class="comment-body">${comment.content || ''}</div>
      <div class="comment-actions">
        ${Auth.isLoggedIn()
          ? `<button onclick="showReplyForm(${comment.id})">↩ Trả lời</button>`
          : ''}
        ${isOwner
          ? `<button onclick="deleteComment(${comment.id})" style="color:var(--danger)">🗑 Xóa</button>`
          : ''}
      </div>
      <div id="reply-form-${comment.id}"></div>
      ${replies.length > 0
        ? `<div class="comment-replies">${replies.map(r => renderComment(r, allComments, currentUser)).join('')}</div>`
        : ''}
    </div>`;
}

function showReplyForm(parentId) {
  const container = document.getElementById(`reply-form-${parentId}`);
  if (!container) return;
  if (container.innerHTML) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="reply-form-wrap">
      <textarea id="reply-text-${parentId}" placeholder="Viết trả lời..."></textarea>
      <div class="reply-form-footer">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('reply-form-${parentId}').innerHTML=''">Hủy</button>
        <button class="btn btn-primary btn-sm" onclick="submitReply(${parentId})">Gửi</button>
      </div>
    </div>`;
}

async function submitComment() {
  if (!Auth.requireLogin()) return;
  const text = document.getElementById('new-comment-text')?.value.trim();
  if (!text) { UI.toast('Vui lòng nhập nội dung bình luận.', 'error'); return; }
  try {
    await CommentService.create({ postId: currentPost.id, content: text });
    UI.toast('Bình luận đã được gửi, chờ duyệt.', 'success');
    document.getElementById('new-comment-text').value = '';
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || 'Không thể gửi bình luận.', 'error');
  }
}

async function submitReply(parentId) {
  if (!Auth.requireLogin()) return;
  const text = document.getElementById(`reply-text-${parentId}`)?.value.trim();
  if (!text) { UI.toast('Vui lòng nhập nội dung trả lời.', 'error'); return; }
  try {
    await CommentService.create({ postId: currentPost.id, parentId, content: text });
    UI.toast('Trả lời đã được gửi, chờ duyệt.', 'success');
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || 'Không thể gửi trả lời.', 'error');
  }
}

async function deleteComment(id) {
  if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
  try {
    await CommentService.delete(id);
    UI.toast('Đã xóa bình luận.', 'success');
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || 'Không thể xóa bình luận.', 'error');
  }
}

/* ── Init ─────────────────────────────────────────────────── */
async function init() {
  UI.renderNav();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const id   = params.get('id');

  if (!slug && !id) {
    document.getElementById('post-header-content').innerHTML =
      `<div class="empty-state"><h3>Không tìm thấy bài viết</h3><p>Thiếu tham số slug hoặc id.</p></div>`;
    return;
  }

  UI.renderCategoryWidget('sidebar-categories');
  UI.renderTagWidget('sidebar-tags');

  try {
    const post = slug ? await PostService.getBySlug(slug) : await PostService.getById(id);
    currentPost = post;

    renderPostHeader(post);
    renderPostContent(post);

    UI.renderRecentWidget('sidebar-recent', post.slug);
    await loadComments(post.id);
  } catch (err) {
    document.getElementById('post-header-content').innerHTML =
      `<div class="empty-state"><h3>Không tìm thấy bài viết</h3><p>${err.message}</p></div>`;
    document.getElementById('post-content-wrap').innerHTML = '';
  }
}

init();
