/**
 * Tags Page Logic
 */

let allTags = [];
let editingTagId = null;

function renderTags(list) {
  const tbody = document.getElementById('tags-tbody');
  const totalEl = document.querySelector('.card-tools .badge');
  if (totalEl) totalEl.textContent = list.length + ' total';
  
  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No tags found.</td></tr>';
    return;
  }
  
  const colors = ['text-bg-primary', 'text-bg-success', 'text-bg-info', 'text-bg-warning text-dark', 'text-bg-danger', 'text-bg-secondary'];
  
  if (tbody) {
    tbody.innerHTML = list.map((t, i) => `
      <tr>
        <td><input type="checkbox" class="form-check-input row-check" /></td>
        <td>${i + 1}</td>
        <td><span class="badge ${colors[i % colors.length]} fs-6">${t.title}</span></td>
        <td><code>${t.slug}</code></td>
        <td><span class="badge text-bg-secondary">${t.postCount ?? 0}</span></td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="openEditTag(${t.id},'${t.title}','${t.slug}')" data-bs-toggle="modal" data-bs-target="#editTagModal"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteTag(${t.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }
}

async function loadTags() {
  try {
    const data = await TagService.getAll();
    allTags = Array.isArray(data) ? data : [];
    renderTags(allTags);
  } catch (err) { UI.toast('Failed to load tags: ' + err.message, 'danger'); }
}

function openEditTag(id, name, slug) {
  editingTagId = id;
  const nameInput = document.getElementById('editTagName');
  const slugInput = document.getElementById('editTagSlug');
  if (nameInput) nameInput.value = name;
  if (slugInput) slugInput.value = slug;
}

async function deleteTag(id) {
  if (!UI.confirm('Delete this tag?')) return;
  try {
    await TagService.delete(id);
    UI.toast('Tag deleted.');
    allTags = allTags.filter(t => t.id !== id);
    renderTags(allTags);
  } catch (err) { UI.toast(err.message, 'danger'); }
}

// Gán các hàm vào window để gọi từ HTML
window.openEditTag = openEditTag;
window.deleteTag = deleteTag;

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

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

  await loadTags();
  await UI.renderCurrentUser();
});
