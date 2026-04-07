/**
 * Categories Page Logic
 */

let editingCatId = null;

function renderCategories(list) {
  const tbody = document.getElementById('cat-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = list.length + ' total';
  
  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No categories found.</td></tr>';
    return;
  }
  
  if (tbody) {
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><input type="checkbox" class="form-check-input" /></td>
        <td><strong>${c.title}</strong>${c.parentId ? ' <small class="text-muted">(sub)</small>' : ''}</td>
        <td><code>${c.slug}</code></td>
        <td>${c.content || '—'}</td>
        <td><span class="badge text-bg-primary">${c.postCount ?? 0}</span></td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editCategory(${c.id},'${c.title}','${c.slug}','${c.content || ''}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  // Cập nhật dropdown parent category trong form thêm mới
  const sel = document.getElementById('catParent');
  if (sel) {
    sel.innerHTML = '<option value="">None (Top Level)</option>' +
      list.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  }
}

async function loadCategories() {
  try {
    const data = await CategoryService.getAll();
    renderCategories(Array.isArray(data) ? data : []);
  } catch (err) {
    UI.toast('Failed to load categories: ' + err.message, 'danger');
  }
}

function editCategory(id, title, slug, content) {
  editingCatId = id;
  const titleInput = document.getElementById('catTitle');
  const slugInput = document.getElementById('catSlug');
  const descInput = document.getElementById('catDescription');
  const submitBtn = document.querySelector('[type="submit"]');

  if (titleInput) titleInput.value = title;
  if (slugInput) slugInput.value = slug;
  if (descInput) descInput.value = content;
  if (submitBtn) submitBtn.textContent = 'Update Category';
}

async function deleteCategory(id) {
  if (!UI.confirm('Delete this category?')) return;
  try {
    await CategoryService.delete(id);
    UI.toast('Category deleted.');
    loadCategories();
  } catch (err) { UI.toast(err.message, 'danger'); }
}

// Gán các hàm vào window để gọi từ HTML
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // Auto slug
  const titleInput = document.getElementById('catTitle');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      const slugInput = document.getElementById('catSlug');
      if (slugInput) slugInput.value = UI.toSlug(this.value);
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

  await loadCategories();
  await UI.renderCurrentUser();
});
