/**
 * Comments page logic.
 * Client-side pagination over the loaded list.
 */

let allComments = [];
let displayList = [];
let totalElements = 0;
let totalPages = 1;
let currentPage = 0;
const PAGE_SIZE = 10;
const WINDOW_SIZE = 3;

function renderPagination() {
  const container = document.getElementById('comments-pagination');
  if (!container) return;

  let html = '<ul class="pagination pagination-sm m-0 float-end">';

  html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>
  </li>`;

  const windowStart = Math.max(0, currentPage - Math.floor(WINDOW_SIZE / 2));
  const windowEnd = Math.min(totalPages - 1, windowStart + WINDOW_SIZE - 1);
  const adjStart = Math.max(0, windowEnd - WINDOW_SIZE + 1);

  if (adjStart > 0) {
    html += '<li class="page-item"><a class="page-link" href="#" data-page="0">1</a></li>';
    if (adjStart > 1) html += '<li class="page-item disabled"><a class="page-link" href="#">&hellip;</a></li>';
  }

  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }

  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) html += '<li class="page-item disabled"><a class="page-link" href="#">&hellip;</a></li>';
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>
  </li></ul>`;

  container.innerHTML = html;
  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page, 10);
      if (page >= 0 && page < totalPages) {
        currentPage = page;
        renderCommentPage();
      }
    });
  });
}

function statusBadgeComment(status) {
  const map = {
    APPROVED: 'text-bg-success',
    PENDING: 'text-bg-warning text-dark',
    SPAM: 'text-bg-danger',
    REJECTED: 'text-bg-danger',
  };
  return `<span class="badge ${map[status] || 'text-bg-secondary'}">${status || '-'}</span>`;
}

function getPublicPostUrl(comment) {
  if (comment.postSlug) return AppConfig.buildPublicUrl('post.html', { slug: comment.postSlug });
  if (comment.postId) return AppConfig.buildPublicUrl('post.html', { id: comment.postId });
  return '#';
}

