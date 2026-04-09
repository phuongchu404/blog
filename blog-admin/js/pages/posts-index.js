/**
 * Posts Index Page Logic
 * Server-side pagination + sliding window.
 */

let totalElements = 0;
let totalPages    = 1;
let currentPage   = 0;   // 0-based
const PAGE_SIZE   = 10;
const WINDOW_SIZE = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('posts-pagination');
  if (!container) return;

  let html = `<ul class="pagination pagination-sm m-0 float-end">`;

  html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
  </li>`;

  const windowStart = Math.max(0, currentPage - Math.floor(WINDOW_SIZE / 2));
  const windowEnd   = Math.min(totalPages - 1, windowStart + WINDOW_SIZE - 1);
  const adjStart    = Math.max(0, windowEnd - WINDOW_SIZE + 1);

  if (adjStart > 0) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="0">1</a></li>`;
    if (adjStart > 1) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
  }

  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }

  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
  </li></ul>`;

  container.innerHTML = html;
  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadPosts();
      }
    });
  });
}

function renderPosts(items) {
  const tbody   = document.getElementById('posts-tbody');
  const countEl = document.getElementById('posts-total');
  if (countEl) countEl.textContent = `${totalElements} total`;

  if (!items.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No posts found.</td></tr>';
    renderPagination();
    return;
  }

  const offset = currentPage * PAGE_SIZE;
  if (tbody) {
    tbody.innerHTML = items.map((p, i) => `
      <tr>
        <td><input type="checkbox" class="form-check-input" /></td>
        <td>${offset + i + 1}</td>
        <td class="col-wrap"><a href="create.html?id=${p.id}">${p.title || '—'}</a></td>
        <td>${p.authorName || p.author?.username || '—'}</td>
        <td><span class="badge text-bg-info">${p.categoryName || '—'}</span></td>
        <td>${UI.statusBadge(p.status)}</td>
        <td>${p.viewCount ?? 0}</td>
        <td>${UI.formatDate(p.createdAt)}</td>
        <td>
          <a href="create.html?id=${p.id}" class="btn btn-sm btn-warning" title="Edit"><i class="bi bi-pencil"></i></a>
          <button class="btn btn-sm btn-danger" title="Delete" onclick="deletePost(${p.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  renderPagination();
}

// ── Load dữ liệu từ server ─────────────────────────────────────────────────────

let _currentFilter = {};   // lưu filter hiện tại để dùng khi đổi trang

async function loadPosts() {
  try {
    const params = { page: currentPage, size: PAGE_SIZE, ..._currentFilter };
    const data   = await PostService.getAll(params);

    if (isPageResponse(data)) {
      totalElements = data.totalElements;
      totalPages    = Math.max(1, data.totalPages);
      renderPosts(data.content);
    } else {
      const list     = Array.isArray(data) ? data : [];
      const filtered = applyClientFilter(list);
      totalElements  = filtered.length;
      totalPages     = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentPage >= totalPages) currentPage = 0;
      renderPosts(filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE));
    }
  } catch (err) {
    UI.toast('Failed to load posts: ' + err.message, 'danger');
  }
}

function applyClientFilter(list) {
  const keyword = (_currentFilter.keyword || '').toLowerCase();
  const status  = _currentFilter.status || '';
  return list.filter(p =>
    (!keyword || (p.title || '').toLowerCase().includes(keyword)) &&
    (!status  || p.status === status)
  );
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

async function deletePost(id) {
  if (!await UI.confirm('Delete this post? This action cannot be undone.')) return;
  try {
    await PostService.delete(id);
    UI.toast('Post deleted successfully.');
    await loadPosts();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

window.deletePost = deletePost;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  const searchInput  = document.getElementById('posts-search');
  const searchBtn    = document.getElementById('posts-search-btn');
  const statusFilter = document.getElementById('posts-status-filter');

  function applyFilter() {
    _currentFilter = {
      keyword: searchInput?.value.trim() || '',
      status:  statusFilter?.value || '',
    };
    currentPage = 0;
    loadPosts();
  }

  if (searchBtn)    searchBtn.addEventListener('click', applyFilter);
  if (searchInput)  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);

  await loadPosts();
  await UI.renderCurrentUser();
});
