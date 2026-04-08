/**
 * Categories Page Logic
 */

let allCategories = [];
let filteredCategories = [];
let editingCatId = null;
let currentPage = 1;
const PAGE_SIZE = 10;

function renderPagination(list) {
  const container = document.getElementById('cat-pagination');
  if (!container) return;

  const totalPages = Math.ceil(list.length / PAGE_SIZE);

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
        renderCategories(filteredCategories);
      }
    });
  });
}

function renderCategories(list) {
  filteredCategories = list;
  const tbody = document.getElementById('cat-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = list.length + ' total';

  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No categories found.</td></tr>';
    renderPagination([]);
    return;
  }

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  if (tbody) {
    tbody.innerHTML = pageItems.map(c => `
      <tr data-id="${c.id}">
        <td><input type="checkbox" class="form-check-input row-check" /></td>
        <td><strong>${c.title}</strong>${c.parentId ? ' <small class="text-muted">(sub)</small>' : ''}</td>
        <td><code>${c.slug}</code></td>
        <td>${c.content || '—'}</td>
        <td><span class="badge text-bg-primary">${c.postCount ?? 0}</span></td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editCategory(${c.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  renderPagination(list);
}

// Cập nhật dropdown parent category — luôn dùng allCategories, không phụ thuộc kết quả search
function updateParentDropdown() {
  const sel = document.getElementById('catParent');
  if (sel) {
    sel.innerHTML = '<option value="">None (Top Level)</option>' +
      allCategories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  }
}

async function loadCategories() {
  try {
    const data = await CategoryService.getAll();
    allCategories = Array.isArray(data) ? data : [];
    currentPage = 1;
    renderCategories(allCategories);
    updateParentDropdown();
  } catch (err) {
    UI.toast('Failed to load categories: ' + err.message, 'danger');
  }
}

function editCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;
  editingCatId = id;
  const titleInput = document.getElementById('catTitle');
  const slugInput = document.getElementById('catSlug');
  const descInput = document.getElementById('catDescription');
  const submitBtn = document.querySelector('[type="submit"]');

  if (titleInput) titleInput.value = cat.title;
  if (slugInput) slugInput.value = cat.slug;
  if (descInput) descInput.value = cat.content || '';
  if (submitBtn) submitBtn.textContent = 'Update Category';
}

async function deleteCategory(id) {
  if (!await UI.confirm('Delete this category?')) return;
  try {
    await CategoryService.delete(id);
    UI.toast('Category deleted.');
    loadCategories();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

async function deleteSelectedCategories() {
  const checkedBoxes = document.querySelectorAll('.row-check:checked');

  if (checkedBoxes.length === 0) {
    UI.toast('Vui lòng chọn ít nhất một category để xóa.', 'warning');
    return;
  }

  if (!await UI.confirm(`Bạn có chắc chắn muốn xóa ${checkedBoxes.length} category đã chọn không?`)) {
    return;
  }

  const categoryIds = Array.from(checkedBoxes).map(cb => {
    const row = cb.closest('tr');
    return row ? Number(row.dataset.id) : null;
  }).filter(id => id !== null);

  try {
    await Promise.all(categoryIds.map(id => CategoryService.delete(id)));
    UI.toast(`${categoryIds.length} category đã được xóa thành công.`, 'success');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;
    loadCategories();
  } catch (err) {
    UI.toast(err.message || 'Đã xảy ra lỗi khi xóa các category.', 'danger');
  }
}

// Gán các hàm vào window để gọi từ HTML
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Auto slug
  const titleInput = document.getElementById('catTitle');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      const slugInput = document.getElementById('catSlug');
      if (slugInput && !editingCatId) slugInput.value = UI.toSlug(this.value);
    });
  }

  // Form submit
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('catTitle').value.trim(),
        slug: document.getElementById('catSlug').value.trim() || UI.toSlug(document.getElementById('catTitle').value),
        content: document.getElementById('catDescription').value.trim(),
        parentId: document.getElementById('catParent').value || null,
      };
      try {
        if (editingCatId) {
          await CategoryService.update(editingCatId, payload);
          UI.toast('Category updated.');
          editingCatId = null;
          const submitBtn = document.querySelector('[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Add Category';
        } else {
          await CategoryService.create(payload);
          UI.toast('Category created.');
        }
        this.reset();
        loadCategories();
      } catch (err) { UI.toast(err.message, 'danger'); }
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
    deleteSelectedBtn.addEventListener('click', deleteSelectedCategories);
  }

  // Search
  const searchInput = document.getElementById('cat-search');
  const searchBtn = document.getElementById('cat-search-btn');

  async function performSearch() {
    const keyword = searchInput?.value.trim() || '';
    if (!keyword) {
      currentPage = 1;
      renderCategories(allCategories);
      return;
    }
    try {
      const data = await CategoryService.search(keyword);
      currentPage = 1;
      renderCategories(Array.isArray(data) ? data : []);
    } catch {
      currentPage = 1;
      renderCategories(allCategories.filter(c =>
        c.title.toLowerCase().includes(keyword.toLowerCase()) ||
        c.slug.toLowerCase().includes(keyword.toLowerCase())
      ));
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
  }

  await loadCategories();
  await UI.renderCurrentUser();
});