function renderCommentPage() {
  const tbody = document.getElementById('comments-tbody');
  const totalBadge = document.getElementById('comments-total-badge');
  if (totalBadge) totalBadge.textContent = `${totalElements} ${I18n.t('comments_dyn.total')}`;

  totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  if (currentPage >= totalPages) currentPage = 0;

  const start = currentPage * PAGE_SIZE;
  const items = displayList.slice(start, start + PAGE_SIZE);

  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">${I18n.t('comments_dyn.no_comments')}</td></tr>`;
    renderPagination();
    return;
  }

  tbody.innerHTML = items.map(c => {
    const isPending = c.status === 'PENDING';
    const isSpam = c.status === 'SPAM' || c.status === 'REJECTED';
    const rowClass = isPending ? 'table-warning' : isSpam ? 'table-danger' : '';
    const actions = isPending
      ? `<button class="btn btn-sm btn-success" onclick="approveComment(${c.id})" title="${I18n.t('common.approved')}"><i class="bi bi-check-lg"></i></button>
         <button class="btn btn-sm btn-outline-danger" onclick="rejectComment(${c.id})" title="${I18n.t('common.spam')}"><i class="bi bi-slash-circle"></i></button>
         <button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="${I18n.t('common.delete')}"><i class="bi bi-trash"></i></button>`
      : isSpam
        ? `<button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="${I18n.t('common.delete')}"><i class="bi bi-trash"></i></button>`
        : `<button class="btn btn-sm btn-outline-danger" onclick="rejectComment(${c.id})" title="${I18n.t('common.spam')}"><i class="bi bi-slash-circle"></i></button>
           <button class="btn btn-sm btn-danger" onclick="deleteComment(${c.id})" title="${I18n.t('common.delete')}"><i class="bi bi-trash"></i></button>`;

    const postUrl = getPublicPostUrl(c);
    const postLinkAttrs = postUrl === '#'
      ? 'href="#" class="text-muted text-decoration-none pe-none" tabindex="-1" aria-disabled="true"'
      : `href="${postUrl}" target="_blank" rel="noopener noreferrer"`;

    return `
      <tr class="${rowClass}">
        <td><input type="checkbox" class="form-check-input" /></td>
        <td><strong>${c.user?.fullName || c.user?.username || I18n.t('comments_dyn.anonymous')}</strong><br><small class="text-muted">${c.user?.username || ''}</small></td>
        <td class="col-wrap"><p class="mb-0 text-truncate">${c.content || '-'}</p></td>
        <td class="col-wrap"><a ${postLinkAttrs}>${c.postTitle || '-'}</a></td>
        <td>${statusBadgeComment(c.status)}</td>
        <td>${UI.formatDate(c.createdAt)}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');

  renderPagination();
}

function updateStats(list) {
  const total = list.length;
  const pending = list.filter(c => c.status === 'PENDING').length;
  const approved = list.filter(c => c.status === 'APPROVED').length;
  const spam = list.filter(c => c.status === 'SPAM' || c.status === 'REJECTED').length;

  const nums = document.querySelectorAll('.info-box-number');
  if (nums[0]) nums[0].textContent = total;
  if (nums[1]) nums[1].textContent = pending;
  if (nums[2]) nums[2].textContent = approved;
  if (nums[3]) nums[3].textContent = spam;
}

async function loadAllComments() {
  try {
    const [commentsRaw, postsData] = await Promise.all([
      CommentService.getAll(),
      PostService.getAll(),
    ]);

    const posts = Array.isArray(postsData) ? postsData : (postsData.content ?? []);
    const postMap = Object.fromEntries(posts.map(p => [p.id, p]));

    allComments = (commentsRaw || []).map(c => {
      const post = postMap[c.postId];
      return {
        ...c,
        postTitle: post?.title || c.postTitle || '-',
        postSlug: post?.slug || c.postSlug || '',
      };
    });

    totalElements = allComments.length;
    displayList = allComments;
    currentPage = 0;
    renderCommentPage();
    updateStats(allComments);
  } catch (err) {
    UI.toast(I18n.t('comments_dyn.load_failed') + err.message, 'danger');
  }
}

async function approveComment(id) {
  try {
    await CommentService.approve(id);
    UI.toast(I18n.t('comments_dyn.approved'));
    await loadAllComments();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

async function rejectComment(id) {
  try {
    await CommentService.reject(id);
    UI.toast(I18n.t('comments_dyn.rejected'));
    await loadAllComments();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

async function deleteComment(id) {
  if (!await UI.confirm(I18n.t('comments_dyn.delete_confirm'))) return;

  try {
    await CommentService.delete(id);
    UI.toast(I18n.t('comments_dyn.deleted'));
    await loadAllComments();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

window.approveComment = approveComment;
window.rejectComment = rejectComment;
window.deleteComment = deleteComment;

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  const filterSelect = document.querySelector('select');
  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      const status = this.value.toUpperCase();
      displayList = status ? allComments.filter(c => c.status === status) : allComments;
      totalElements = displayList.length;
      currentPage = 0;
      renderCommentPage();
    });
  }

  document.getElementById('comments-refresh-btn')?.addEventListener('click', async () => {
    const searchInput = document.getElementById('comments-search');
    if (searchInput) searchInput.value = '';

    const refreshFilterSelect = document.querySelector('select');
    if (refreshFilterSelect) refreshFilterSelect.value = '';

    displayList = allComments;
    totalElements = allComments.length;
    currentPage = 0;
    await loadAllComments();
  });

  const btnApproveAll = document.getElementById('btn-approve-all');
  if (btnApproveAll) {
    btnApproveAll.addEventListener('click', async function () {
      const pending = allComments.filter(c => c.status === 'PENDING');
      if (!pending.length) {
        UI.toast(I18n.t('comments_dyn.no_pending'), 'info');
        return;
      }

      await Promise.allSettled(pending.map(c => CommentService.approve(c.id)));
      UI.toast(I18n.t('comments_dyn.approved_count').replace('{n}', pending.length));
      await loadAllComments();
    });
  }

  await loadAllComments();
  await UI.renderCurrentUser();
});
