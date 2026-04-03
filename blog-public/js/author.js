/**
 * author.js — Logic trang bài viết theo tác giả
 */

const PAGE_SIZE = 9;
let allPosts = [];
let currentPage = 0;

function handleNavSearch(e) {
  e.preventDefault();
  const kw = document.getElementById('nav-search-input').value.trim();
  if (kw) window.location.href = `/blog-public/search.html?q=${encodeURIComponent(kw)}`;
}

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

function renderPage() {
  const grid = document.getElementById('posts-grid');
  const start = currentPage * PAGE_SIZE;
  const page = allPosts.slice(start, start + PAGE_SIZE);

  if (!page.length) { UI.emptyState(grid, 'Tác giả chưa có bài viết nào'); document.getElementById('pagination').innerHTML = ''; return; }
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
  const authorId = params.get('id');
  if (!authorId) { document.getElementById('author-header').innerHTML = '<h1 style="color:white">Tác giả không hợp lệ</h1>'; return; }

  const grid = document.getElementById('posts-grid');
  UI.loading(grid, 'Đang tải...');

  try {
    const posts = await PostService.getByAuthor(authorId);
    allPosts = Array.isArray(posts) ? posts : (posts?.content || []);

    // Lấy thông tin tác giả từ bài viết đầu tiên
    const author = allPosts[0]?.author;
    const authorName = author?.fullName || author?.username || `Tác giả #${authorId}`;
    const authorAvatar = UI.avatarUrl(author);

    document.getElementById('author-header').innerHTML = `
      <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap">
        <img src="${authorAvatar}" alt="${authorName}"
             style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.3)"
             onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
        <div>
          <h1 style="color:white;margin-bottom:.25rem">${authorName}</h1>
          <p style="opacity:.7;font-size:.95rem">${allPosts.length} bài viết</p>
        </div>
      </div>`;
    document.title = `${authorName} - Blog`;

    renderPage();
  } catch (err) {
    UI.emptyState(grid, 'Không thể tải bài viết', err.message);
  }
}

init();
