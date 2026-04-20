/**
 * Users Page Logic
 */

let allUsers = [];
let filteredUsers = [];
let membershipExpiredAtPicker = null;

const PAGE_SIZE = 10;
const WINDOW_SIZE = 3;

const state = {
  currentPage: 0,
  membershipFilter: 'all',
  roleFilter: '',
  keyword: '',
};

const roleColors = {
  ADMIN: 'text-bg-danger',
  MODERATOR: 'text-bg-primary',
  AUTHOR: 'text-bg-info',
  USER: 'text-bg-secondary',
};

function isPageResponse(data) {
  return data && Array.isArray(data.content) && typeof data.totalPages === 'number';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

function getFilteredUsers() {
  const keyword = state.keyword.trim().toLowerCase();

  return allUsers.filter((user) => {
    const matchesMembership =
      state.membershipFilter === 'all' ||
      (state.membershipFilter === 'pending' && user.membershipStatus === 2) ||
      (state.membershipFilter === 'active' && user.membershipStatus === 1);

    const matchesRole =
      !state.roleFilter ||
      (user.roles || []).some((role) => String(role).toUpperCase() === state.roleFilter);

    const matchesKeyword =
      !keyword ||
      String(user.username || user.name || '').toLowerCase().includes(keyword) ||
      String(user.email || '').toLowerCase().includes(keyword);

    return matchesMembership && matchesRole && matchesKeyword;
  });
}

function membershipBadge(user) {
  if (user.membershipStatus === 1) {
    const untilStr = user.membershipExpiredAt ? ` <small class="text-muted">${I18n.t('users_dyn.membership_until').replace('{date}', UI.formatDateShort(user.membershipExpiredAt))}</small>` : '';
    return `<span class="badge text-bg-success"><i class="bi bi-patch-check-fill me-1"></i>${I18n.t('users_dyn.membership_active')}</span>${untilStr}`;
  }

  if (user.membershipStatus === 2) {
    return `<span class="badge text-bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>${I18n.t('users_dyn.membership_pending')}</span>`;
  }

  return `<span class="badge text-bg-secondary">${I18n.t('users_dyn.membership_none')}</span>`;
}

function renderPagination(totalPages) {
  const container = document.getElementById('users-pagination');
  if (!container) return;

  let html = '<ul class="pagination pagination-sm m-0 float-end">';

  html += `<li class="page-item ${state.currentPage === 0 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${state.currentPage - 1}">«</a>
  </li>`;

  const windowStart = Math.max(0, state.currentPage - Math.floor(WINDOW_SIZE / 2));
  const windowEnd = Math.min(totalPages - 1, windowStart + WINDOW_SIZE - 1);
  const adjStart = Math.max(0, windowEnd - WINDOW_SIZE + 1);

  if (adjStart > 0) {
    html += '<li class="page-item"><a class="page-link" href="#" data-page="0">1</a></li>';
    if (adjStart > 1) {
      html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
    }
  }

  for (let i = adjStart; i <= windowEnd; i++) {
    html += `<li class="page-item ${i === state.currentPage ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
    </li>`;
  }

  if (windowEnd < totalPages - 1) {
    if (windowEnd < totalPages - 2) {
      html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${state.currentPage >= totalPages - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${state.currentPage + 1}">»</a>
  </li>`;

  html += '</ul>';
  container.innerHTML = html;

  container.querySelectorAll('.page-link[data-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = Number(link.dataset.page);
      if (page >= 0 && page < totalPages) {
        state.currentPage = page;
        renderUsersPage();
      }
    });
  });
}

function renderUsersPage() {
  const tbody = document.getElementById('users-tbody');
  const countEl = document.getElementById('users-count-badge');
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  if (state.currentPage >= totalPages) state.currentPage = 0;

  if (countEl) countEl.textContent = `${filteredUsers.length} ${I18n.t('users_dyn.total')}`;
  if (!tbody) return;

  if (!filteredUsers.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">${I18n.t('users_dyn.no_users')}</td></tr>`;
    renderPagination(totalPages);
    return;
  }

  const start = state.currentPage * PAGE_SIZE;
  const items = filteredUsers.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = items.map((user) => {
    const displayName = user.username || user.name || '—';
    const roles = (user.roles || [])
      .map((role) => `<span class="badge ${roleColors[role] || 'text-bg-secondary'} me-1">${role}</span>`)
      .join('') || '<span class="text-muted">—</span>';

    const avatar = user.imageUrl
      ? `<img src="${user.imageUrl}" class="rounded-circle me-2" width="36" height="36" alt="${escapeHtml(displayName)}" />`
      : '<div class="rounded-circle bg-secondary me-2 d-flex align-items-center justify-content-center" style="width:36px;height:36px;flex-shrink:0"><i class="bi bi-person text-white"></i></div>';

    let memberBtn = '';
    if (user.membershipStatus === 1) {
      memberBtn = `<button class="btn btn-sm btn-outline-secondary" title="${I18n.t('users_dyn.revoke_title')}" onclick="revokeMembership(${user.id})"><i class="bi bi-patch-minus"></i></button>`;
    } else if (user.membershipStatus === 2) {
      memberBtn = `
        <button class="btn btn-sm btn-success" title="${I18n.t('users_dyn.approve_title')}" onclick="openGrantMembership(${user.id}, '${escapeHtml(displayName)}')"><i class="bi bi-check-lg"></i></button>
        <button class="btn btn-sm btn-outline-danger" title="${I18n.t('users_dyn.reject_title')}" onclick="revokeMembership(${user.id})"><i class="bi bi-x-lg"></i></button>`;
    } else {
      memberBtn = `<button class="btn btn-sm btn-outline-warning" title="${I18n.t('users_dyn.grant_title')}" onclick="openGrantMembership(${user.id}, '${escapeHtml(displayName)}')"><i class="bi bi-patch-check"></i></button>`;
    }

    return `
      <tr>
        <td><input type="checkbox" class="form-check-input" /></td>
        <td><div class="d-flex align-items-center">${avatar}<strong>${escapeHtml(displayName)}</strong></div></td>
        <td>${escapeHtml(user.email || '—')}</td>
        <td>${roles}</td>
        <td>${user.postCount ?? 0}</td>
        <td><span class="badge ${user.enabled !== false ? 'text-bg-success' : 'text-bg-warning text-dark'}">${user.enabled !== false ? I18n.t('users_dyn.status_active') : I18n.t('users_dyn.status_inactive')}</span></td>
        <td>${membershipBadge(user)}</td>
        <td>${UI.formatDate(user.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-warning" title="${I18n.t('common.edit')}" onclick="editUser(${user.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-info text-white" title="${I18n.t('users_dyn.reset_title')}" onclick="resetPassword(${user.id})"><i class="bi bi-key"></i></button>
          ${memberBtn}
          <button class="btn btn-sm btn-danger" title="${I18n.t('common.delete')}" onclick="deleteUser(${user.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
  }).join('');

  renderPagination(totalPages);
}

function updateMembershipButtons() {
  const activeButtonId =
    state.membershipFilter === 'pending'
      ? 'filterPending'
      : state.membershipFilter === 'active'
        ? 'filterActive'
        : 'filterAll';

  document
    .querySelectorAll('#membership-filter-group .btn')
    .forEach((button) => button.classList.remove('active'));

  document.getElementById(activeButtonId)?.classList.add('active');
}

function applyFilters(resetPage = true) {
  if (resetPage) state.currentPage = 0;
  filteredUsers = getFilteredUsers();
  updateMembershipButtons();
  renderUsersPage();
}

function filterByMembership(type) {
  state.membershipFilter = type;
  applyFilters();
}

function updatePendingCount() {
  const count = allUsers.filter((user) => user.membershipStatus === 2).length;
  const badge = document.getElementById('pending-count');

  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

async function loadUsers() {
  try {
    const data = await UserService.getAll();
    allUsers = isPageResponse(data)
      ? data.content
      : Array.isArray(data)
        ? data
        : (data?.content || []);

    updatePendingCount();
    applyFilters(false);
  } catch (err) {
    UI.toast(I18n.t('users_dyn.load_failed') + err.message, 'danger');
  }
}

function editUser(id) {
  const user = allUsers.find((item) => item.id === id);
  if (!user) return;

  const modalEl = document.getElementById('addUserModal');
  if (!modalEl) return;

  modalEl.dataset.editId = id;
  document.getElementById('addUserModalLabel').innerHTML = I18n.t('users_dyn.edit_title');
  const submitBtn = document.querySelector('button[form="addUserForm"]');
  if (submitBtn) submitBtn.innerHTML = I18n.t('users_dyn.btn_update');
  document.getElementById('newUserUsername').value = user.username || '';
  document.getElementById('newUserFullName').value = user.fullName || user.name || '';
  document.getElementById('newUserEmail').value = user.email || '';
  document.getElementById('newUserPassword').value = '';
  document.getElementById('newUserConfirmPassword').value = '';
  document.getElementById('newUserAvatarUrl').value = user.imageUrl || '';
  document.getElementById('previewAvatar').src = user.imageUrl || '../assets/images/user2-160x160.jpg';
  document.getElementById('newUserPassword').placeholder = I18n.t('users_dyn.pw_keep');
  document.getElementById('newUserPassword').required = false;

  const roleSel = document.getElementById('newUserRole');
  if (roleSel) {
    const selectedRole = user.roles?.[0] || '';
    const matchedOption = Array.from(roleSel.options).find((option) =>
      option.dataset.roleName === selectedRole || option.textContent.trim() === selectedRole
    );
    roleSel.value = matchedOption?.value || '';
  }

  new bootstrap.Modal(modalEl).show();
}

async function deleteUser(id) {
  if (!await UI.confirm(I18n.t('users_dyn.delete_confirm'))) return;

  try {
    await UserService.delete(id);
    UI.toast(I18n.t('users_dyn.deleted'));

    allUsers = allUsers.filter((user) => user.id !== id);
    updatePendingCount();

    const remainingAfterDelete = filteredUsers.length - 1;
    const shouldStepBack = remainingAfterDelete > 0 && remainingAfterDelete <= state.currentPage * PAGE_SIZE;
    if (shouldStepBack && state.currentPage > 0) state.currentPage--;

    applyFilters(false);
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

let membershipTargetId = null;

function openGrantMembership(userId, username) {
  membershipTargetId = userId;
  const nameEl = document.getElementById('membershipUserName');
  const expEl = document.getElementById('membershipExpiredAt');

  if (nameEl) nameEl.textContent = username;
  if (membershipExpiredAtPicker) membershipExpiredAtPicker.setDate(null);
  else if (expEl) expEl.value = '';

  new bootstrap.Modal(document.getElementById('membershipModal')).show();
}

async function grantMembership() {
  if (!membershipTargetId) return;

  const expVal = document.getElementById('membershipExpiredAt')?.value;
  const payload = expVal ? { expiredAt: expVal } : {};

  try {
    await Http.put(`/api/users/${membershipTargetId}/membership`, payload);
    UI.toast(I18n.t('users_dyn.grant_success'), 'success');
    bootstrap.Modal.getInstance(document.getElementById('membershipModal'))?.hide();
    await loadUsers();
  } catch (err) {
    UI.toast(I18n.t('users_dyn.error_prefix') + err.message, 'danger');
  }
}

async function revokeMembership(userId) {
  if (!await UI.confirm(I18n.t('users_dyn.revoke_confirm'))) return;

  try {
    await Http.delete(`/api/users/${userId}/membership`);
    UI.toast(I18n.t('users_dyn.revoked'), 'success');
    await loadUsers();
  } catch (err) {
    UI.toast(I18n.t('users_dyn.error_prefix') + err.message, 'danger');
  }
}

async function resetPassword(id) {
  if (!await UI.confirm(I18n.t('users_dyn.reset_confirm'))) return;
  try {
    await Http.post(`/api/users/${id}/reset-password`);
    UI.toast(I18n.t('users_dyn.reset_success'), 'success');
  } catch (err) {
    UI.toast(I18n.t('users_dyn.error_prefix') + err.message, 'danger');
  }
}

window.editUser = editUser;
window.deleteUser = deleteUser;
window.openGrantMembership = openGrantMembership;
window.revokeMembership = revokeMembership;
window.filterByMembership = filterByMembership;
window.grantMembership = grantMembership;
window.resetPassword = resetPassword;

function resetAddUserModal() {
  const modalEl = document.getElementById('addUserModal');
  if (!modalEl) return;

  delete modalEl.dataset.editId;
  document.getElementById('addUserModalLabel').innerHTML = I18n.t('users_dyn.btn_add_modal_title');
  const submitBtn = document.querySelector('button[form="addUserForm"]');
  if (submitBtn) submitBtn.innerHTML = I18n.t('users_dyn.btn_create');
  document.getElementById('newUserUsername').value = '';
  document.getElementById('newUserFullName').value = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserRole').value = '';
  document.getElementById('newUserPassword').value = '';
  document.getElementById('newUserConfirmPassword').value = '';
  document.getElementById('newUserAvatarUrl').value = '';
  document.getElementById('previewAvatar').src = '../assets/images/user2-160x160.jpg';
  document.getElementById('newUserPassword').required = true;
  document.getElementById('newUserPassword').placeholder = I18n.t('users.label_password');
}

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  const filterRole = document.getElementById('filterRole');
  const searchInput = document.getElementById('users-search');
  const refreshBtn = document.getElementById('users-refresh-btn');
  const addForm = document.getElementById('addUserForm');
  const membershipExpiredAtInput = document.getElementById('membershipExpiredAt');
  const membershipExpiredAtToggle = document.getElementById('membershipExpiredAtToggle');

  if (membershipExpiredAtInput) {
    setDatetimeLocale('en-us');
    createDatetimeTemplate();
    membershipExpiredAtPicker = createDatetimePicker(
      membershipExpiredAtInput,
      null,
      null,
      {
        format: 'YYYY-MM-DD HH:mm',
        showTime: true,
        use24Hour: true,
        startDay: 1,
      }
    );
    membershipExpiredAtInput.addEventListener('click', () => membershipExpiredAtPicker.open());
    membershipExpiredAtToggle?.remove();
  }

  filterRole?.addEventListener('change', function () {
    state.roleFilter = String(this.value || '').toUpperCase();
    applyFilters();
  });

  searchInput?.addEventListener('input', function () {
    state.keyword = this.value || '';
    applyFilters();
  });

  refreshBtn?.addEventListener('click', async () => {
    state.currentPage = 0;
    state.keyword = '';
    state.roleFilter = '';
    state.membershipFilter = 'all';

    if (searchInput) searchInput.value = '';
    if (filterRole) filterRole.value = '';

    await loadUsers();
  });

  addForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const modalEl = document.getElementById('addUserModal');
    const editId = modalEl.dataset.editId;
    const selectedRoleId = Number(document.getElementById('newUserRole').value || 0);
    const payload = {
      username: document.getElementById('newUserUsername').value.trim(),
      fullName: document.getElementById('newUserFullName').value.trim() || null,
      email: document.getElementById('newUserEmail').value.trim(),
    };
    const password = document.getElementById('newUserPassword').value;
    const confirmPassword = document.getElementById('newUserConfirmPassword').value;

    if (password && password !== confirmPassword) {
      UI.toast(I18n.t('users_dyn.password_mismatch'), 'warning');
      return;
    }

    const imageUrl = document.getElementById('newUserAvatarUrl').value;
    if (imageUrl) payload.imageUrl = imageUrl;

    if (password) payload.password = password;

    try {
      if (editId) {
        await UserService.update(Number(editId), payload);
        if (selectedRoleId) {
          await Http.post(`/api/users/${Number(editId)}/roles`, [selectedRoleId]);
        }
        UI.toast(I18n.t('users_dyn.updated'));
        delete modalEl.dataset.editId;
        // Nếu admin vừa sửa chính mình thì cập nhật lại header avatar/tên
        await UI.renderCurrentUser();
      } else {
        const createdUser = await Http.post('/auth/register', { ...payload, password });
        if (selectedRoleId && createdUser?.id) {
          await Http.post(`/api/users/${createdUser.id}/roles`, [selectedRoleId]);
        }
        UI.toast(I18n.t('users_dyn.created'));
      }

      bootstrap.Modal.getInstance(modalEl)?.hide();
      resetAddUserModal();
      await loadUsers();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  });

  try {
    const roles = await Http.get('/api/roles') || [];
    const filterSel = document.getElementById('filterRole');
    const modalSel = document.getElementById('newUserRole');

    if (filterSel && modalSel) {
      roles.forEach((role) => {
        filterSel.insertAdjacentHTML('beforeend', `<option value="${role.name}">${role.name}</option>`);
        modalSel.insertAdjacentHTML('beforeend', `<option value="${role.id}" data-role-name="${role.name}">${role.name}</option>`);
      });
    }
  } catch (_) { }

  document.getElementById('addUserModal')?.addEventListener('hidden.bs.modal', function () {
    resetAddUserModal();
  });

  document.getElementById('addUserModal')?.addEventListener('show.bs.modal', function () {
    if (!this.dataset.editId) {
      resetAddUserModal();
    }
  });

  const avatarInput = document.getElementById('newUserAvatar');
  avatarInput?.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('upload', file);
    formData.append('folder', 'blog/avatars');

    try {
      const data = await Http.upload('/api/files/upload', formData);

      document.getElementById('newUserAvatarUrl').value = data.path;
      document.getElementById('previewAvatar').src = data.url;
      UI.toast(I18n.t('users_dyn.upload_success'), 'success');
    } catch (err) {
      UI.toast(I18n.t('users_dyn.upload_error') + err.message, 'danger');
    }
  });

  await loadUsers();
  await UI.renderCurrentUser();
});
