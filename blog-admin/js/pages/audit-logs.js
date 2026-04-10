/**
 * Audit Logs Page Logic
 */

const ACTION_COLORS = {
  LOGIN:           'text-bg-info',
  LOGOUT:          'text-bg-secondary',
  REGISTER:        'text-bg-primary',
  CHANGE_PASSWORD: 'text-bg-warning text-dark',
  CREATE:          'text-bg-success',
  UPDATE:          'text-bg-primary',
  DELETE:          'text-bg-danger',
  PUBLISH:         'text-bg-success',
  UNPUBLISH:       'text-bg-secondary',
  APPROVE:         'text-bg-success',
  REJECT:          'text-bg-danger',
  UPLOAD:          'text-bg-info',
};

const RESOURCE_ICONS = {
  AUTH:       'bi-shield-lock',
  POST:       'bi-file-earmark-text',
  COMMENT:    'bi-chat-dots',
  CATEGORY:   'bi-tags',
  TAG:        'bi-hash',
  USER:       'bi-person',
  ROLE:       'bi-shield-check',
  PERMISSION: 'bi-key',
  FILE:       'bi-paperclip',
};

// ── State ──────────────────────────────────────────────────────────────────────

let currentPage = 0;
let totalPages  = 0;
let totalItems  = 0;

// ── Filters ────────────────────────────────────────────────────────────────────

function getFilters() {
  const dateFrom = document.getElementById('filter-date-from')?.value;
  const dateTo   = document.getElementById('filter-date-to')?.value;
  const params   = new URLSearchParams();

  const username = document.getElementById('filter-username')?.value.trim();
  const action   = document.getElementById('filter-action')?.value;
  const resource = document.getElementById('filter-resource')?.value;
  const status   = document.getElementById('filter-status')?.value;

  if (username) params.set('username', username);
  if (action)   params.set('action', action);
  if (resource) params.set('resource', resource);
  if (status)   params.set('status', status);
  if (dateFrom) params.set('dateFrom', dateFrom + ':00');
  if (dateTo)   params.set('dateTo', dateTo + ':00');

  return params;
}

function buildExportUrl() {
  const params = getFilters();
  return `/api/admin/audit-logs/export?${params.toString()}`;
}

// ── Render ─────────────────────────────────────────────────────────────────────

function renderLogs(page) {
  const tbody    = document.getElementById('audit-tbody');
  const countEl  = document.getElementById('audit-count-badge');
  const infoEl   = document.getElementById('audit-page-info');

  if (!page || !page.content?.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No logs found.</td></tr>';
    if (countEl) countEl.textContent = '0 total';
    if (infoEl) infoEl.textContent = '';
    renderPagination(0, 0);
    return;
  }

  totalPages = page.totalPages;
  totalItems = page.totalElements;

  if (countEl) countEl.textContent = `${totalItems} total`;
  if (infoEl) infoEl.textContent = `Page ${page.number + 1} of ${page.totalPages}`;

  if (tbody) {
    tbody.innerHTML = page.content.map(log => {
      const actionBadge   = `<span class="badge ${ACTION_COLORS[log.action] || 'text-bg-secondary'}">${log.action}</span>`;
      const resourceIcon  = RESOURCE_ICONS[log.resource] || 'bi-box';
      const resourceLabel = `<i class="bi ${resourceIcon} me-1"></i>${log.resource}`;
      const statusBadge   = log.status === 'SUCCESS'
        ? `<span class="badge text-bg-success">SUCCESS</span>`
        : `<span class="badge text-bg-danger" title="${log.errorMessage || ''}">FAIL</span>`;
      const duration = log.durationMs != null ? `${log.durationMs} ms` : '—';
      const time     = log.createdAt ? log.createdAt.replace('T', ' ').substring(0, 19) : '—';

      return `<tr>
        <td class="text-nowrap">${time}</td>
        <td>${log.username || '<span class="text-muted">anonymous</span>'}</td>
        <td>${actionBadge}</td>
        <td class="text-nowrap">${resourceLabel}</td>
        <td class="text-truncate" style="max-width:200px" title="${log.detail || ''}">${log.detail || '—'}</td>
        <td class="text-nowrap">${log.ipAddress || '—'}</td>
        <td>${statusBadge}</td>
        <td class="text-nowrap">${duration}</td>
      </tr>`;
    }).join('');
  }

  renderPagination(page.number, page.totalPages);
}

function renderPagination(current, total) {
  const ul = document.getElementById('audit-pagination');
  if (!ul) return;

  if (total <= 1) { ul.innerHTML = ''; return; }

  const pages = [];

  // Prev
  pages.push(`<li class="page-item ${current === 0 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${current - 1}">«</a></li>`);

  // Page numbers (window of 5)
  const start = Math.max(0, current - 2);
  const end   = Math.min(total - 1, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(`<li class="page-item ${i === current ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`);
  }

  // Next
  pages.push(`<li class="page-item ${current >= total - 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${current + 1}">»</a></li>`);

  ul.innerHTML = pages.join('');

  ul.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const p = parseInt(el.dataset.page);
      if (p >= 0 && p < total) {
        currentPage = p;
        loadLogs();
      }
    });
  });
}

// ── Load ───────────────────────────────────────────────────────────────────────

async function loadLogs() {
  const tbody = document.getElementById('audit-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3"><i class="bi bi-hourglass-split me-2"></i>Loading...</td></tr>';

  try {
    const params = getFilters();
    params.set('page', currentPage);
    params.set('size', 20);

    const data = await Http.get(`/api/admin/audit-logs?${params.toString()}`);
    renderLogs(data);
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">${err.message}</td></tr>`;
    UI.toast('Failed to load audit logs: ' + err.message, 'danger');
  }
}

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  document.getElementById('btn-search')?.addEventListener('click', () => {
    currentPage = 0;
    loadLogs();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    document.getElementById('filter-username').value  = '';
    document.getElementById('filter-action').value   = '';
    document.getElementById('filter-resource').value = '';
    document.getElementById('filter-status').value   = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value   = '';
    currentPage = 0;
    loadLogs();
  });

  document.getElementById('btn-export')?.addEventListener('click', () => {
    const url = buildExportUrl();
    const a = document.createElement('a');
    a.href = Http.baseURL + url;
    a.download = 'audit-logs.csv';
    a.click();
  });

  // Also search on Enter in username field
  document.getElementById('filter-username')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { currentPage = 0; loadLogs(); }
  });

  await loadLogs();
  await UI.renderCurrentUser();
});
