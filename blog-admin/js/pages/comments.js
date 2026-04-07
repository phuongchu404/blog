/**
 * Comments Page Logic
 */

let allComments = [];

async function loadAllComments() {
  try {
    const postsData = await PostService.getAll();
    const posts = Array.isArray(postsData) ? postsData : (postsData.content ?? []);
    const results = await Promise.allSettled(
      posts.map(p => CommentService.getByPost(p.id).then(cs => (cs || []).map(c => ({ ...c, postTitle: p.title, postId: p.id }))))
    );
    allComments = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    renderComments(allComments);
    updateStats(allComments);
  } catch (err) { UI.toast('Failed to load comments: ' + err.message, 'danger'); }
}

function updateStats(list) {
  const total   = list.length;
  const pending  = list.filter(c => c.status === 'PENDING').length;
  const approved = list.filter(c => c.status === 'APPROVED').length;
  const spam     = list.filter(c => c.status === 'SPAM' || c.status === 'REJECTED').length;
  
  const nums = document.querySelectorAll('.info-box-number');
  if (nums[0]) nums[0].textContent = total;
  if (nums[1]) nums[1].textContent = pending;
  if (nums[2]) nums[2].textContent = approved;
  if (nums[3]) nums[3].textContent = spam;
  
  const totalBadge = document.querySelector('.card-tools .badge');
  if (totalBadge) totalBadge.textContent = total + ' total';
}

function statusBadgeComment(status) {
  const map = { APPROVED: 'text-bg-success', PENDING: 'text-bg-warning text-dark', SPAM: 'text-bg-danger', REJECTED: 'text-bg-danger' };
  return `<span class="badge ${map[status] || 'text-bg-secondary'}">${status || '—'}</span>`;
}

function renderComments(list) {
  const tbody = document.getElementById('comments-tbody');
  if (!tbody) return;
  
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No comments found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = list.map(c => {
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
        <td style="max-width:280px"><p class="mb-0 text-truncate">${c.content || '—'}</p></td>
        <td><a href="#">${c.postTitle || '—'}</a></td>
        <td>${statusBadgeComment(c.status)}</td>
        <td>${UI.formatDate(c.createdAt)}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');
}

async function approveComment(id) {
  try { 
    await CommentService.approve(id); 
    UI.toast('Comment approved.'); 
    loadAllComments(); 
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function rejectComment(id) {
  try { 
    await CommentService.reject(id); 
    UI.toast('Comment rejected.'); 
    loadAllComments(); 
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function deleteComment(id) {
  if (!UI.confirm('Delete this comment?')) return;
  try { 
    await CommentService.delete(id); 
    UI.toast('Comment deleted.'); 
    loadAllComments(); 
  } catch (err) { UI.toast(err.message, 'danger'); }
}

// Gán window
window.approveComment = approveComment;
window.rejectComment = rejectComment;
window.deleteComment = deleteComment;

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // Status filter
  const filterSelect = document.querySelector('select');
  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      const status = this.value.toUpperCase();
      renderComments(status ? allComments.filter(c => c.status === status) : allComments);
    });
  }

  // Approve all pending
  const btnApproveAll = document.querySelector('.btn-success');
  if (btnApproveAll) {
    btnApproveAll.addEventListener('click', async function () {
      const pending = allComments.filter(c => c.status === 'PENDING');
      if (!pending.length) { UI.toast('No pending comments.', 'info'); return; }
      await Promise.allSettled(pending.map(c => CommentService.approve(c.id)));
      UI.toast(`Approved ${pending.length} comments.`);
      loadAllComments();
    });
  }

  await loadAllComments();
  await UI.renderCurrentUser();
});
