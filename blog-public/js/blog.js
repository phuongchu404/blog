/**
 * blog.js — Logic trang danh sách bài viết
 */

const PAGE_SIZE = 9;
let currentPosts = [];
let currentPage = 0;
let sortOrder = 'newest';
let totalPosts = 0;
let totalPages = 0;

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

function handleSort() {
  sortOrder = document.getElementById('sort-select').value;
  currentPage = 0;
  loadPage();
}

function getQueryParams() {
  return {
    page: currentPage,
    size: PAGE_SIZE,
    sort: sortOrder,
  };
}

function renderPage() {
  const grid = document.getElementById('posts-grid');
  const countEl = document.getElementById('post-count');
  const paginEl = document.getElementById('pagination');
  const visibleTotalPages = Math.max(totalPages, 1);

  countEl.textContent = I18n.t('blog_dyn.posts_count', { n: totalPosts });

  if (!currentPosts.length) {
    UI.emptyState(grid, I18n.t('blog_dyn.no_posts'));
    paginEl.innerHTML = '';
    return;
  }

  grid.innerHTML = currentPosts.map(p => UI.postCard(p)).join('');

  // Pagination
  let btns = `<div class="pagination">`;
  btns += `<button onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>&#8592;</button>`;
  for (let i = 0; i < visibleTotalPages; i++) {
    btns += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  }
  btns += `<button onclick="goPage(${currentPage + 1})" ${currentPage === visibleTotalPages - 1 ? 'disabled' : ''}>&#8594;</button>`;
  btns += `</div>`;
  paginEl.innerHTML = btns;
}

function goPage(n) {
  if (n < 0 || n >= totalPages) return;
  currentPage = n;
  loadPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadPage() {
  const grid = document.getElementById('posts-grid');
  UI.loading(grid, I18n.t('blog_dyn.loading'));

  try {
    const res = await PostService.getPublished(getQueryParams());
    currentPosts = Array.isArray(res) ? res : (res?.content || []);
    totalPosts = Array.isArray(res) ? currentPosts.length : (res?.totalElements ?? currentPosts.length);
    totalPages = Array.isArray(res) ? Math.ceil(totalPosts / PAGE_SIZE) : (res?.totalPages ?? 0);
    renderPage();
  } catch (err) {
    UI.emptyState(grid, I18n.t('blog_dyn.cannot_load'), I18n.t('blog_dyn.try_again'));
  }
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

async function init() {
  UI.renderNav();
  UI.setActiveNav();
  UI.renderCategoryWidget('sidebar-categories');
  UI.renderRecentWidget('sidebar-recent');
  UI.renderTagWidget('sidebar-tags');

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, I18n.t('blog_dyn.loading'));

  await loadPage();
}

init();
