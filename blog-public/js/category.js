/**
 * category.js — Logic trang bài viết theo danh mục
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

  if (!page.length) { UI.emptyState(grid, I18n.t('category.no_posts')); document.getElementById('pagination').innerHTML = ''; return; }
  grid.innerHTML = page.map(p => UI.postCard(p)).join('');

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  const paginEl = document.getElementById('pagination');
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }
  let btns = `<div class="pagination">`;
  btns += `<button onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>&#8592;</button>`;
  for (let i = 0; i < totalPages; i++) btns += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  btns += `<button onclick="goPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>&#8594;</button></div>`;
  paginEl.innerHTML = btns;
}

function goPage(n) { currentPage = n; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function init() {
  UI.renderNav();
  UI.renderCategoryWidget('sidebar-categories');
  UI.renderTagWidget('sidebar-tags');

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) { document.getElementById('page-title').textContent = I18n.t('category.invalid'); return; }

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, I18n.t('category.loading'));

  try {
    const [cat, posts] = await Promise.all([
      CategoryService.getBySlug(slug),
      PostService.getByCategory(slug),
    ]);
    document.getElementById('page-title').textContent = cat?.title || slug;
    if (cat?.content) document.getElementById('page-desc').textContent = cat.content;
    document.title = `${cat?.title || slug} - Blog`;
    if (cat?.imageUrl) {
      const heroImg = document.getElementById('page-hero-img');
      if (heroImg) { heroImg.src = cat.imageUrl; heroImg.alt = cat.title || slug; heroImg.style.display = 'block'; }
    }

    allPosts = Array.isArray(posts) ? posts : (posts?.content || []);
    renderPage();
  } catch (err) {
    UI.emptyState(grid, I18n.t('category.cannot_load'), err.message);
  }
}

init();
