/**
 * Tags Page Logic
 * Pagination: server-side (gọi API theo từng trang).
 * Sliding window: hiển thị tối đa WINDOW_SIZE trang liền kề,
 * luôn kèm trang 1 và trang cuối nếu ngoài window.
 */

let allTags       = [];     // full list (dùng cho filter client-side)
let displayList   = [];     // list đang hiển thị (sau filter / search)
let totalElements = 0;      // tổng số phần tử
let totalPages    = 1;      // tổng số trang
let currentPage   = 0;      // index trang hiện tại (0-based, theo chuẩn Spring)
let editingTagId  = null;
const PAGE_SIZE   = 10;
const WINDOW_SIZE = 3;      // số trang hiển thị liên tiếp trong window

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('tags-pagination');
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
    if (adjStart > 1) {
      html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    }
  }

  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }

  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) {
      html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
  </li>`;

  html += `</ul>`;
  container.innerHTML = html;

  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 0 && page < totalPages) {
        currentPage = page;
        renderTagPage();
      }
    });
  });
}

function renderTagPage() {
  const tbody   = document.getElementById('tags-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = `${totalElements} total`;

  totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  if (currentPage >= totalPages) currentPage = 0;

  const start = currentPage * PAGE_SIZE;
  const items = displayList.slice(start, start + PAGE_SIZE);

  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tags found.</td></tr>';
    renderPagination();
    return;
  }

  const colors = ['text-bg-primary', 'text-bg-success', 'text-bg-info', 'text-bg-warning text-dark', 'text-bg-danger', 'text-bg-secondary'];

  tbody.innerHTML = items.map((t, i) => `
    <tr data-id="${t.id}">
      <td><input type="checkbox" class="form-check-input row-check" /></td>
      <td>${start + i + 1}</td>
      <td><span class="badge ${colors[(start + i) % colors.length]} fs-6">${t.title}</span></td>
      <td><code>${t.slug}</code></td>
      <td><span class="badge text-bg-secondary">${t.postCount ?? 0}</span></td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="openEditTag(${t.id})" data-bs-toggle="modal" data-bs-target="#editTagModal"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteTag(${t.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  renderPagination();
}

// ── Load dữ liệu từ server ─────────────────────────────────────────────────────

async function loadTags() {
  try {
    const data = await TagService.getAll();

    if (isPageResponse(data)) {
      totalElements = data.totalElements;
      totalPages    = Math.max(1, data.totalPages);
      allTags       = data.content;
    } else {
      allTags       = Array.isArray(data) ? data : [];
      totalElements = allTags.length;
      totalPages    = Math.max(1, Math.ceil(allTags.length / PAGE_SIZE));
    }
    displayList = allTags;
    currentPage = 0;
    renderTagPage();
  } catch (err) {
    UI.toast('Failed to load tags: ' + err.message, 'danger');
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

function openEditTag(id) {
  const tag = allTags.find(t => t.id === id);
  if (!tag) return;
  editingTagId = id;
  const nameInput = document.getElementById('editTagName');
  const slugInput = document.getElementById('editTagSlug');
  if (nameInput) nameInput.value = tag.title;
  if (slugInput) slugInput.value = tag.slug;
}

async function deleteTag(id) {
  if (!await UI.confirm('Delete this tag?')) return;
  try {
    await TagService.delete(id);
    UI.toast('Tag deleted.');
    if (currentPage > 0) {
      const remainingOnPage = document.querySelectorAll('#tags-tbody tr[data-id]').length - 1;
      if (remainingOnPage <= 0) currentPage--;
    }
    await loadTags();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function deleteSelectedTags() {
  const checkedBoxes = document.querySelectorAll('.row-check:checked');

  if (checkedBoxes.length === 0) {
    UI.toast('Vui lòng chọn ít nhất một tag để xóa.', 'warning');
    return;
  }

  if (!await UI.confirm(`Bạn có chắc chắn muốn xóa ${checkedBoxes.length} tag đã chọn không?`)) {
    return;
  }

  const tagIds = Array.from(checkedBoxes).map(cb => {
    const row = cb.closest('tr');
    return row ? Number(row.dataset.id) : null;
  }).filter(id => id !== null);

  try {
    await Promise.all(tagIds.map(id => TagService.delete(id)));
    UI.toast(`${tagIds.length} tag đã được xóa thành công.`, 'success');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;
    if (currentPage > 0 && tagIds.length >= PAGE_SIZE) currentPage--;
    await loadTags();
  } catch (err) {
    UI.toast(err.message || 'Đã xảy ra lỗi khi xóa các tag.', 'danger');
  }
}

// Gán các hàm vào window để gọi từ HTML
window.openEditTag        = openEditTag;
window.deleteTag          = deleteTag;
window.deleteSelectedTags = deleteSelectedTags;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Auto slug — add form
  const tagNameInput = document.getElementById('tagName');
  if (tagNameInput) {
    tagNameInput.addEventListener('input', function () {
      const tagSlugInput = document.getElementById('tagSlug');
      if (tagSlugInput) tagSlugInput.value = UI.toSlug(this.value);
    });
  }

  // Auto slug — edit form
  const editTagNameInput = document.getElementById('editTagName');
  if (editTagNameInput) {
    editTagNameInput.addEventListener('input', function () {
      const editTagSlugInput = document.getElementById('editTagSlug');
      if (editTagSlugInput) editTagSlugInput.value = UI.toSlug(this.value);
    });
  }

  // Select all
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = this.checked);
    });
  }

  // Delete selected
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', deleteSelectedTags);
  }

  // Add tag form
  const addTagForm = document.getElementById('addTagForm');
  if (addTagForm) {
    addTagForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('tagName').value.trim(),
        slug:  document.getElementById('tagSlug').value.trim() || UI.toSlug(document.getElementById('tagName').value),
      };
      try {
        await TagService.create(payload);
        UI.toast('Tag created.');
        this.reset();
        currentPage = 0;
        await loadTags();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Edit tag form (inside modal)
  const editTagForm = document.getElementById('editTagForm');
  if (editTagForm) {
    editTagForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('editTagName').value.trim(),
        slug:  document.getElementById('editTagSlug').value.trim(),
      };
      try {
        await TagService.update(editingTagId, payload);
        UI.toast('Tag updated.');
        const modalEl = document.getElementById('editTagModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        await loadTags();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.getElementById('searchBtn');

  async function performSearch() {
    const keyword = searchInput?.value.trim() || '';
    if (!keyword) {
      currentPage   = 0;
      displayList   = allTags;
      totalElements = allTags.length;
      totalPages    = Math.max(1, Math.ceil(allTags.length / PAGE_SIZE));
      renderTagPage();
      return;
    }
    try {
      const data = await TagService.search(keyword);
      const list  = Array.isArray(data) ? data : [];
      displayList   = list;
      totalElements = list.length;
      totalPages    = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      currentPage   = 0;
      renderTagPage();
    } catch {
      displayList = allTags.filter(t =>
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        t.slug.toLowerCase().includes(keyword.toLowerCase())
      );
      totalElements = displayList.length;
      totalPages    = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
      currentPage   = 0;
      renderTagPage();
    }
  }

  if (searchBtn)   searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
  }

  await loadTags();
  await UI.renderCurrentUser();
});
