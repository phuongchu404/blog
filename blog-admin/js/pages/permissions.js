/**
 * Permissions Page Logic
 */

let allPermissions = [];
let editingPermId = null;
let permCurrentPage = 1;
const permPageSize = 10;

const groupColors = {
  user: "bg-primary",
  role: "bg-danger",
  post: "bg-success",
  category: "bg-info text-dark",
  tag: "bg-warning text-dark",
  permission: "bg-indigo text-white",
  comment: "bg-purple text-white",
  setting: "bg-teal text-white",
  auth: "bg-dark text-white",
};

const groupIcons = {
  user: "bi-people",
  role: "bi-shield-lock",
  post: "bi-file-earmark-text",
  category: "bi-folder",
  tag: "bi-tags",
  permission: "bi-key",
  comment: "bi-chat-dots",
  setting: "bi-gear",
  auth: "bi-lock",
};

function methodClass(m) {
  switch ((m || "").toUpperCase()) {
    case "GET": return "bg-success-subtle text-success border border-success-subtle";
    case "POST": return "bg-primary-subtle text-primary border border-primary-subtle";
    case "PUT": return "bg-info-subtle text-info border border-info-subtle";
    case "DELETE": return "bg-danger-subtle text-danger border border-danger-subtle";
    default: return "bg-secondary-subtle text-secondary border border-secondary-subtle";
  }
}

function methodLabel(m) {
  return `<small class="fw-bold">${(m || "ANY").toUpperCase()}</small>`;
}

