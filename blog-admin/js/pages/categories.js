/**
 * Categories Page Logic - Optimized Version
 * Features: Server-side pagination, Debounced Search, State Management, Smooth UX.
 */

// --- 1. State Management ---
// Tập trung tất cả biến trạng thái vào một object để dễ quản lý và debug
const state = {
  allCategories: [],      // Dùng cho dropdown parent (load full)
  totalElements: 0,
  totalPages: 1,
  currentPage: 0,         // 0-based index (Spring Boot standard)
  pageSize: 10,
  windowSize: 3,          // Số trang hiển thị trong sliding window
  editingId: null,        // ID của category đang được chỉnh sửa
  isSearching: false
};

// --- 2. DOM Elements Cache ---
// Truy xuất DOM một lần để tăng hiệu năng
const elements = {
  tbody: document.getElementById('cat-tbody'),
  pagination: document.getElementById('cat-pagination'),
  form: document.querySelector('form'),
  submitBtn: document.getElementById('submitBtn') || document.querySelector('button[type="submit"]'),
  cancelBtn: document.getElementById('cancelEditBtn'),
  searchInput: document.getElementById('cat-search'),
  searchBtn: document.getElementById('cat-search-btn'),
  refreshBtn: document.getElementById('cat-refresh-btn'),
  parentDropdown: document.getElementById('catParent'),
  totalBadge: document.querySelector('.card-tools .badge'),
  selectAll: document.getElementById('selectAll'),
  inputs: {
    title: document.getElementById('catTitle'),
    slug: document.getElementById('catSlug'),
    content: document.getElementById('catDescription'),
    imageUrl: document.getElementById('catImageUrl')
  },
  imgDropZone: document.getElementById('catImgDropZone'),
  imgPreview: document.getElementById('catImgPreview'),
  imgFileInput: document.getElementById('catImageFile')
};

// --- 3. Core Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  UI.initSidebar();
  setupEventListeners();
  await refreshData();
  await UI.renderCurrentUser();
});

/** Tải lại toàn bộ dữ liệu (Bảng + Dropdown) */
async function refreshData() {
  await Promise.all([loadCategories(), loadAllForDropdown()]);
}

// --- 4. Data Loading Logic ---

async function loadCategories() {
  try {
    const data = await CategoryService.getPage(state.currentPage, state.pageSize);

    // Chuẩn hóa dữ liệu từ Spring Boot Page hoặc mảng thuần
    const isPage = data && Array.isArray(data.content);
    const items = isPage ? data.content : (Array.isArray(data) ? data : []);

    state.totalElements = isPage ? data.totalElements : items.length;
    state.totalPages = isPage ? Math.max(1, data.totalPages) : Math.max(1, Math.ceil(items.length / state.pageSize));

    // Fallback client-side slice nếu backend chưa có pagination
    const displayItems = isPage ? items : items.slice(state.currentPage * state.pageSize, (state.currentPage + 1) * state.pageSize);

    renderTable(displayItems);
  } catch (err) {
    UI.toast('Failed to load categories: ' + err.message, 'danger');
  }
}

async function loadAllForDropdown() {
  try {
    const data = await CategoryService.getAll();
    state.allCategories = Array.isArray(data) ? data : (data?.content || []);

    elements.parentDropdown.innerHTML = '<option value="">None (Top Level)</option>' +
      state.allCategories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  } catch (err) {
    console.error('Dropdown load error:', err);
  }
}

// --- 5. Rendering Logic ---

function renderTable(items) {
  if (elements.totalBadge) elements.totalBadge.textContent = `${state.totalElements} total`;

  if (!items.length) {
    elements.tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No categories found.</td></tr>';
    elements.pagination.innerHTML = '';
    return;
  }

  elements.tbody.innerHTML = items.map(c => `
        <tr data-id="${c.id}">
            <td><input type="checkbox" class="form-check-input row-check" /></td>
            <td><strong>${c.title}</strong>${c.parentId ? ' <small class="text-muted">(sub)</small>' : ''}</td>
            <td><code>${c.slug}</code></td>
            <td class="text-truncate" style="max-width: 250px;">${c.content || '—'}</td>
            <td><span class="badge text-bg-primary">${c.postCount ?? 0}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editCategory(${c.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})" title="Delete"><i class="bi bi-trash"></i></button>
                
            </td>
        </tr>`).join('');

  renderPagination();
}

function renderPagination() {
  if (!elements.pagination) return;
  const { currentPage, totalPages, windowSize } = state;

  let html = `<ul class="pagination pagination-sm m-0 float-end">`;

  // Nút Previous
  html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">«</a></li>`;

  // Sliding Window Logic
  const windowStart = Math.max(0, currentPage - Math.floor(windowSize / 2));
  const windowEnd = Math.min(totalPages - 1, windowStart + windowSize - 1);
  const adjStart = Math.max(0, windowEnd - windowSize + 1);

  if (adjStart > 0) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="0">1</a></li>`;
    if (adjStart > 1) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
  }

  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`;
  }

  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  // Nút Next
  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">»</a></li>`;

  html += `</ul>`;
  elements.pagination.innerHTML = html;

  // Event Delegation cho Pagination
  elements.pagination.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const targetPage = parseInt(e.target.dataset.page);
      if (targetPage >= 0 && targetPage < totalPages) {
        state.currentPage = targetPage;
        loadCategories();
      }
    };
  });
}

// --- 6. Event Handlers ---

