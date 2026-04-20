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
  const authorName = post.author?.fullName || post.author?.username || UI._t('ui.anonymous');
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
          ${post.viewCount != null ? `<span>· 👁 ${UI._t('post.view_count').replace('{n}', post.viewCount)}</span>` : ''}
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
      <span class="toc-title">${UI._t('post.toc_title')}</span>
      <button class="toc-toggle" onclick="this.closest('.post-toc-sidebar').classList.toggle('collapsed')" title="${UI._t('post.toc_toggle')}">☰</button>
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
    actionHtml = `<a href="login.html" class="btn btn-primary membership-gate-btn">${UI._t('post.gate_btn_login')}</a>`;
  } else if (status === 2) {
    actionHtml = `<span class="membership-gate-pending">${UI._t('post.gate_btn_pending')}</span>`;
  } else {
    actionHtml = `<a href="membership.html" class="btn btn-primary membership-gate-btn">${UI._t('post.gate_btn_register')}</a>`;
  }

  const desc = !isLoggedIn
    ? UI._t('post.gate_desc_login')
    : status === 2
      ? UI._t('post.gate_desc_pending')
      : UI._t('post.gate_desc_none');

  return `
    <div class="membership-gate">
      <div class="membership-gate-icon">🔒</div>
      <h3 class="membership-gate-title">${UI._t('post.gate_title')}</h3>
      <p class="membership-gate-desc">${desc}</p>
      ${actionHtml}
    </div>`;
}

/* ── Render post content ─────────────────────────────────── */
function renderPostContent(post) {
  const tags = (post.tags || []).map(t =>
    `<a href="tag.html?slug=${t.slug}" class="tag-chip tag">${t.title}</a>`
  ).join('');

  const bodyHtml = post.content || `<p style="color:var(--text-muted)">${UI._t('post.no_content')}</p>`;

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
      list.innerHTML = `<div class="no-comments">${UI._t('comments.empty')}</div>`;
    } else {
      list.innerHTML = topLevel.map(c => renderComment(c, fresh, user)).join('');
    }
    const countEl = document.querySelector('.comments-count');
    if (countEl) countEl.textContent = UI._t('comments.title').replace('{n}', fresh.length);
  } catch (_) { }
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
      <h3 class="comments-count">${UI._t('comments.title').replace('{n}', comments.length)}</h3>

      ${isLoggedIn ? `
        <div class="comment-form" style="margin-bottom:2rem">
          <textarea id="new-comment-text" placeholder="${UI._t('comments.placeholder')}"></textarea>
          <div class="comment-form-footer">
            <button class="btn btn-primary btn-sm" onclick="submitComment()">${UI._t('comments.btn_submit')}</button>
          </div>
        </div>` : `
        <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:1rem 1.25rem;margin-bottom:2rem;font-size:.9rem;color:var(--primary)">
          <a href="login.html" style="font-weight:600">${UI._t('nav.login')}</a> ${UI._t('comments.login_to_comment')}
        </div>`}

      <div class="comment-list" id="comment-list">
        ${comments.length === 0
      ? `<div class="no-comments">${UI._t('comments.empty')}</div>`
      : comments.filter(c => !c.parentId).map(c => renderComment(c, comments, user)).join('')}
      </div>
    </div>`;
}

function renderComment(comment, allComments, currentUser) {
  const authorName = comment.user?.fullName || comment.user?.username || UI._t('ui.user');
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
      ? `<button onclick="showReplyForm(${comment.id})">${UI._t('comments.reply_btn')}</button>`
      : ''}
        ${isOwner
      ? `<button onclick="deleteComment(${comment.id})" style="color:var(--danger)">${UI._t('comments.delete_btn')}</button>`
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
      <textarea id="reply-text-${parentId}" placeholder="${UI._t('comments.reply_placeholder')}"></textarea>
      <div class="reply-form-footer">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('reply-form-${parentId}').innerHTML=''">${UI._t('comments.cancel')}</button>
        <button class="btn btn-primary btn-sm" onclick="submitReply(${parentId})">${UI._t('comments.send')}</button>
      </div>
    </div>`;
}

async function submitComment() {
  if (!Auth.requireLogin()) return;
  const user = Auth.getUser();
  const text = document.getElementById('new-comment-text')?.value.trim();
  if (!text) { UI.toast(UI._t('comments.enter_comment'), 'error'); return; }
  try {
    await CommentService.create({
      postId: currentPost.id,
      userId: user.id,
      content: text,
      title: text.length > 60 ? text.substring(0, 60) + '...' : text,
    });
    UI.toast(UI._t('comments.posted'), 'success');
    document.getElementById('new-comment-text').value = '';
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || UI._t('comments.send_failed'), 'error');
  }
}

async function submitReply(parentId) {
  if (!Auth.requireLogin()) return;
  const user = Auth.getUser();
  const text = document.getElementById(`reply-text-${parentId}`)?.value.trim();
  if (!text) { UI.toast(UI._t('comments.enter_reply'), 'error'); return; }
  try {
    await CommentService.create({
      postId: currentPost.id,
      userId: user.id,
      parentId: parentId,
      content: text,
      title: text.length > 60 ? text.substring(0, 60) + '...' : text,
    });
    UI.toast(UI._t('comments.reply_posted'), 'success');
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(err.message || UI._t('comments.reply_failed'), 'error');
  }
}

async function deleteComment(id) {
  if (!confirm(UI._t('comments.delete_confirm'))) return;
  try {
    await CommentService.delete(id);
    UI.toast(UI._t('comments.deleted'), 'success');
    await loadComments(currentPost.id);
  } catch (err) {
    UI.toast(UI._t('comments.delete_forbidden'), 'error');
  }
}

/* ── Init ─────────────────────────────────────────────────── */
async function init() {
  UI.renderNav();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const id = params.get('id');

  if (!slug && !id) {
    document.getElementById('post-header-content').innerHTML =
      `<div class="empty-state"><h3>${UI._t('post.not_found_title')}</h3><p>${UI._t('post.not_found_desc')}</p></div>`;
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
      `<div class="empty-state"><h3>${UI._t('post.not_found_title')}</h3><p>${err.message}</p></div>`;
    document.getElementById('post-content-wrap').innerHTML = '';
  }
}

init();
