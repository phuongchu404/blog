/**
 * Users Page Logic
 */

let allUsers = [];

const roleColors = {
  ADMIN:     'text-bg-danger',
  MODERATOR: 'text-bg-primary',
  AUTHOR:    'text-bg-info',
  USER:      'text-bg-secondary',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderUsers(list) {
  const tbody   = document.getElementById('users-tbody');
  const countEl = document.getElementById('users-count-badge');
  if (countEl) countEl.textContent = `${list.length} total`;

  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No users found.</td></tr>';
    return;
  }

  if (tbody) {
    tbody.innerHTML = list.map(u => {
      const roles  = (u.roles || []).map(r => `<span class="badge ${roleColors[r] || 'text-bg-secondary'} me-1">${r}</span>`).join('') || '<span class="text-muted">—</span>';
      const avatar = u.avatarUrl
        ? `<img src="${u.avatarUrl}" class="rounded-circle me-2" width="36" height="36" alt="${u.username}" />`
        : `<div class="rounded-circle bg-secondary me-2 d-flex align-items-center justify-content-center" style="width:36px;height:36px;flex-shrink:0"><i class="bi bi-person text-white"></i></div>`;
      return `
        <tr>
          <td><input type="checkbox" class="form-check-input" /></td>
          <td><div class="d-flex align-items-center">${avatar}<strong>${u.username || u.name || '—'}</strong></div></td>
          <td>${u.email || '—'}</td>
          <td>${roles}</td>
          <td>${u.postCount ?? 0}</td>
          <td><span class="badge ${u.enabled !== false ? 'text-bg-success' : 'text-bg-warning text-dark'}">${u.enabled !== false ? 'Active' : 'Inactive'}</span></td>
          <td>${UI.formatDate(u.createdAt)}</td>
          <td>
            <button class="btn btn-sm btn-warning" title="Edit" onclick="editUser(${u.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" title="Delete" onclick="deleteUser(${u.id})"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
    }).join('');
  }
}

// ── Load dữ liệu từ server ─────────────────────────────────────────────────────

async function loadUsers() {
  try {
    const data = await UserService.getAll();
    allUsers = isPageResponse(data) ? data.content : (Array.isArray(data) ? data : (data.content ?? []));
    renderUsers(allUsers);
  } catch (err) {
    UI.toast('Failed to load users: ' + err.message, 'danger');
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

function editUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;
  const modalEl = document.getElementById('addUserModal');
  if (!modalEl) return;

  modalEl.dataset.editId = id;
  const titleEl = document.getElementById('addUserModalLabel');
  if (titleEl) titleEl.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit User';

  document.getElementById('newUserName').value     = user.username || user.name || '';
  document.getElementById('newUserEmail').value    = user.email || '';
  document.getElementById('newUserPassword').placeholder = '(leave empty to keep current)';

  const roleSel = document.getElementById('newUserRole');
  if (roleSel) roleSel.value = (user.roles?.[0] || '').toLowerCase();

  new bootstrap.Modal(modalEl).show();
}

async function deleteUser(id) {
  if (!await UI.confirm('Delete this user?')) return;
  try {
    await UserService.delete(id);
    UI.toast('User deleted.');
    allUsers = allUsers.filter(u => u.id !== id);
    renderUsers(allUsers);
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

// Gán các hàm vào window để gọi từ HTML
window.editUser   = editUser;
window.deleteUser = deleteUser;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // Filter by role
  const filterRole = document.getElementById('filterRole');
  if (filterRole) {
    filterRole.addEventListener('change', function () {
      const role    = this.value.toUpperCase();
      const filtered = role
        ? allUsers.filter(u => (u.roles || []).some(r => r.toUpperCase() === role))
        : allUsers;
      renderUsers(filtered);
    });
  }

  // Search
  const searchInput = document.querySelector('.input-group input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const kw = this.value.trim().toLowerCase();
      if (!kw) { renderUsers(allUsers); return; }
      renderUsers(allUsers.filter(u =>
        (u.username || '').toLowerCase().includes(kw) ||
        (u.email || '').toLowerCase().includes(kw)
      ));
    });
  }

  // Create / update user form
  const addForm = document.getElementById('addUserForm');
  if (addForm) {
    addForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const modalEl = document.getElementById('addUserModal');
      const editId  = modalEl.dataset.editId;
      const payload = {
        username: document.getElementById('newUserName').value.trim(),
        email:    document.getElementById('newUserEmail').value.trim(),
      };
      const password = document.getElementById('newUserPassword').value;
      if (password) payload.password = password;
      try {
        if (editId) {
          await UserService.update(Number(editId), payload);
          UI.toast('User updated.');
          delete modalEl.dataset.editId;
        } else {
          await Http.post('/auth/register', { ...payload, password });
          UI.toast('User created.');
        }
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        await loadUsers();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Load roles into filter + modal dropdown
  try {
    const roles   = await Http.get('/api/roles') || [];
    const filterSel = document.getElementById('filterRole');
    const modalSel  = document.getElementById('newUserRole');
    if (filterSel && modalSel) {
      roles.forEach(r => {
        filterSel.insertAdjacentHTML('beforeend', `<option value="${r.name}">${r.name}</option>`);
        modalSel.insertAdjacentHTML('beforeend',  `<option value="${r.name}">${r.name}</option>`);
      });
    }
  } catch (_) {}

  await loadUsers();
  await UI.renderCurrentUser();
});