function setupEventListeners() {
  // 1. Auto-slug logic
  elements.inputs.title.addEventListener('input', function () {
    if (!state.editingId && elements.inputs.slug) {
      elements.inputs.slug.value = UI.toSlug(this.value);
    }
  });

  // 2. Form Submit (Create/Update)
  elements.form.onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: elements.inputs.title.value.trim(),
      slug: elements.inputs.slug.value.trim() || UI.toSlug(elements.inputs.title.value),
      content: elements.inputs.content.value.trim(),
      parentId: elements.parentDropdown.value || null,
      imageUrl: elements.inputs.imageUrl?.value.trim() || null
    };

    try {
      if (state.editingId) {
        await CategoryService.update(state.editingId, payload);
        UI.toast('Category updated successfully!');
      } else {
        await CategoryService.create(payload);
        UI.toast('Category created successfully!');
        state.currentPage = 0; // Về trang đầu khi tạo mới
      }
      resetForm();
      await refreshData();
    } catch (err) { UI.toast(err.message, 'danger'); }
  };

  // 3. Search với Debounce (300ms)
  let searchTimeout;
  elements.searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value.trim()), 300);
  });

  // 3b. Refresh button
  elements.refreshBtn?.addEventListener('click', async () => {
    if (elements.searchInput) elements.searchInput.value = '';
    state.currentPage = 0;
    await refreshData();
  });

  // 4. Select All
  elements.selectAll?.addEventListener('change', (e) => {
    document.querySelectorAll('.row-check').forEach(cb => cb.checked = e.target.checked);
  });

  // 5. Delete Selected
  document.getElementById('deleteSelectedBtn')?.addEventListener('click', deleteSelected);

  // 6. Cancel Edit
  elements.cancelBtn?.addEventListener('click', resetForm);

  // 7. Image upload
  elements.imgFileInput?.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (elements.imgPreview) { elements.imgPreview.src = e.target.result; elements.imgPreview.classList.remove('d-none'); }
      elements.imgDropZone?.classList.add('d-none');
    };
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('upload', file);
    try {
      const res = await Http.upload('/api/files/upload?folder=blog/categories', formData);
      if (res && res.path) { elements.inputs.imageUrl.value = res.path; UI.toast('Image uploaded.'); } // lưu path tương đối vào DB
    } catch (err) { UI.toast('Failed to upload image: ' + err.message, 'danger'); }
  });
}

// --- 7. Action Functions ---

async function performSearch(keyword) {
  if (!keyword) {
    state.currentPage = 0;
    await loadCategories();
    return;
  }
  try {
    const data = await CategoryService.search(keyword);
    const list = Array.isArray(data) ? data : (data?.content || []);
    renderTable(list.slice(0, state.pageSize));
    elements.pagination.innerHTML = ''; // Tắt phân trang khi đang search kết quả tự do
  } catch (err) {
    UI.toast('Search failed, showing all categories.', 'warning');
    await loadCategories();
  }
}

window.editCategory = (id) => {
  const cat = state.allCategories.find(c => c.id === id);
  if (!cat) return UI.toast('Category not found.', 'warning');

  state.editingId = id;
  elements.inputs.title.value = cat.title;
  elements.inputs.slug.value = cat.slug;
  elements.inputs.content.value = cat.content || '';
  elements.parentDropdown.value = cat.parentId || '';

  // Populate image
  if (elements.inputs.imageUrl) elements.inputs.imageUrl.value = cat.imageUrl || '';
  if (cat.imageUrl && elements.imgPreview) {
    elements.imgPreview.src = cat.imageUrl;
    elements.imgPreview.classList.remove('d-none');
    elements.imgDropZone?.classList.add('d-none');
  } else if (elements.imgPreview) {
    elements.imgPreview.classList.add('d-none');
    elements.imgDropZone?.classList.remove('d-none');
  }

  elements.submitBtn.textContent = 'Update Category';
  elements.cancelBtn?.classList.remove('d-none');
  elements.inputs.title.scrollIntoView({ behavior: 'smooth' });
  elements.inputs.title.focus();
};

window.deleteCategory = async (id) => {
  if (!await UI.confirm('Are you sure you want to delete this category?')) return;
  try {
    await CategoryService.delete(id);
    UI.toast('Deleted successfully.');

    // Kiểm tra nếu trang hiện tại hết item thì lùi trang
    const remainingOnPage = elements.tbody.querySelectorAll('tr').length;
    if (remainingOnPage <= 1 && state.currentPage > 0) state.currentPage--;

    await refreshData();
  } catch (err) { UI.toast(err.message, 'danger'); }
};

async function deleteSelected() {
  const ids = Array.from(document.querySelectorAll('.row-check:checked'))
    .map(cb => Number(cb.closest('tr').dataset.id));

  if (!ids.length) return UI.toast('Please select at least one item.', 'warning');
  if (!await UI.confirm(`Delete ${ids.length} selected items?`)) return;

  try {
    await Promise.all(ids.map(id => CategoryService.delete(id)));
    UI.toast('Selected categories deleted.');
    if (elements.selectAll) elements.selectAll.checked = false;
    await refreshData();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

function resetForm() {
  state.editingId = null;
  elements.form.reset();
  if (elements.inputs.imageUrl) elements.inputs.imageUrl.value = '';
  if (elements.imgPreview) elements.imgPreview.classList.add('d-none');
  elements.imgDropZone?.classList.remove('d-none');
  elements.submitBtn.textContent = 'Add Category';
  elements.cancelBtn?.classList.add('d-none');
}