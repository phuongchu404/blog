/**
 * Categories Page Logic
 * Pagination: server-side (gọi API theo từng trang).
 * Sliding window: hiển thị tối đa WINDOW_SIZE trang liền kề,
 * luôn kèm trang 1 và trang cuối nếu ngoài window.
 */

let allCategories = [];     // dùng cho dropdown parent (luôn load full)
let totalElements = 0;      // tổng số phần tử từ server
let totalPages = 1;         // tổng số trang từ server
let currentPage = 0;        // index trang hiện tại (0-based, theo chuẩn Spring)
const PAGE_SIZE = 10;
const WINDOW_SIZE = 3;      // số trang hiển thị liên tiếp trong window

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Phát hiện response có phải dạng Page của Spring Boot không.
 * Spring trả: { content: [], totalElements, totalPages, number, ... }
 */
function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('cat-pagination');
  if (!container) return;

  let html = `<ul class="pagination pagination-sm m-0 float-end">`;

  // Nút «  Prev
  html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
  </li>`;

  // Tính window hiện tại
  const windowStart = Math.max(0, currentPage - Math.floor(WINDOW_SIZE / 2));
  const windowEnd   = Math.min(totalPages - 1, windowStart + WINDOW_SIZE - 1);
  // Điều chỉnh nếu window vượt cuối
  const adjStart    = Math.max(0, windowEnd - WINDOW_SIZE + 1);

  // Trang 1 + dấu … nếu window không bắt đầu từ 0
  if (adjStart > 0) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="0">1</a></li>`;
    if (adjStart > 1) {
      html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    }
  }

  // Các trang trong window
  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }

  // Dấu … + trang cuối nếu window không kết thúc ở trang cuối
  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) {
      html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  // Nút »  Next
  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
  </li>`;

  html += `</ul>`;
  container.innerHTML = html;

  // Gắn sự kiện click — mỗi click gọi API mới
  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadCategories();
      }
    });
  });
}

function renderCategories(items) {
  const tbody = document.getElementById('cat-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = `${totalElements} total`;

  if (!items.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No categories found.</td></tr>';
    renderPagination();
    return;
  }

  if (tbody) {
    tbody.innerHTML = items.map(c => `
      <tr data-id="${c.id}">
        <td><input type="checkbox" class="form-check-input row-check" /></td>
        <td><strong>${c.title}</strong>${c.parentId ? ' <small class="text-muted">(sub)</small>' : ''}</td>
        <td><code>${c.slug}</code></td>
        <td class="col-wrap">${c.content || '—'}</td>
        <td><span class="badge text-bg-primary">${c.postCount ?? 0}</span></td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editCategory(${c.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  renderPagination();
}

// ── Cập nhật dropdown parent — luôn dùng allCategories (full list) ─────────────

function updateParentDropdown() {
  const sel = document.getElementById('catParent');
  if (sel) {
    sel.innerHTML = '<option value="">None (Top Level)</option>' +
      allCategories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  }
}

// ── Load dữ liệu từ server ─────────────────────────────────────────────────────

async function loadCategories() {
  try {
    const data = await CategoryService.getPage(currentPage, PAGE_SIZE);

    if (isPageResponse(data)) {
      // Backend hỗ trợ pagination (Spring Page)
      totalElements = data.totalElements;
      totalPages    = Math.max(1, data.totalPages);
      renderCategories(data.content);
    } else {
      // Backend trả về mảng thẳng (chưa hỗ trợ pagination)
      // → client-side slice tạm thời
      const list = Array.isArray(data) ? data : [];
      totalElements = list.length;
      totalPages    = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (currentPage >= totalPages) currentPage = 0;
      const start = currentPage * PAGE_SIZE;
      renderCategories(list.slice(start, start + PAGE_SIZE));
    }
  } catch (err) {
    UI.toast('Failed to load categories: ' + err.message, 'danger');
  }
}

async function loadAllCategoriesForDropdown() {
  try {
    const data = await CategoryService.getAll();
    allCategories = Array.isArray(data) ? data
      : Array.isArray(data?.content) ? data.content
      : [];
    updateParentDropdown();
  } catch {
    allCategories = [];
    updateParentDropdown();
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

function editCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) {
    UI.toast('Không tìm thấy category trong danh sách. Thử reload trang.', 'warning');
    return;
  }
  const titleInput  = document.getElementById('catTitle');
  const slugInput   = document.getElementById('catSlug');
  const descInput   = document.getElementById('catDescription');
  const parentSel   = document.getElementById('catParent');
  const submitBtn   = document.querySelector('[type="submit"]');

  if (titleInput) titleInput.value  = cat.title;
  if (slugInput)  slugInput.value   = cat.slug;
  if (descInput)  descInput.value   = cat.content || '';
  if (parentSel)  parentSel.value   = cat.parentId ?? '';
  if (submitBtn)  submitBtn.textContent = 'Update Category';

  // Lưu id đang edit vào biến toàn cục
  window._editingCatId = id;

  titleInput?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  titleInput?.focus();
}

async function deleteCategory(id) {
  if (!await UI.confirm('Delete this category?')) return;
  try {
    await CategoryService.delete(id);
    UI.toast('Category deleted.');
    // Nếu trang hiện tại không còn item nào, lùi 1 trang
    if (currentPage > 0) {
      const remainingOnPage = document.querySelectorAll('#cat-tbody tr[data-id]').length - 1;
      if (remainingOnPage <= 0) currentPage--;
    }
    await loadCategories();
    await loadAllCategoriesForDropdown();
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
    // Nếu xóa hết trang hiện tại thì lùi về trang trước
    if (currentPage > 0 && categoryIds.length >= PAGE_SIZE) currentPage--;
    await loadCategories();
    await loadAllCategoriesForDropdown();
  } catch (err) {
    UI.toast(err.message || 'Đã xảy ra lỗi khi xóa các category.', 'danger');
  }
}

// Gán các hàm vào window để gọi từ HTML
window.editCategory    = editCategory;
window.deleteCategory  = deleteCategory;
window._editingCatId   = null;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Auto slug khi thêm mới
  const titleInput = document.getElementById('catTitle');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      const slugInput = document.getElementById('catSlug');
      if (slugInput && !window._editingCatId) slugInput.value = UI.toSlug(this.value);
    });
  }

  // Form submit
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const payload = {
        title:    document.getElementById('catTitle').value.trim(),
        slug:     document.getElementById('catSlug').value.trim() || UI.toSlug(document.getElementById('catTitle').value),
        content:  document.getElementById('catDescription').value.trim(),
        parentId: document.getElementById('catParent').value || null,
      };
      try {
        if (window._editingCatId) {
          await CategoryService.update(window._editingCatId, payload);
          UI.toast('Category updated.');
          window._editingCatId = null;
          const submitBtn = document.querySelector('[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Add Category';
        } else {
          await CategoryService.create(payload);
          UI.toast('Category created.');
        }
        this.reset();
        currentPage = 0;
        await loadCategories();
        await loadAllCategoriesForDropdown();
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
  const searchBtn   = document.getElementById('cat-search-btn');

  async function performSearch() {
    const keyword = searchInput?.value.trim() || '';
    if (!keyword) {
      currentPage = 0;
      await loadCategories();
      return;
    }
    try {
      const data = await CategoryService.search(keyword);
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      // Kết quả search hiển thị hết trên 1 trang (thường ít item)
      totalElements = list.length;
      totalPages    = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      currentPage   = 0;
      renderCategories(list.slice(0, PAGE_SIZE));
    } catch {
      UI.toast('Không thể tìm kiếm, hiển thị tất cả.', 'warning');
      currentPage = 0;
      await loadCategories();
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });
  }

  // Load song song: dữ liệu trang + dropdown parent
  await Promise.all([loadCategories(), loadAllCategoriesForDropdown()]);
  await UI.renderCurrentUser();
});
