/**
 * post.js — Logic trang chi tiết bài viết
 * Phụ thuộc: http.js, auth.js, ui.js, post.service.js, comment.service.js
 */

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
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
    `<a href="category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
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
          <a href="author.html?id=${post.author?.id}">${authorName}</a>
        </div>
        <div class="post-meta-row">
          <span>${UI.formatDate(post.publishedAt || post.createdAt)}</span>
          ${post.viewCount != null ? `<span>· 👁 ${post.viewCount} lượt xem</span>` : ''}
        </div>
      </div>
    </div>`;

  const thumbUrl = post.imageUrl || post.thumbnailUrl;
  if (thumbUrl) {
    document.getElementById('post-cover').innerHTML =
      `<div class="post-cover"><img src="${thumbUrl}" alt="${post.title}"></div>`;
  }
}

/* ── Table of Contents ───────────────────────────────────── */
function buildTOC(contentHtml) {
  const tmp = document.createElement('div');
  tmp.innerHTML = contentHtml;
  const headings = tmp.querySelectorAll('h2, h3');

  const tocEl = document.getElementById('post-toc');
  if (!tocEl || headings.length < 2) return tmp.innerHTML;

  let items = '';
  headings.forEach((h, i) => {
    const id = `toc-heading-${i}`;
    h.id = id;
    const cls = h.tagName === 'H3' ? ' class="toc-h3"' : '';
    items += `<li${cls}><a href="#${id}">${h.textContent.trim()}</a></li>`;
  });

  tocEl.innerHTML = `
    <div class="toc-header">
      <span class="toc-title">Nội dung bài viết</span>
      <button class="toc-toggle" onclick="this.closest('.post-toc-sidebar').classList.toggle('collapsed')" title="Ẩn/hiện mục lục">☰</button>
    </div>
    <ol class="toc-list">${items}</ol>`;

  /* Highlight mục đang đọc khi scroll */
  const links = tocEl.querySelectorAll('a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const active = tocEl.querySelector(`a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  tmp.querySelectorAll('h2, h3').forEach(h => {
    const real = document.getElementById(h.id);
    if (real) observer.observe(real);
  });

  return tmp.innerHTML;
}

/* ── Membership gate ─────────────────────────────────────── */
function renderMembershipGate() {
  const isLoggedIn = Auth.isLoggedIn();
  const user = Auth.getUser();
  const status = user?.membershipStatus ?? 0; // 0=none, 1=active, 2=pending

  let actionHtml = '';
  if (!isLoggedIn) {
    actionHtml = `<a href="login.html" class="btn btn-primary membership-gate-btn">Đăng nhập</a>`;
  } else if (status === 2) {
    actionHtml = `<span class="membership-gate-pending">⏳ Yêu cầu của bạn đang chờ duyệt</span>`;
  } else {
    // status = 0 (none) — chưa có membership, cho phép gửi yêu cầu
    actionHtml = `<a href="membership.html" class="btn btn-primary membership-gate-btn">🚀 Đăng ký Membership</a>`;
  }

  const desc = !isLoggedIn
    ? 'Đăng nhập rồi đăng ký membership để đọc toàn bộ nội dung.'
    : status === 2
      ? 'Admin sẽ xét duyệt yêu cầu của bạn sớm nhất.'
      : 'Tài khoản của bạn chưa có membership. Gửi yêu cầu để được duyệt truy cập miễn phí.';

  return `
    <div class="membership-gate">
      <div class="membership-gate-icon">🔒</div>
      <h3 class="membership-gate-title">Nội dung dành cho thành viên</h3>
      <p class="membership-gate-desc">${desc}</p>
      ${actionHtml}
    </div>`;
}

