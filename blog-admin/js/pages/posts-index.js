/**
 * Posts Index Page Logic
 */

let allPosts = [];

function renderPosts(list) {
  const tbody = document.getElementById('posts-tbody');
  const countEl = document.getElementById('posts-total');
  if (countEl) countEl.textContent = list.length + ' total';
  
  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No posts found.</td></tr>';
    return;
  }
  
  if (tbody) {
    tbody.innerHTML = list.map((p, i) => `
      <tr>
        <td><input type="checkbox" class="form-check-input" /></td>
        <td>${i + 1}</td>
        <td><a href="create.html?id=${p.id}">${p.title || '—'}</a></td>
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
}

function applyFilter() {
  const keyword = document.getElementById('posts-search').value.toLowerCase();
  const status  = document.getElementById('posts-status-filter').value;
  const filtered = allPosts.filter(p =>
    (!keyword || (p.title || '').toLowerCase().includes(keyword)) &&
    (!status  || p.status === status)
  );
  renderPosts(filtered);
}

async function deletePost(id) {
  if (!await UI.confirm('Delete this post? This action cannot be undone.')) return;
  try {
    await PostService.delete(id);
    UI.toast('Post deleted successfully.');
    allPosts = allPosts.filter(p => p.id !== id);
    applyFilter();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

// Gán các hàm vào window để gọi được từ HTML (onclick)
window.deletePost = deletePost;

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  const tbody = document.getElementById('posts-tbody');
  if (tbody) UI.loading(tbody, true);
  
  try {
    const data = await PostService.getAll();
    allPosts = Array.isArray(data) ? data : (data.content ?? []);
    renderPosts(allPosts);
  } catch (err) {
    UI.toast('Failed to load posts: ' + err.message, 'danger');
  }

  // Search
  const searchBtn = document.getElementById('posts-search-btn');
  const searchInput = document.getElementById('posts-search');
  const statusFilter = document.getElementById('posts-status-filter');

  if (searchBtn) searchBtn.addEventListener('click', applyFilter);
  if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);

  await UI.renderCurrentUser();
});
