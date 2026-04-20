/**
 * search.js — Logic trang tìm kiếm
 */

const PAGE_SIZE = 9;
let allResults = [];
let currentPage = 0;
let currentKeyword = '';

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `search.html?q=${encodeURIComponent(kw)}`;
}

function handleSearchForm(e) {
  e.preventDefault();
  const kw = document.getElementById('search-input').value.trim();
  if (!kw) return;
  window.history.replaceState({}, '', `search.html?q=${encodeURIComponent(kw)}`);
  doSearch(kw);
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

function renderPage() {
  const grid = document.getElementById('posts-grid');
  const countEl = document.getElementById('result-count');
  const start = currentPage * PAGE_SIZE;
  const page = allResults.slice(start, start + PAGE_SIZE);

  countEl.textContent = allResults.length
    ? I18n.t('search.results_found', { n: allResults.length, keyword: currentKeyword })
    : I18n.t('search.no_results', { keyword: currentKeyword });

  if (!page.length) { UI.emptyState(grid, I18n.t('search.no_posts'), I18n.t('search.try_other')); document.getElementById('pagination').innerHTML = ''; return; }
  grid.innerHTML = page.map(p => UI.postCard(p)).join('');

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE);
  const paginEl = document.getElementById('pagination');
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }
  let btns = `<div class="pagination">`;
  btns += `<button onclick="goPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>&#8592;</button>`;
  for (let i = 0; i < totalPages; i++) btns += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  btns += `<button onclick="goPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>&#8594;</button></div>`;
  paginEl.innerHTML = btns;
}

function goPage(n) { currentPage = n; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function doSearch(keyword) {
  currentKeyword = keyword;
  currentPage = 0;
  document.getElementById('page-title').textContent = I18n.t('search.result_for', { keyword });
  document.title = I18n.t('search.page_title', { keyword });
  document.getElementById('search-input').value = keyword;
  document.getElementById('nav-search-input').value = keyword;

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, I18n.t('search.searching'));
  document.getElementById('result-count').textContent = '';

  try {
    const res = await PostService.search(keyword);
    allResults = Array.isArray(res) ? res : (res?.content || []);
    renderPage();
  } catch (err) {
    UI.emptyState(grid, I18n.t('search.load_error'), err.message);
  }
}

async function init() {
  UI.renderNav();
  UI.renderCategoryWidget('sidebar-categories');
  UI.renderTagWidget('sidebar-tags');

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    doSearch(q);
  } else {
    document.getElementById('result-count').textContent = I18n.t('search.enter_keyword');
    UI.emptyState(document.getElementById('posts-grid'), I18n.t('search.search_posts'), I18n.t('search.search_hint'));
  }
}

init();