/* ── Render post content ─────────────────────────────────── */
function renderPostContent(post) {
  const tags = (post.tags || []).map(t =>
    `<a href="tag.html?slug=${t.slug}" class="tag-chip tag">${t.title}</a>`
  ).join('');

  const bodyHtml = post.content || '<p style="color:var(--text-muted)">Bài viết chưa có nội dung.</p>';

  const memberBadge = post.memberOnly
    ? `<div class="member-only-badge"><span>🔒 Member Only</span></div>`
    : '';

  document.getElementById('post-content-wrap').innerHTML = `
    <div class="post-content">
      ${memberBadge}
      <div class="post-body">${bodyHtml}</div>
      ${post.contentLocked ? renderMembershipGate() : ''}
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
    </div>`;

  /* Build TOC sau khi content đã được render vào DOM */
  if (!post.contentLocked) {
    const contentWithIds = buildTOC(post.content || '');
    const postBody = document.querySelector('.post-body');
    if (postBody) postBody.innerHTML = contentWithIds;
  }
}

/* ── Comments ────────────────────────────────────────────── */
let _commentPollInterval = null;

function startCommentPolling(postId, intervalMs = 30000) {
  if (_commentPollInterval) clearInterval(_commentPollInterval);
  _commentPollInterval = setInterval(() => refreshComments(postId), intervalMs);
}

async function refreshComments(postId) {
  try {
    const res = await CommentService.getPublishedByPost(postId);
    const fresh = Array.isArray(res) ? res : [];
    const list = document.getElementById('comment-list');
    if (!list) return;
    const user = Auth.getUser();
    const topLevel = fresh.filter(c => !c.parentId);
    if (fresh.length === 0) {
      list.innerHTML = `<div class="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên!</div>`;
    } else {
      list.innerHTML = topLevel.map(c => renderComment(c, fresh, user)).join('');
    }
    const countEl = document.querySelector('.comments-count');
    if (countEl) countEl.textContent = `💬 ${fresh.length} bình luận`;
  } catch (_) {}
}

async function loadComments(postId) {
  const wrap = document.getElementById('comments-section-wrap');
  let comments = [];
  try {
    const res = await CommentService.getPublishedByPost(postId);
    comments = Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('loadComments error:', err);
  }

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
          <a href="login.html" style="font-weight:600">Đăng nhập</a> để bình luận bài viết này.
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
  const user = Auth.getUser();
  const text = document.getElementById('new-comment-text')?.value.trim();
  if (!text) { UI.toast('Vui lòng nhập nội dung bình luận.', 'error'); return; }
  try {
    await CommentService.create({
      postId:  currentPost.id,
      userId:  user.id,
      content: text,
      title:   text.length > 60 ? text.substring(0, 60) + '...' : text,
    });
    UI.toast('Bình luận đã được đăng!', 'success');
    document.getElementById('new-comment-text').value = '';
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || 'Không thể gửi bình luận.', 'error');
  }
}

async function submitReply(parentId) {
  if (!Auth.requireLogin()) return;
  const user = Auth.getUser();
  const text = document.getElementById(`reply-text-${parentId}`)?.value.trim();
  if (!text) { UI.toast('Vui lòng nhập nội dung trả lời.', 'error'); return; }
  try {
    await CommentService.create({
      postId:   currentPost.id,
      userId:   user.id,
      parentId: parentId,
      content:  text,
      title:    text.length > 60 ? text.substring(0, 60) + '...' : text,
    });
    UI.toast('Trả lời đã được đăng!', 'success');
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
    // Người dùng thường không có quyền xóa — chỉ admin/moderator mới được
    UI.toast('Bạn không có quyền xóa bình luận này.', 'error');
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
    startCommentPolling(post.id);

    // Scroll đến comment khi vào từ link thông báo
    const targetHash = window.location.hash;
    if (targetHash && targetHash.startsWith('#comment-')) {
      const commentEl = document.querySelector(targetHash);
      if (commentEl) {
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentEl.classList.add('comment-highlight');
        setTimeout(() => commentEl.classList.remove('comment-highlight'), 3000);
      }
    }
  } catch (err) {
    document.getElementById('post-header-content').innerHTML =
      `<div class="empty-state"><h3>Không tìm thấy bài viết</h3><p>${err.message}</p></div>`;
    document.getElementById('post-content-wrap').innerHTML = '';
  }
}

init();
