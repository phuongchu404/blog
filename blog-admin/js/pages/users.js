/**
 * Users Page Logic
 */

let allUsers = [];

function renderUsers(list) {
  const tbody = document.getElementById('users-tbody');
  const countEl = document.querySelector('.card-tools .badge');
  if (countEl) countEl.textContent = list.length + ' total';
  
  if (!list.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No users found.</td></tr>';
    return;
  }
  
  if (tbody) {
    tbody.innerHTML = list.map(u => `
      <tr>
        <td><input type="checkbox" class="form-check-input" /></td>
        <td>
          <div class="d-flex align-items-center">
            <img src="${u.imageUrl || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" width="32" height="32" alt="Avatar" />
            <div>
              <div class="fw-bold text-dark">${u.username || '—'}</div>
              <small class="text-muted">${u.email || '—'}</small>
            </div>
          </div>
        </td>
        <td>
          ${(u.roles || []).map(r => `<span class="badge text-bg-primary me-1">${r}</span>`).join('') || '—'}
        </td>
        <td><span class="badge text-bg-success">Active</span></td>
        <td>${UI.formatDate(u.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editUser(${u.id},'${u.username}','${u.email}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }
}

async function loadUsers() {
  try {
    const data = await UserService.getAll();
    allUsers = Array.isArray(data) ? data : (data.content ?? []);
    renderUsers(allUsers);
  } catch (err) {
    UI.toast('Failed to load users: ' + err.message, 'danger');
  }
}

function editUser(id, username, email) {
  const modalEl = document.getElementById('addUserModal');
  if (modalEl) {
    modalEl.dataset.editId = id;
    const titleEl = document.getElementById('addUserModalLabel');
    if (titleEl) titleEl.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit User';
    
    document.getElementById('newUserName').value = username;
    document.getElementById('newUserEmail').value = email;
    document.getElementById('newUserPassword').placeholder = '(leave empty to keep current)';
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

async function deleteUser(id) {
  if (!UI.confirm('Delete this user?')) return;
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
window.editUser = editUser;
window.deleteUser = deleteUser;

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // Filter by role
  const filterRole = document.getElementById('filterRole');
  if (filterRole) {
    filterRole.addEventListener('change', function () {
      const role = this.value.toUpperCase();
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
      const editId = modalEl.dataset.editId;
      const payload = {
        username: document.getElementById('newUserName').value.trim(),
        email: document.getElementById('newUserEmail').value.trim(),
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
        loadUsers();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // Load roles into filter + modal dropdown
  try {
    const roles = await Http.get('/api/roles') || [];
    const filterSel = document.getElementById('filterRole');
    const modalSel  = document.getElementById('newUserRole');
    if (filterSel && modalSel) {
      roles.forEach(r => {
        filterSel.insertAdjacentHTML('beforeend', `<option value="${r.name}">${r.name}</option>`);
        modalSel.insertAdjacentHTML('beforeend',  `<option value="${r.name}">${r.name}</option>`);
      });
    }
  } catch (_) { }

  await loadUsers();
  await UI.renderCurrentUser();
});
