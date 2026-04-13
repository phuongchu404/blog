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

/* ── Mobile nav toggle ───────────────────────────────────── */
document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

/* ── 1. Categories list (sidebar) ────────────────────────── */
async function renderCategoriesPills() {
  const el = document.getElementById('categories-pills');
  if (!el) return;
  try {
    const cats  = await CategoryService.getAll();
    const roots = (cats || []).filter(c => !c.parentId);
    if (!roots.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem">Chưa có thể loại nào.</p>'; return; }
    el.innerHTML = roots.map(c => `
      <a href="category.html?slug=${c.slug}" class="cat-pill">
        <span>${c.title}</span>
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </a>`).join('');
  } catch (_) {
    el.innerHTML = '';
  }
}

/* ── 2. Tags section ─────────────────────────────────────── */
async function renderTagsSection() {
  const el = document.getElementById('home-tags');
  if (!el) return;
  try {
    const tags = await TagService.getAll();
    if (!tags?.length) { el.innerHTML = ''; return; }
    el.innerHTML = tags.map(t =>
      `<a href="tag.html?slug=${t.slug}" class="home-tag-chip">${t.title}</a>`
    ).join('');
  } catch (_) { el.innerHTML = ''; }
}

/* ── 3. Bài viết nổi bật (3 bài) ────────────────────────── */
function renderFeaturedPosts(posts) {
  const el = document.getElementById('featured-posts');
  if (!el) return;
  if (!posts.length) { UI.emptyState(el, 'Chưa có bài viết nổi bật'); return; }
  el.innerHTML = posts.map(p => UI.featuredCard(p)).join('');
}

/* ── 3. Bài viết mới nhất ────────────────────────────────── */
function renderRecentPosts(posts) {
  const el = document.getElementById('recent-posts');
  if (!el) return;
  if (!posts.length) { UI.emptyState(el, 'Chưa có bài viết nào', 'Hãy quay lại sau nhé!'); return; }
  el.innerHTML = posts.map(p => UI.postCard(p)).join('');
}

/* ── Init ────────────────────────────────────────────────── */
async function init() {
  UI.renderNav();
  UI.setActiveNav();

  // Section 1: Categories & Tags
  renderCategoriesPills();
  renderTagsSection();

  // Section 2 & 3: Posts
  const featuredEl = document.getElementById('featured-posts');
  const recentEl   = document.getElementById('recent-posts');
  UI.loading(featuredEl, 'Đang tải...');
  UI.loading(recentEl,   'Đang tải bài viết...');

  try {
    const posts = await PostService.getPublished();
    const list  = Array.isArray(posts) ? posts : (posts?.content || []);

    if (list.length > 0) {
      // 3 bài đầu → nổi bật, 3 bài tiếp → mới nhất
      renderFeaturedPosts(list.slice(0, 3));
      renderRecentPosts(list.slice(3, 6));
    } else {
      UI.emptyState(featuredEl, 'Chưa có bài viết nào');
      UI.emptyState(recentEl,   'Chưa có bài viết nào');
    }
  } catch (err) {
    console.error(err);
    UI.emptyState(featuredEl, 'Không thể tải bài viết', 'Vui lòng kiểm tra kết nối.');
    UI.emptyState(recentEl,   'Không thể tải bài viết', 'Vui lòng kiểm tra kết nối.');
  }
}

init();
