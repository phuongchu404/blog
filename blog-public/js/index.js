/**
 * index.js — Logic trang chủ
 * Phụ thuộc: http.js, auth.js, ui.js, post.service.js, category.service.js, tag.service.js
 */

/* ── Search handlers ─────────────────────────────────────── */
function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

function handleHeroSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('hero-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

/* ── Featured post ───────────────────────────────────────── */
function renderFeatured(post) {
  const el = document.getElementById('featured-post');
  if (!el) return;
  const authorName = post.author?.fullName || post.author?.username || 'Ẩn danh';
  const authorAvatar = UI.avatarUrl(post.author);
  const categories = (post.categories || []).map(c =>
    `<a href="category.html?slug=${c.slug}" class="tag-chip">${c.title}</a>`
  ).join('');

  const thumbUrl = post.imageUrl || post.thumbnailUrl;
  el.innerHTML = `
    <article class="featured-post">
      <a href="post.html?slug=${post.slug}" class="featured-post-thumb">
        ${thumbUrl
          ? `<img src="${thumbUrl}" alt="${post.title}" loading="eager">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--primary-light),#dbeafe);display:flex;align-items:center;justify-content:center;font-size:4rem">📝</div>`
        }
      </a>
      <div class="featured-post-body">
        <div class="featured-label">⭐ Nổi bật</div>
        ${categories ? `<div class="post-card-cats">${categories}</div>` : ''}
        <h2 class="post-card-title">
          <a href="post.html?slug=${post.slug}">${post.title}</a>
        </h2>
        ${post.summary ? `<p class="post-card-excerpt">${post.summary}</p>` : ''}
        <div class="post-card-meta">
          <img class="avatar-xs" src="${authorAvatar}" alt="${authorName}" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
          <span>${authorName}</span>
          <span>·</span>
          <span>${UI.formatDate(post.publishedAt || post.createdAt)}</span>
        </div>
        <a href="post.html?slug=${post.slug}" class="btn btn-primary btn-sm" style="margin-top:.5rem;align-self:flex-start">Đọc bài →</a>
      </div>
    </article>`;
}

/* ── Recent posts ────────────────────────────────────────── */
function renderRecentPosts(posts) {
  const el = document.getElementById('recent-posts');
  if (!el) return;
  if (!posts.length) {
    UI.emptyState(el, 'Chưa có bài viết nào', 'Hãy quay lại sau nhé!');
    return;
  }
  el.innerHTML = posts.map(p => UI.postCard(p)).join('');
}

/* ── Mobile nav toggle ───────────────────────────────────── */
document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

/* ── Init ────────────────────────────────────────────────── */
async function init() {
  UI.renderNav();
  UI.setActiveNav();

  // Load sidebar widgets
  UI.renderCategoryWidget('sidebar-categories');
  UI.renderRecentWidget('sidebar-recent');
  UI.renderTagWidget('sidebar-tags');

  // Load posts
  const featuredEl = document.getElementById('featured-post');
  const recentEl = document.getElementById('recent-posts');
  UI.loading(recentEl, 'Đang tải bài viết...');

  try {
    const posts = await PostService.getPublished();
    const list = Array.isArray(posts) ? posts : (posts?.content || []);

    if (list.length > 0) {
      renderFeatured(list[0]);
      renderRecentPosts(list.slice(1, 7));
    } else {
      featuredEl.innerHTML = '';
      UI.emptyState(recentEl, 'Chưa có bài viết nào');
    }
  } catch (err) {
    console.error(err);
    UI.emptyState(recentEl, 'Không thể tải bài viết', 'Vui lòng kiểm tra kết nối và thử lại.');
  }
}

init();
