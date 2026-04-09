/**
 * Comments Page Logic
 * Server-side pagination + sliding window.
 */

let allComments   = [];   // full list sau khi load (dùng cho filter)
let displayList   = [];   // list đang hiển thị (sau filter)
let totalElements = 0;
let totalPages    = 1;
let currentPage   = 0;
const PAGE_SIZE   = 10;
const WINDOW_SIZE = 3;

// ── Sliding window pagination ─────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('comments-pagination');
  if (!container) return;

  if (totalPages <= 1) { container.innerHTML = ''; return; }

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
        renderCommentPage();
      }
    });
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

function statusBadgeComment(status) {
  const map = { APPROVED: 'text-bg-success', PENDING: 'text-bg-warning text-dark', SPAM: 'text-bg-danger', REJECTED: 'text-bg-danger' };
  return `<span class="badge ${map[status] || 'text-bg-secondary'}">${status || '—'}</span>`;
}

function renderCommentPage() {
  const tbody     = document.getElementById('comments-tbody');
  const totalBadge = document.getElementById('comments-total-badge');
  if (totalBadge) totalBadge.textContent = `${totalElements} total`;

  totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  if (currentPage >= totalPages) currentPage = 0;

  const start = currentPage * PAGE_SIZE;
  const items = displayList.slice(start, start + PAGE_SIZE);

  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No comments found.</td></tr>';
    renderPagination();
    return;
  }

  tbody.innerHTML = items.map(c => {
    const isPending = c.status === 'PENDING';
    const isSpam    = c.status === 'SPAM' || c.status === 'REJECTED';
    const rowClass  = isPending ? 'table-warning' : isSpam ? 'table-danger' : '';
    const actions = isPending
      ? `<button class="btn btn-sm btn-success" onclick="approveComment(${c.id})" title="Approve"><i class="bi bi-check-lg"></i></button>
         <button class="btn btn-sm btn-outline-danger" onclick="rejectComment(${c.id})" title="Spam"><i class="bi bi-slash-circle"></i></button>
         <button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="Delete"><i class="bi bi-trash"></i></button>`
      : isSpam
      ? `<button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="Delete"><i class="bi bi-trash"></i></button>`
      : `<button class="btn btn-sm btn-outline-danger" onclick="rejectComment(${c.id})" title="Spam"><i class="bi bi-slash-circle"></i></button>
         <button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="Delete"><i class="bi bi-trash"></i></button>`;
    return `
      <tr class="${rowClass}">
        <td><input type="checkbox" class="form-check-input" /></td>
        <td><strong>${c.authorName || c.author?.username || 'Anonymous'}</strong><br><small class="text-muted">${c.authorEmail || ''}</small></td>
        <td class="col-wrap"><p class="mb-0 text-truncate">${c.content || '—'}</p></td>
        <td class="col-wrap"><a href="#">${c.postTitle || '—'}</a></td>
        <td>${statusBadgeComment(c.status)}</td>
        <td>${UI.formatDate(c.createdAt)}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');

  renderPagination();
}

function updateStats(list) {
  const total    = list.length;
  const pending  = list.filter(c => c.status === 'PENDING').length;
  const approved = list.filter(c => c.status === 'APPROVED').length;
  const spam     = list.filter(c => c.status === 'SPAM' || c.status === 'REJECTED').length;

  const nums = document.querySelectorAll('.info-box-number');
  if (nums[0]) nums[0].textContent = total;
  if (nums[1]) nums[1].textContent = pending;
  if (nums[2]) nums[2].textContent = approved;
  if (nums[3]) nums[3].textContent = spam;
}

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadAllComments() {
  try {
    const postsData = await PostService.getAll();
    const posts = Array.isArray(postsData) ? postsData : (postsData.content ?? []);
    const results = await Promise.allSettled(
      posts.map(p => CommentService.getByPost(p.id).then(cs => (cs || []).map(c => ({ ...c, postTitle: p.title, postId: p.id }))))
    );
    allComments   = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    totalElements = allComments.length;
    displayList   = allComments;
    currentPage   = 0;
    renderCommentPage();
    updateStats(allComments);
  } catch (err) { UI.toast('Failed to load comments: ' + err.message, 'danger'); }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function approveComment(id) {
  try {
    await CommentService.approve(id);
    UI.toast('Comment approved.');
    await loadAllComments();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function rejectComment(id) {
  try {
    await CommentService.reject(id);
    UI.toast('Comment rejected.');
    await loadAllComments();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function deleteComment(id) {
  if (!await UI.confirm('Delete this comment?')) return;
  try {
    await CommentService.delete(id);
    UI.toast('Comment deleted.');
    await loadAllComments();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

window.approveComment = approveComment;
window.rejectComment  = rejectComment;
window.deleteComment  = deleteComment;

// ── DOMContentLoaded ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Status filter
  const filterSelect = document.querySelector('select');
  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      const status = this.value.toUpperCase();
      displayList  = status ? allComments.filter(c => c.status === status) : allComments;
      totalElements = displayList.length;
      currentPage  = 0;
      renderCommentPage();
    });
  }

  // Refresh button
  document.getElementById('comments-refresh-btn')?.addEventListener('click', async () => {
    const searchInput = document.getElementById('comments-search');
    if (searchInput) searchInput.value = '';
    const filterSelect = document.querySelector('select');
    if (filterSelect) filterSelect.value = '';
    displayList = allComments;
    totalElements = allComments.length;
    currentPage = 0;
    await loadAllComments();
  });

  // Approve all pending
  const btnApproveAll = document.getElementById('btn-approve-all');
  if (btnApproveAll) {
    btnApproveAll.addEventListener('click', async function () {
      const pending = allComments.filter(c => c.status === 'PENDING');
      if (!pending.length) { UI.toast('No pending comments.', 'info'); return; }
      await Promise.allSettled(pending.map(c => CommentService.approve(c.id)));
      UI.toast(`Approved ${pending.length} comments.`);
      await loadAllComments();
    });
  }

  await loadAllComments();
  await UI.renderCurrentUser();
});
