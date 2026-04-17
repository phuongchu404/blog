/**
 * Tags Page Logic
 * Pagination: server-side (gọi API theo từng trang).
 * Sliding window: hiển thị tối đa WINDOW_SIZE trang liền kề,
 * luôn kèm trang 1 và trang cuối nếu ngoài window.
 */

let allTags = [];     // full list (dùng cho filter client-side)
let displayList = [];     // list đang hiển thị (sau filter / search)
let totalElements = 0;      // tổng số phần tử
let totalPages = 1;      // tổng số trang
let currentPage = 0;      // index trang hiện tại (0-based, theo chuẩn Spring)
let editingTagId = null;
const PAGE_SIZE = 10;
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
  const windowEnd = Math.min(totalPages - 1, windowStart + WINDOW_SIZE - 1);
  const adjStart = Math.max(0, windowEnd - WINDOW_SIZE + 1);

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
  const tbody = document.getElementById('tags-tbody');
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
        <button class="btn btn-sm btn-warning" onclick="openEditTag(${t.id})"><i class="bi bi-pencil"></i></button>
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
      totalPages = Math.max(1, data.totalPages);
      allTags = data.content;
    } else {
      allTags = Array.isArray(data) ? data : [];
      totalElements = allTags.length;
      totalPages = Math.max(1, Math.ceil(allTags.length / PAGE_SIZE));
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
  if (!tag) {
    UI.toast('Không tìm thấy tag trong danh sách. Thử reload trang.', 'warning');
    return;
  }
  editingTagId = id;

  const nameInput = document.getElementById('tagName');
  const slugInput = document.getElementById('tagSlug');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const cardTitle = document.getElementById('formCardTitle');

  if (nameInput) nameInput.value = tag.title;
  if (slugInput) slugInput.value = tag.slug;
  const contentInput = document.getElementById('tagContent');
  if (contentInput) contentInput.value = tag.content || '';
  if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Tag';
  if (cancelEditBtn) cancelEditBtn.classList.remove('d-none');
  if (cardTitle) cardTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Update Tag';

  // Populate image
  const imgUrlInput = document.getElementById('tagImageUrl');
  const imgPreview = document.getElementById('tagImgPreview');
  const dropZone = document.getElementById('tagImgDropZone');
  if (imgUrlInput) imgUrlInput.value = tag.imageUrl || '';
  if (tag.imageUrl && imgPreview) {
    imgPreview.src = tag.imageUrl;
    imgPreview.classList.remove('d-none');
    if (dropZone) dropZone.classList.add('d-none');
  } else if (imgPreview) {
    imgPreview.classList.add('d-none');
    if (dropZone) dropZone.classList.remove('d-none');
  }

  nameInput?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  nameInput?.focus();
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
window.openEditTag = openEditTag;
window.deleteTag = deleteTag;
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

  // Cancel edit
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function () {
      editingTagId = null;
      document.getElementById('addTagForm')?.reset();
      document.getElementById('tagImageUrl').value = '';
      const imgPreview = document.getElementById('tagImgPreview');
      if (imgPreview) { imgPreview.classList.add('d-none'); imgPreview.src = ''; }
      document.getElementById('tagImgDropZone')?.classList.remove('d-none');
      const tagImageFile = document.getElementById('tagImageFile');
      if (tagImageFile) tagImageFile.value = '';
      this.classList.add('d-none');
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Add Tag';
      const cardTitle = document.getElementById('formCardTitle');
      if (cardTitle) cardTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Tag';
    });
  }

  // Edit Tag modal submit
  const editTagForm = document.getElementById('editTagForm');
  if (editTagForm) {
    editTagForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!editingTagId) return;
      const payload = {
        title: document.getElementById('editTagName').value.trim(),
        slug: document.getElementById('editTagSlug').value.trim() || UI.toSlug(document.getElementById('editTagName').value),
        content: document.getElementById('editTagContent').value.trim() || null,
        imageUrl: document.getElementById('editTagImageUrl').value.trim() || null,
      };
      try {
        await TagService.update(editingTagId, payload);
        UI.toast('Tag updated.');
        bootstrap.Modal.getInstance(document.getElementById('editTagModal'))?.hide();
        editingTagId = null;
        await loadTags();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // ── Image upload — Add form ─────────────────────────────────────────────────
  const tagFileInput = document.getElementById('tagImageFile');
  if (tagFileInput) {
    tagFileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('tagImgPreview');
        if (preview) { preview.src = e.target.result; preview.classList.remove('d-none'); }
        document.getElementById('tagImgDropZone')?.classList.add('d-none');
      };
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append('upload', file);
      try {
        const res = await Http.upload('/api/files/upload?folder=blog/tags', formData);
        if (res && res.path) {
          document.getElementById('tagImageUrl').value = res.path; // lưu path tương đối vào DB
          UI.toast('Image uploaded.');
        }
      } catch (err) { UI.toast('Failed to upload image: ' + err.message, 'danger'); }
    });
  }

  // ── Image upload — Edit modal ───────────────────────────────────────────────
  const editTagFileInput = document.getElementById('editTagImageFile');
  if (editTagFileInput) {
    editTagFileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('editTagImgPreview');
        if (preview) { preview.src = e.target.result; preview.classList.remove('d-none'); }
        document.getElementById('editTagImgDropZone')?.classList.add('d-none');
      };
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append('upload', file);
      try {
        const res = await Http.upload('/api/files/upload?folder=blog/tags', formData);
        if (res && res.path) {
          document.getElementById('editTagImageUrl').value = res.path; // lưu path tương đối vào DB
          UI.toast('Image uploaded.');
        }
      } catch (err) { UI.toast('Failed to upload image: ' + err.message, 'danger'); }
    });
  }

  // Add / Update tag form
  const addTagForm = document.getElementById('addTagForm');
  if (addTagForm) {
    addTagForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('tagName').value.trim(),
        slug: document.getElementById('tagSlug').value.trim() || UI.toSlug(document.getElementById('tagName').value),
        content: document.getElementById('tagContent').value.trim() || null,
        imageUrl: document.getElementById('tagImageUrl').value.trim() || null,
      };
      try {
        if (editingTagId) {
          await TagService.update(editingTagId, payload);
          UI.toast('Tag updated.');
          editingTagId = null;
        } else {
          await TagService.create(payload);
          UI.toast('Tag created.');
        }
        // Reset form completely
        this.reset();
        document.getElementById('tagImageUrl').value = '';
        const imgPreview = document.getElementById('tagImgPreview');
        if (imgPreview) { imgPreview.classList.add('d-none'); imgPreview.src = ''; }
        document.getElementById('tagImgDropZone')?.classList.remove('d-none');
        const tagImageFile = document.getElementById('tagImageFile');
        if (tagImageFile) tagImageFile.value = '';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Add Tag';
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) cancelBtn.classList.add('d-none');
        const cardTitle = document.getElementById('formCardTitle');
        if (cardTitle) cardTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Tag';
        currentPage = 0;
        await loadTags();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Search với Debounce (300ms)
  const searchInput = document.getElementById('tag-search');
  const refreshBtn = document.getElementById('tag-refresh-btn');

  async function performSearch(keyword) {
    if (!keyword) {
      currentPage = 0;
      await loadTags();
      return;
    }
    try {
      const data = await TagService.search(keyword);
      const list = Array.isArray(data) ? data : (data?.content || []);
      displayList = list;
      totalElements = list.length;
      totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      currentPage = 0;
      renderTagPage();
      document.getElementById('tags-pagination').innerHTML = ''; // tắt phân trang khi search
    } catch {
      UI.toast('Không thể tìm kiếm, hiển thị tất cả.', 'warning');
      currentPage = 0;
      await loadTags();
    }
  }

  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value.trim()), 300);
  });

  // Refresh button
  refreshBtn?.addEventListener('click', async () => {
    if (searchInput) searchInput.value = '';
    currentPage = 0;
    await loadTags();
  });

  await loadTags();
  await UI.renderCurrentUser();
});
