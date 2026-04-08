/**
 * Roles Page Logic
 */

let allRoles = [];
let allPermissions = [];
let editingRoleId = null;
let managingRoleId = null;
let rCurrentPage = 1;
const rPageSize = 10;

const roleBadgeClass = {
  ADMIN: "text-bg-danger",
  MODERATOR: "text-bg-primary",
  AUTHOR: "text-bg-success",
  USER: "text-bg-secondary",
};

function renderRoles(filteredList, startIdx = 0) {
  const tbody = document.getElementById("roles-tbody");
  if (!tbody) return;
  
  if (!filteredList.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No roles found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredList.map((r, i) => `
    <tr>
      <td>${startIdx + i + 1}</td>
      <td><span class="badge ${roleBadgeClass[r.name] || "text-bg-secondary"} fs-6">${r.name}</span></td>
      <td>${r.description || "—"}</td>
      <td><span class="badge text-bg-secondary">${(r.permissions || []).length || r.permissionCount || 0}</span></td>
      <td><span class="badge text-bg-primary">${r.userCount ?? 0}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="openManagePermissions(${r.id},'${r.name}')" data-bs-toggle="modal" data-bs-target="#managePermissionsModal"><i class="bi bi-key me-1"></i>Permissions</button>
        <button class="btn btn-sm btn-warning" onclick="openEditRole(${r.id},'${r.name}','${r.description || ""}')" data-bs-toggle="modal" data-bs-target="#editRoleModal"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteRole(${r.id})" ${r.name === "ADMIN" ? "disabled" : ""}><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("");
}

function refreshRolesList() {
  const kw = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  let filtered = allRoles;
  if (kw) {
    filtered = allRoles.filter(r => r.name.toLowerCase().includes(kw) || (r.description||'').toLowerCase().includes(kw));
  }
  const countBadge = document.getElementById("roles-count-badge");
  if (countBadge) countBadge.textContent = filtered.length + " total";

  const totalPages = Math.ceil(filtered.length / rPageSize) || 1;
  if (rCurrentPage > totalPages) rCurrentPage = totalPages;
  const start = (rCurrentPage - 1) * rPageSize;
  const pagedData = filtered.slice(start, start + rPageSize);
  
  renderRoles(pagedData, start);
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById("roles-pagination");
  if (!container) return;

  const startPage = Math.max(1, rCurrentPage - 2);
  const endPage = Math.min(totalPages, rCurrentPage + 2);

  let html = `<li class="page-item ${rCurrentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${rCurrentPage - 1}">«</a>
  </li>`;

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === rCurrentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i}</a>
    </li>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<li class="page-item disabled"><a class="page-link" href="#">…</a></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${rCurrentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${rCurrentPage + 1}">»</a>
  </li>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.dataset.page);
      if (page >= 1 && page <= totalPages) {
        rCurrentPage = page;
        refreshRolesList();
      }
    });
  });
}

function openEditRole(id, name, description) {
  editingRoleId = id;
  const nameInput = document.getElementById("editRoleName");
  const descInput = document.getElementById("editRoleDescription");
  if (nameInput) nameInput.value = name;
  if (descInput) descInput.value = description;
}

function openManagePermissions(roleId, roleName) {
  managingRoleId = roleId;
  const roleNameEl = document.getElementById("managingRoleName");
  if (roleNameEl) roleNameEl.textContent = roleName;
  
  const role = allRoles.find((r) => r.id === roleId);
  const assignedIds = new Set((role?.permissions || []).map((p) => p.id));
  
  const tabAll = document.getElementById("rp-tab-all");
  if (tabAll) {
    bootstrap.Tab.getOrCreateInstance(tabAll).show();
  }
  renderPermissionCheckboxes(assignedIds);
}

function renderPermissionCheckboxes(assignedIds = new Set()) {
  const menuPerms = allPermissions.filter((p) => (p.type || "").toUpperCase() === "MENU");
  const apiPerms = allPermissions.filter((p) => (p.type || "").toUpperCase() === "API");

  const allCount = document.getElementById("rpAllCount");
  const menuCount = document.getElementById("rpMenuCount");
  const apiCount = document.getElementById("rpApiCount");

  if (allCount) allCount.textContent = allPermissions.length;
  if (menuCount) menuCount.textContent = menuPerms.length;
  if (apiCount) apiCount.textContent = apiPerms.length;

  function buildCheckboxSection(list) {
    if (!list.length) return '<p class="text-muted">No permissions in this category.</p>';
    const groups = {};
    list.forEach((p) => {
      const group = p.tag.split(":")[0];
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return Object.entries(groups).map(([group, perms]) => {
      const isMenuGroup = (perms[0]?.type || "").toUpperCase() === "MENU";
      return `
        <h6 class="text-uppercase text-muted fw-bold mb-2 mt-3"><i class="bi ${isMenuGroup ? "bi-layout-sidebar" : "bi-code-slash"} me-1"></i>${group}</h6>
        <div class="row mb-2">
          ${perms.map((p) => {
            const wl = p.isWhiteList === 1 || p.isWhiteList === true;
            return `<div class="col-md-4 mb-1">
              <div class="form-check">
                <input class="form-check-input perm-check" type="checkbox" id="pm_${p.id}" value="${p.id}" ${assignedIds.has(p.id) ? "checked" : ""} />
                <label class="form-check-label" for="pm_${p.id}">
                  <code>${p.tag}</code>
                  ${wl ? '<span class="badge text-bg-success ms-1" style="font-size:0.6rem">Public</span>' : ""}
                  ${p.method ? `<span class="badge ms-1" style="font-size:0.6rem;background:#6c757d;color:#fff">${p.method}</span>` : ""}
                </label>
                ${p.name ? `<small class="d-block text-muted" style="font-size:0.7rem">${p.name}</small>` : ""}
              </div>
            </div>`;
          }).join("")}
        </div><hr/>`;
    }).join("");
  }

  const allContent = document.getElementById("rp-all-content");
  const menuContent = document.getElementById("rp-menu-content");
  const apiContent = document.getElementById("rp-api-content");

  if (allContent) allContent.innerHTML = buildCheckboxSection(allPermissions);
  if (menuContent) menuContent.innerHTML = buildCheckboxSection(menuPerms);
  if (apiContent) apiContent.innerHTML = buildCheckboxSection(apiPerms);
}

async function deleteRole(id) {
  if (!await UI.confirm("Delete this role?")) return;
  try {
    await RoleService.delete(id);
    UI.toast("Role deleted.");
    loadRoles();
  } catch (err) {
    UI.toast(err.message, "danger");
  }
}

async function loadRoles() {
  try {
    allRoles = (await RoleService.getAll()) || [];
    refreshRolesList();
  } catch (err) {
    UI.toast("Failed to load roles: " + err.message, "danger");
  }
}

// Gán vào window
window.openEditRole = openEditRole;
window.openManagePermissions = openManagePermissions;
window.deleteRole = deleteRole;

document.addEventListener("DOMContentLoaded", async function () {
  UI.initSidebar();

  // Add role form
  const addRoleForm = document.getElementById("addRoleForm");
  if (addRoleForm) {
    addRoleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        await RoleService.create({
          name: document.getElementById("roleName").value.trim().toUpperCase(),
          description: document.getElementById("roleDescription").value.trim(),
        });
        UI.toast("Role created.");
        bootstrap.Modal.getInstance(document.getElementById("addRoleModal"))?.hide();
        this.reset();
        loadRoles();
      } catch (err) { UI.toast(err.message, "danger"); }
    });
  }

  // Edit role form
  const editRoleForm = document.getElementById("editRoleForm");
  if (editRoleForm) {
    editRoleForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        await RoleService.update(editingRoleId, {
          name: document.getElementById("editRoleName").value.trim().toUpperCase(),
          description: document.getElementById("editRoleDescription").value.trim(),
        });
        UI.toast("Role updated.");
        bootstrap.Modal.getInstance(document.getElementById("editRoleModal"))?.hide();
        loadRoles();
      } catch (err) { UI.toast(err.message, "danger"); }
    });
  }

  // Search
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      rCurrentPage = 1;
      refreshRolesList();
    });
  }

  // Select All / Clear All
  const btnSelectAll = document.getElementById("btnSelectAll");
  if (btnSelectAll) {
    btnSelectAll.addEventListener("click", () => {
      document.querySelectorAll(".perm-check").forEach((cb) => (cb.checked = true));
    });
  }
  const btnSelectNone = document.getElementById("btnSelectNone");
  if (btnSelectNone) {
    btnSelectNone.addEventListener("click", () => {
      document.querySelectorAll(".perm-check").forEach((cb) => (cb.checked = false));
    });
  }

  // Save permissions
  const btnSavePermissions = document.getElementById("btnSavePermissions");
  if (btnSavePermissions) {
    btnSavePermissions.addEventListener("click", async function () {
      const selected = [...new Set([...document.querySelectorAll(".perm-check:checked")].map((cb) => Number(cb.value)))];
      try {
        await RoleService.assignPermissions(managingRoleId, selected);
        UI.toast("Permissions saved successfully.");
        bootstrap.Modal.getInstance(document.getElementById("managePermissionsModal"))?.hide();
        loadRoles();
      } catch (err) { UI.toast(err.message, "danger"); }
    });
  }

  try {
    allPermissions = (await PermissionService.getAll()) || [];
  } catch (_) {}
  await loadRoles();
  await UI.renderCurrentUser();
});
