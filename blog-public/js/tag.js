/**
 * tag.js — Logic trang bài viết theo tag
 */

const PAGE_SIZE = 9;
let allPosts = [];
let currentPage = 0;

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

function renderPage() {
  const grid = document.getElementById('posts-grid');
  const start = currentPage * PAGE_SIZE;
  const page = allPosts.slice(start, start + PAGE_SIZE);

  if (!page.length) { UI.emptyState(grid, 'Chưa có bài viết nào với tag này'); document.getElementById('pagination').innerHTML = ''; return; }
  grid.innerHTML = page.map(p => UI.postCard(p)).join('');

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  const paginEl = document.getElementById('pagination');
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }
  let btns = `<div class="pagination">`;
  btns += `<button onclick="goPage(${currentPage-1})" ${currentPage===0?'disabled':''}>&#8592;</button>`;
  for (let i = 0; i < totalPages; i++) btns += `<button class="${i===currentPage?'active':''}" onclick="goPage(${i})">${i+1}</button>`;
  btns += `<button onclick="goPage(${currentPage+1})" ${currentPage===totalPages-1?'disabled':''}>&#8594;</button></div>`;
  paginEl.innerHTML = btns;
}

function goPage(n) { currentPage = n; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function init() {
  UI.renderNav();
  UI.renderCategoryWidget('sidebar-categories');
  UI.renderTagWidget('sidebar-tags');

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) { document.getElementById('page-title').textContent = 'Tag không hợp lệ'; return; }

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, 'Đang tải...');

  try {
    const [tag, posts] = await Promise.all([
      TagService.getBySlug(slug),
      PostService.getByTag(slug),
    ]);
    document.getElementById('page-title').textContent = `#${tag?.title || slug}`;
    if (tag?.content) document.getElementById('page-desc').textContent = tag.content;
    document.title = `#${tag?.title || slug} - Blog`;

    allPosts = Array.isArray(posts) ? posts : (posts?.content || []);
    renderPage();
  } catch (err) {
    UI.emptyState(grid, 'Không thể tải bài viết', err.message);
  }
}

init();
