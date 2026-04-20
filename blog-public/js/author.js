/**
 * author.js — Logic trang bài viết theo tác giả
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

  if (!page.length) { UI.emptyState(grid, I18n.t('author.no_posts')); document.getElementById('pagination').innerHTML = ''; return; }
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
  const authorId = params.get('id');
  if (!authorId) { document.getElementById('author-header').innerHTML = `<h1 style="color:white">${I18n.t('author.invalid')}</h1>`; return; }

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, I18n.t('author.loading'));

  try {
    const posts = await PostService.getByAuthor(authorId);
    allPosts = Array.isArray(posts) ? posts : (posts?.content || []);

    // Lấy thông tin tác giả: ưu tiên từ bài viết, fallback gọi API
    let authorInfo = allPosts[0]?.author || null;
    if (!authorInfo || (!authorInfo.fullName && !authorInfo.username)) {
      try {
        authorInfo = await UserService.getById(authorId);
      } catch (_) {
        authorInfo = { id: authorId };
      }
    }

    const authorName = authorInfo?.fullName || authorInfo?.username || `Tác giả #${authorId}`;
    const authorAvatar = UI.avatarUrl(authorInfo);
    const authorIntro = authorInfo?.intro || '';

    document.getElementById('author-header').innerHTML = `
      <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap">
        <img src="${authorAvatar}" alt="${authorName}"
             style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.3)"
             onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
        <div>
          <h1 style="color:white;margin-bottom:.25rem">${authorName}</h1>
          ${authorIntro ? `<p style="opacity:.8;font-size:.9rem;margin-bottom:.25rem">${authorIntro}</p>` : ''}
          <p style="opacity:.7;font-size:.95rem">${I18n.t('author.post_count', { n: allPosts.length })}</p>
        </div>
      </div>`;
    document.title = `${authorName} - Blog`;

    renderPage();
  } catch (err) {
    UI.emptyState(grid, I18n.t('author.cannot_load'), err.message);
  }
}

init();
