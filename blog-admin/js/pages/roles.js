/**
 * Roles Page Logic
 * Server-side pagination + sliding window.
 * Roles thường ít (< 20) nên dùng client-side slice vẫn hợp lệ,
 * nhưng vẫn gọi API fresh mỗi khi đổi trang.
 */

let allRoles       = [];
let allPermissions = [];
let editingRoleId  = null;
let managingRoleId = null;

let totalElements = 0;
let totalPages    = 1;
let currentPage   = 0;   // 0-based
const PAGE_SIZE   = 10;
const WINDOW_SIZE = 3;

let _searchKeyword = '';

const roleBadgeClass = {
  ADMIN:     'text-bg-danger',
  MODERATOR: 'text-bg-primary',
  AUTHOR:    'text-bg-success',
  USER:      'text-bg-secondary',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderPagination() {
  const container = document.getElementById('roles-pagination');
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
    if (adjStart > 1) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
  }
  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }
  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
  </li></ul>`;

  container.innerHTML = html;
  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadRoles();
      }
    });
  });
}

function renderRoles(items) {
  const tbody      = document.getElementById('roles-tbody');
  const countBadge = document.getElementById('roles-count-badge');
  if (countBadge) countBadge.textContent = `${totalElements} total`;

  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No roles found.</td></tr>';
    renderPagination();
    return;
  }

  const offset = currentPage * PAGE_SIZE;
  tbody.innerHTML = items.map((r, i) => `
    <tr>
      <td>${offset + i + 1}</td>
      <td><span class="badge ${roleBadgeClass[r.name] || 'text-bg-secondary'} fs-6">${r.name}</span></td>
      <td class="col-wrap">${r.description || '—'}</td>
      <td><span class="badge text-bg-secondary">${(r.permissions || []).length || r.permissionCount || 0}</span></td>
      <td><span class="badge text-bg-primary">${r.userCount ?? 0}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="openManagePermissions(${r.id},'${r.name}')" data-bs-toggle="modal" data-bs-target="#managePermissionsModal"><i class="bi bi-key me-1"></i>Permissions</button>
        <button class="btn btn-sm btn-warning" onclick="openEditRole(${r.id},'${r.name}','${r.description || ''}')" data-bs-toggle="modal" data-bs-target="#editRoleModal"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteRole(${r.id})" ${r.name === 'ADMIN' ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  renderPagination();
}

// ── Load dữ liệu từ server ─────────────────────────────────────────────────────

