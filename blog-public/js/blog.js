/**
 * blog.js — Logic trang danh sách bài viết
 */

const PAGE_SIZE = 9;
let allPosts = [];
let currentPage = 0;
let sortOrder = 'newest';

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `/blog-public/search.html?q=${encodeURIComponent(kw)}`;
}

function handleSort() {
  sortOrder = document.getElementById('sort-select').value;
  currentPage = 0;
  renderPage();
}

function getSorted() {
  return [...allPosts].sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt);
    const db = new Date(b.publishedAt || b.createdAt);
    return sortOrder === 'newest' ? db - da : da - db;
  });
}

function renderPage() {
  const grid = document.getElementById('posts-grid');
  const countEl = document.getElementById('post-count');
  const sorted = getSorted();
  const total = sorted.length;
  const start = currentPage * PAGE_SIZE;
  const page = sorted.slice(start, start + PAGE_SIZE);

  countEl.textContent = `${total} bài viết`;

  if (!page.length) {
    UI.emptyState(grid, 'Chưa có bài viết nào');
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = page.map(p => UI.postCard(p)).join('');

  // Pagination
  const paginEl = document.getElementById('pagination');
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }

  let btns = `<div class="pagination">`;
  btns += `<button onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>&#8592;</button>`;
  for (let i = 0; i < totalPages; i++) {
    btns += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  }
  btns += `<button onclick="goPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>&#8594;</button>`;
  btns += `</div>`;
  paginEl.innerHTML = btns;
}

function goPage(n) {
  currentPage = n;
  renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  UI.loading(grid, 'Đang tải bài viết...');

  try {
    const res = await PostService.getPublished();
    allPosts = Array.isArray(res) ? res : (res?.content || []);
    renderPage();
  } catch (err) {
    UI.emptyState(grid, 'Không thể tải bài viết', 'Vui lòng thử lại sau.');
  }
}

init();
