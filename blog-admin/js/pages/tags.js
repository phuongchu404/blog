/**
 * Tags Page Logic
 */

let allTags = [];
let filteredTags = [];
let editingTagId = null;
let currentPage = 1;
const PAGE_SIZE = 10;

function renderPagination(list) {
  const container = document.getElementById('tags-pagination');
  if (!container) return;

  const total = list.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  let html = '<ul class="pagination pagination-sm m-0 float-end">';

  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
  </li>`;

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i}</a>
    </li>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
  </li>`;

  html += '</ul>';
  container.innerHTML = html;

  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTags(filteredTags);
      }
    });
  });
}

function renderTags(list) {
  filteredTags = list;
  const tbody = document.getElementById('tags-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = list.length + ' total';

  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tags found.</td></tr>';
    renderPagination([]);
    return;
  }

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  const colors = ['text-bg-primary', 'text-bg-success', 'text-bg-info', 'text-bg-warning text-dark', 'text-bg-danger', 'text-bg-secondary'];

  if (tbody) {
    tbody.innerHTML = pageItems.map((t, i) => `
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
  }

  renderPagination(list);
}

async function loadTags() {
  try {
    const data = await TagService.getAll();
    allTags = Array.isArray(data) ? data : [];
    currentPage = 1;
    renderTags(allTags);
  } catch (err) { UI.toast('Failed to load tags: ' + err.message, 'danger'); }
}

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
    allTags = allTags.filter(t => t.id !== id);
    filteredTags = filteredTags.filter(t => t.id !== id);
    const totalPages = Math.ceil(filteredTags.length / PAGE_SIZE);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    renderTags(filteredTags);
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

  try {
    const tagIds = Array.from(checkedBoxes).map(checkbox => {
      const row = checkbox.closest('tr');
      return row ? row.dataset.id : null;
    }).filter(id => id !== null);

    if (tagIds.length === 0) {
      UI.toast('Không tìm thấy tag nào để xóa.', 'warning');
      return;
    }

    await Promise.all(tagIds.map(id => TagService.delete(id)));

    UI.toast(`${tagIds.length} tag đã được xóa thành công.`, 'success');

    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;

    loadTags();

  } catch (err) {
    console.error(err);
    UI.toast(err.message || 'Đã xảy ra lỗi khi xóa các tag.', 'danger');
  }
}

// Gán các hàm vào window để gọi từ HTML
window.openEditTag = openEditTag;
window.deleteTag = deleteTag;
window.deleteSelectedTags = deleteSelectedTags;

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
        slug: document.getElementById('tagSlug').value.trim() || UI.toSlug(document.getElementById('tagName').value),
      };
      try {
        await TagService.create(payload);
        UI.toast('Tag created.');
        this.reset();
        loadTags();
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
        slug: document.getElementById('editTagSlug').value.trim(),
      };
      try {
        await TagService.update(editingTagId, payload);
        UI.toast('Tag updated.');
        const modalEl = document.getElementById('editTagModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        loadTags();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  async function performSearch() {
    const keyword = searchInput?.value.trim() || '';
    if (!keyword) {
      currentPage = 1;
      renderTags(allTags);
      return;
    }
    try {
      const data = await TagService.search(keyword);
      currentPage = 1;
      renderTags(Array.isArray(data) ? data : []);
    } catch {
      currentPage = 1;
      renderTags(allTags.filter(t =>
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        t.slug.toLowerCase().includes(keyword.toLowerCase())
      ));
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
  }

  await loadTags();
  await UI.renderCurrentUser();
});