async function loadRoles() {
  try {
    const data = await RoleService.getAll();
    allRoles = isPageResponse(data) ? data.content : (Array.isArray(data) ? data : (data.content ?? []));

    const filtered = _searchKeyword
      ? allRoles.filter(r => r.name.toLowerCase().includes(_searchKeyword) || (r.description || '').toLowerCase().includes(_searchKeyword))
      : allRoles;

    totalElements = filtered.length;
    totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage >= totalPages) currentPage = 0;

    renderRoles(filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE));
  } catch (err) {
    UI.toast('Failed to load roles: ' + err.message, 'danger');
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

function openEditRole(id, name, description) {
  editingRoleId = id;
  const nameInput = document.getElementById('editRoleName');
  const descInput = document.getElementById('editRoleDescription');
  if (nameInput) nameInput.value = name;
  if (descInput) descInput.value = description;
}

function openManagePermissions(roleId, roleName) {
  managingRoleId = roleId;
  const roleNameEl = document.getElementById('managingRoleName');
  if (roleNameEl) roleNameEl.textContent = roleName;

  const role = allRoles.find(r => r.id === roleId);
  const assignedIds = new Set((role?.permissions || []).map(p => p.id));

  const tabAll = document.getElementById('rp-tab-all');
  if (tabAll) bootstrap.Tab.getOrCreateInstance(tabAll).show();
  renderPermissionCheckboxes(assignedIds);
}

function renderPermissionCheckboxes(assignedIds = new Set()) {
  const menuPerms = allPermissions.filter(p => (p.type || '').toUpperCase() === 'MENU');
  const apiPerms  = allPermissions.filter(p => (p.type || '').toUpperCase() === 'API');

  const allCount  = document.getElementById('rpAllCount');
  const menuCount = document.getElementById('rpMenuCount');
  const apiCount  = document.getElementById('rpApiCount');

  if (allCount)  allCount.textContent  = allPermissions.length;
  if (menuCount) menuCount.textContent = menuPerms.length;
  if (apiCount)  apiCount.textContent  = apiPerms.length;

  function buildPermissionToggleButton(attributes) {
    return `
      <button type="button" class="perm-toggle-switch" ${attributes} aria-pressed="false">
        <span class="perm-toggle-label perm-toggle-label-off">OFF</span>
        <span class="perm-toggle-label perm-toggle-label-on">ON</span>
        <span class="perm-toggle-thumb"></span>
      </button>`;
  }

  function buildCheckboxSection(list, scopeKey) {
    if (!list.length) return '<p class="text-muted">No permissions in this category.</p>';
    const groups = {};
    list.forEach(p => {
      const group = p.tag.split(':')[0];
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return Object.entries(groups).map(([group, perms]) => {
      const isMenuGroup = (perms[0]?.type || '').toUpperCase() === 'MENU';
      const groupKey = `${(perms[0]?.type || '').toUpperCase()}:${group}`;
      return `
        <div class="d-flex align-items-center justify-content-between gap-2 mb-2 mt-3">
          <h6 class="text-uppercase text-muted fw-bold mb-0"><i class="bi ${isMenuGroup ? 'bi-layout-sidebar' : 'bi-code-slash'} me-1"></i>${group}</h6>
          ${buildPermissionToggleButton(`data-toggle-group="${groupKey}"`)}
        </div>
        <div class="row mb-2">
          ${perms.map(p => {
            const wl = p.isWhiteList === 1 || p.isWhiteList === true;
            return `<div class="col-md-4 mb-1">
              <div class="form-check">
                <input class="form-check-input perm-check" type="checkbox" id="pm_${scopeKey}_${p.id}" value="${p.id}" data-group-key="${groupKey}" ${assignedIds.has(p.id) ? 'checked' : ''} />
                <label class="form-check-label" for="pm_${scopeKey}_${p.id}">
                  <code>${p.tag}</code>
                  ${wl ? '<span class="badge text-bg-success ms-1" style="font-size:0.6rem">Public</span>' : ''}
                  ${p.method ? `<span class="badge ms-1" style="font-size:0.6rem;background:#6c757d;color:#fff">${p.method}</span>` : ''}
                </label>
                ${p.name ? `<small class="d-block text-muted" style="font-size:0.7rem">${p.name}</small>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div><hr/>`;
    }).join('');
  }

  const allContent  = document.getElementById('rp-all-content');
  const menuContent = document.getElementById('rp-menu-content');
  const apiContent  = document.getElementById('rp-api-content');

  if (allContent)  allContent.innerHTML  = buildCheckboxSection(allPermissions, 'all');
  if (menuContent) menuContent.innerHTML = buildCheckboxSection(menuPerms, 'menu');
  if (apiContent)  apiContent.innerHTML  = buildCheckboxSection(apiPerms, 'api');
  updatePermissionToggleStates();
}

function setPermissionToggleState(button, isEnabled) {
  if (!button) return;
  button.classList.toggle('is-on', isEnabled);
  button.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
}

function updatePermissionToggleStates() {
  const allCheckboxes = [...document.querySelectorAll('.perm-check')];
  const allEnabled = allCheckboxes.length > 0 && allCheckboxes.every(cb => cb.checked);
  setPermissionToggleState(document.getElementById('btnToggleAllPermissions'), allEnabled);

  document.querySelectorAll('[data-toggle-group]').forEach(button => {
    const groupKey = button.dataset.toggleGroup;
    const groupCheckboxes = [...document.querySelectorAll(`.perm-check[data-group-key="${groupKey}"]`)];
    const isEnabled = groupCheckboxes.length > 0 && groupCheckboxes.every(cb => cb.checked);
    setPermissionToggleState(button, isEnabled);
  });
}

function syncPermissionCheckboxes(permissionId, checked) {
  document.querySelectorAll(`.perm-check[value="${permissionId}"]`).forEach(cb => {
    cb.checked = checked;
  });
}

async function deleteRole(id) {
  if (!await UI.confirm('Delete this role?')) return;
  try {
    await RoleService.delete(id);
    UI.toast('Role deleted.');
    await loadRoles();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

window.openEditRole          = openEditRole;
window.openManagePermissions = openManagePermissions;
window.deleteRole            = deleteRole;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Add role form
  const addRoleForm = document.getElementById('addRoleForm');
  if (addRoleForm) {
    addRoleForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        await RoleService.create({
          name:        document.getElementById('roleName').value.trim().toUpperCase(),
          description: document.getElementById('roleDescription').value.trim(),
        });
        UI.toast('Role created.');
        bootstrap.Modal.getInstance(document.getElementById('addRoleModal'))?.hide();
        this.reset();
        currentPage = 0;
        await loadRoles();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Edit role form
  const editRoleForm = document.getElementById('editRoleForm');
  if (editRoleForm) {
    editRoleForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        await RoleService.update(editingRoleId, {
          name:        document.getElementById('editRoleName').value.trim().toUpperCase(),
          description: document.getElementById('editRoleDescription').value.trim(),
        });
        UI.toast('Role updated.');
        bootstrap.Modal.getInstance(document.getElementById('editRoleModal'))?.hide();
        await loadRoles();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _searchKeyword = searchInput.value.trim().toLowerCase();
      currentPage    = 0;
      loadRoles();
    });
  }

  // Refresh button
  document.getElementById('roles-refresh-btn')?.addEventListener('click', async () => {
    if (searchInput) searchInput.value = '';
    _searchKeyword = '';
    currentPage    = 0;
    await loadRoles();
  });

  // Permission toggle buttons
  document.getElementById('btnToggleAllPermissions')?.addEventListener('click', (e) => {
    const shouldEnable = !e.currentTarget.classList.contains('is-on');
    document.querySelectorAll('.perm-check').forEach(cb => (cb.checked = shouldEnable));
    updatePermissionToggleStates();
  });
  document.addEventListener('click', (e) => {
    const groupButton = e.target.closest('[data-toggle-group]');
    if (!groupButton) return;

    const shouldEnable = !groupButton.classList.contains('is-on');
    const groupKey = groupButton.dataset.toggleGroup;
    document.querySelectorAll(`.perm-check[data-group-key="${groupKey}"]`).forEach(cb => {
      cb.checked = shouldEnable;
    });
    updatePermissionToggleStates();
  });
  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains('perm-check')) return;
    syncPermissionCheckboxes(e.target.value, e.target.checked);
    updatePermissionToggleStates();
  });

  // Save permissions
  document.getElementById('btnSavePermissions')?.addEventListener('click', async function () {
    const selected = [...new Set([...document.querySelectorAll('.perm-check:checked')].map(cb => Number(cb.value)))];
    try {
      await RoleService.assignPermissions(managingRoleId, selected);
      UI.toast('Permissions saved successfully.');
      bootstrap.Modal.getInstance(document.getElementById('managePermissionsModal'))?.hide();
      await loadRoles();
    } catch (err) { UI.toast(err.message, 'danger'); }
  });

  try {
    allPermissions = (await PermissionService.getAll()) || [];
  } catch (_) {}

  await loadRoles();
  await UI.renderCurrentUser();
});