function buildTableRow(p, idx) {
  const wl = p.isWhiteList === 1 || p.isWhiteList === true;
  const accessBadge = wl
    ? '<span class="badge text-bg-success whitelist-badge"><i class="bi bi-unlock"></i> Public</span>'
    : '<span class="badge text-bg-secondary whitelist-badge"><i class="bi bi-lock"></i> Auth</span>';

  return `
    <tr>
      <td>${idx + 1}</td>
      <td><code>${p.name}</code></td>
      <td><span class="badge ${p.type === "MENU" ? "text-bg-warning" : "text-bg-primary"}">${p.type}</span></td>
      <td><small class="fw-bold text-muted">${p.tag || "—"}</small></td>
      <td><span class="method-badge ${methodClass(p.method)}">${methodLabel(p.method)}</span></td>
      <td><code class="text-muted small">${p.pattern || "—"}</code></td>
      <td>${accessBadge}</td>
      <td>
        <button class="btn btn-xs btn-warning me-1" onclick="openEditPerm(${p.id})" data-bs-toggle="modal" data-bs-target="#editPermissionModal"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-xs btn-danger" onclick="deletePerm(${p.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
}

function buildGroupCards(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">No permissions found.</div>';
    return;
  }
  const groups = {};
  list.forEach((p) => {
    const g = p.tag.split(":")[0];
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  });

  container.innerHTML = Object.entries(groups).map(([group, perms]) => {
    const colorRaw = groupColors[group] || "bg-secondary";
    const colorClass = colorRaw.includes("text-dark") ? colorRaw : colorRaw + " text-white";
    const icon = groupIcons[group] || "bi-key";
    const isMenu = perms[0]?.type === "MENU";

    return `
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header ${colorClass}">
            <h3 class="card-title text-capitalize"><i class="bi ${icon} me-2"></i>${group}</h3>
            <div class="card-tools"><span class="badge bg-white text-dark">${perms.length}</span></div>
          </div>
          <div class="card-body p-0">
            <table class="table table-sm table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 130px">Permission</th>
                  <th>Tag</th>
                  ${isMenu ? "<th>Route</th>" : "<th>Method</th><th>Pattern</th>"}
                  <th>Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${perms.map((p) => {
      const wl = p.isWhiteList === 1 || p.isWhiteList === true;
      const accessBadge = wl
        ? '<span class="badge text-bg-success whitelist-badge"><i class="bi bi-unlock"></i> Public</span>'
        : '<span class="badge text-bg-secondary whitelist-badge"><i class="bi bi-lock"></i> Auth</span>';
      if (isMenu) {
        return `<tr>
                      <td><code>${p.name}</code></td>
                      <td><small>${p.tag || "—"}</small></td>
                      <td><code class="text-muted small">${p.pattern || "—"}</code></td>
                      <td>${accessBadge}</td>
                      <td>
                        <button class="btn btn-xs btn-warning me-1" onclick="openEditPerm(${p.id})" data-bs-toggle="modal" data-bs-target="#editPermissionModal"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-xs btn-danger" onclick="deletePerm(${p.id})"><i class="bi bi-trash"></i></button>
                      </td>
                    </tr>`;
      } else {
        return `<tr>
                      <td><code>${p.name}</code></td>
                      <td><small>${p.tag || "—"}</small></td>
                      <td><span class="method-badge ${methodClass(p.method)}">${methodLabel(p.method)}</span></td>
                      <td><code class="text-muted small">${p.pattern || "—"}</code></td>
                      <td>${accessBadge}</td>
                      <td>
                        <button class="btn btn-xs btn-warning me-1" onclick="openEditPerm(${p.id})" data-bs-toggle="modal" data-bs-target="#editPermissionModal"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-xs btn-danger" onclick="deletePerm(${p.id})"><i class="bi bi-trash"></i></button>
                      </td>
                    </tr>`;
      }
    }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderPermissions(list) {
  const menuList = list.filter((p) => (p.type || "").toUpperCase() === "MENU");
  const apiList = list.filter((p) => (p.type || "").toUpperCase() === "API");

  const statMenu = document.getElementById("statMenu");
  const statApi = document.getElementById("statApi");
  const tabMenuCount = document.getElementById("tabMenuCount");
  const tabApiCount = document.getElementById("tabApiCount");
  const allCountBadge = document.getElementById("allCountBadge");

  if (statMenu) statMenu.textContent = `MENU: ${menuList.length}`;
  if (statApi) statApi.textContent = `API: ${apiList.length}`;
  if (tabMenuCount) tabMenuCount.textContent = menuList.length;
  if (tabApiCount) tabApiCount.textContent = apiList.length;
  if (allCountBadge) allCountBadge.textContent = `${list.length} total`;

  const totalPages = Math.ceil(list.length / permPageSize) || 1;
  if (permCurrentPage > totalPages) permCurrentPage = totalPages;
  const start = (permCurrentPage - 1) * permPageSize;
  const pagedList = list.slice(start, start + permPageSize);

  const tbody = document.getElementById("all-tbody");
  if (tbody) {
    if (!pagedList.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No permissions found.</td></tr>';
    } else {
      tbody.innerHTML = pagedList.map((p, i) => buildTableRow(p, start + i)).join("");
    }
  }

  renderPermPagination(list.length, totalPages);
  buildGroupCards(menuList, "menu-groups-container");
  buildGroupCards(apiList, "api-groups-container");
}

function renderPermPagination(total, totalPages) {
  const ul = document.getElementById("perm-pagination");
  if (!ul) return;
  if (total === 0 || totalPages <= 1) {
    ul.innerHTML = '';
    return;
  }
  let html = `<li class="page-item ${permCurrentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePermPage(1, event)">«</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${permCurrentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePermPage(${i}, event)">${i}</a></li>`;
  }
  html += `<li class="page-item ${permCurrentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePermPage(${totalPages}, event)">»</a></li>`;
  ul.innerHTML = html;
}

function changePermPage(page, e) {
  if (e) e.preventDefault();
  permCurrentPage = page;
  renderPermissions(getFilteredList());
}

function openEditPerm(id) {
  const p = allPermissions.find((x) => x.id === id);
  if (!p) return;
  editingPermId = id;
  document.getElementById("editPermName").value = p.name || "";
  document.getElementById("editPermType").value = (p.type || "API").toUpperCase();
  document.getElementById("editPermTag").value = p.tag || "";
  document.getElementById("editPermPattern").value = p.pattern || "";
  document.getElementById("editPermMethod").value = p.method || "";
  document.getElementById("editPermIsWhiteList").checked = p.isWhiteList === 1 || p.isWhiteList === true;
}

async function deletePerm(id) {
  if (!await UI.confirm("Delete this permission?")) return;
  try {
    await PermissionService.delete(id);
    UI.toast("Permission deleted.");
    allPermissions = allPermissions.filter((p) => p.id !== id);
    renderPermissions(allPermissions);
  } catch (err) {
    UI.toast(err.message, "danger");
  }
}

async function loadPermissions() {
  try {
    const data = await PermissionService.getAll();
    allPermissions = Array.isArray(data) ? data : [];
    renderPermissions(allPermissions);
  } catch (err) {
    UI.toast("Failed to load permissions: " + err.message, "danger");
  }
}

function getFilteredList() {
  const kw = document.getElementById("searchInput").value.toLowerCase();
  const grp = document.getElementById("filterGroup").value;
  return allPermissions.filter((p) => {
    const matchKw = !kw || p.tag.toLowerCase().includes(kw) || (p.name || "").toLowerCase().includes(kw);
    const matchGrp = !grp || p.tag.startsWith(grp + ":") || (grp === "menu" && (p.type || "").toUpperCase() === "MENU");
    return matchKw && matchGrp;
  });
}

// Gán window
window.changePermPage = changePermPage;
window.openEditPerm = openEditPerm;
window.deletePerm = deletePerm;

document.addEventListener("DOMContentLoaded", async function () {
  UI.initSidebar();

  const filterGrp = document.getElementById("filterGroup");
  if (filterGrp) {
    filterGrp.addEventListener("change", () => {
      permCurrentPage = 1;
      renderPermissions(getFilteredList());
    });
  }
  const searchInp = document.getElementById("searchInput");
  if (searchInp) {
    searchInp.addEventListener("input", () => {
      permCurrentPage = 1;
      renderPermissions(getFilteredList());
    });
  }

  const addForm = document.getElementById("addPermissionForm");
  if (addForm) {
    addForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const type = document.getElementById("permType").value;
      if (!type) { UI.toast("Please select a type (MENU or API).", "warning"); return; }
      try {
        await PermissionService.create({
          name: document.getElementById("permName").value.trim(),
          tag: document.getElementById("permTag").value.trim(),
          type: type,
          method: type === "API" ? document.getElementById("permMethod").value || null : null,
          pattern: document.getElementById("permPattern").value.trim() || null,
          isWhiteList: document.getElementById("permIsWhiteList").checked ? 1 : 0,
        });
        UI.toast("Permission created successfully.");
        bootstrap.Modal.getInstance(document.getElementById("addPermissionModal"))?.hide();
        this.reset();
        loadPermissions();
      } catch (err) { UI.toast(err.message, "danger"); }
    });
  }

  const editForm = document.getElementById("editPermissionForm");
  if (editForm) {
    editForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        const type = document.getElementById("editPermType").value;
        await PermissionService.update(editingPermId, {
          name: document.getElementById("editPermName").value.trim(),
          tag: document.getElementById("editPermTag").value.trim(),
          type: type,
          method: type === "API" ? document.getElementById("editPermMethod").value || null : null,
          pattern: document.getElementById("editPermPattern").value.trim() || null,
          isWhiteList: document.getElementById("editPermIsWhiteList").checked ? 1 : 0,
        });
        UI.toast("Permission updated successfully.");
        bootstrap.Modal.getInstance(document.getElementById("editPermissionModal"))?.hide();
        loadPermissions();
      } catch (err) { UI.toast(err.message, "danger"); }
    });
  }

  await loadPermissions();
  await UI.renderCurrentUser();
});
