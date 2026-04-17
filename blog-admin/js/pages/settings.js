/**
 * Settings Page Logic — tích hợp API /api/settings
 * Phụ thuộc: http.js, ui.js, setting.service.js
 */

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  await UI.renderCurrentUser();

  // Kích hoạt tab từ URL hash
  const hash = window.location.hash;
  if (hash) {
    const tabEl = document.querySelector(`[href="${hash}"]`);
    if (tabEl) new bootstrap.Tab(tabEl).show();
  }

  // SEO character counters
  setupCharCounter('metaTitle',      'metaTitleCount', 60);
  setupCharCounter('metaDescription','metaDescCount',  160);

  // Test API connection
  document.getElementById('testApiBtn')?.addEventListener('click', testApiConnection);

  // Tải settings từ server
  await loadAllSettings();

  // Đăng ký submit handlers cho từng form
  document.getElementById('generalForm')?.addEventListener('submit',  e => saveGroup(e, 'general'));
  document.getElementById('contentForm')?.addEventListener('submit',  e => saveGroup(e, 'content'));
  document.getElementById('commentsForm')?.addEventListener('submit', e => saveGroup(e, 'comments'));
  document.getElementById('seoForm')?.addEventListener('submit',      e => saveGroup(e, 'seo'));
});

// ── Tải toàn bộ settings và điền vào form ──────────────────────────────────
async function loadAllSettings() {
  try {
    const data = await SettingService.getAll();
    if (!data) return;

    // general
    const g = data.general || {};
    setVal('siteName',    g.siteName);
    setVal('siteTagline', g.siteTagline);
    setVal('siteUrl',     g.siteUrl);
    setVal('adminEmail',  g.adminEmail);
    setSelect('timezone', g.timezone);
    setSelect('language', g.language);

    // content
    const c = data.content || {};
    setVal('postsPerPage', c.postsPerPage);
    setRadio('defaultStatus', c.defaultPostStatus);
    setSwitch('allowGuestRead', c.allowGuestRead);
    setSwitch('showAuthor',     c.showAuthor);
    setSwitch('showReadTime',   c.showReadTime);

    // comments
    const cm = data.comments || {};
    setSwitch('enableComments',  cm.enableComments);
    setSwitch('requireApproval', cm.requireApproval);
    setSwitch('requireLogin',    cm.requireLogin);
    setSwitch('allowNested',     cm.allowNested);
    setVal('maxNestDepth', cm.maxNestDepth);

    // seo
    const s = data.seo || {};
    setVal('metaTitle',       s.metaTitle);
    setVal('metaDescription', s.metaDescription);
    setSwitch('enableSitemap', s.enableSitemap);
    setSwitch('enableRobots',  s.enableRobots);
    setVal('googleAnalytics',  s.googleAnalyticsId);

    // Cập nhật counters sau khi fill dữ liệu
    updateCount('metaTitle',      'metaTitleCount', 60);
    updateCount('metaDescription','metaDescCount',  160);

  } catch (err) {
    UI.toast('Không thể tải settings.', 'danger');
    console.error(err);
  }
}

// ── Lưu settings của một group ────────────────────────────────────────────
async function saveGroup(event, group) {
  event.preventDefault();
  const btn = event.submitter;
  const original = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...'; }

  try {
    const payload = buildPayload(group);
    await SettingService.updateGroup(group, payload);
    UI.toast(`Đã lưu ${capitalize(group)} Settings.`, 'success');
  } catch (err) {
    UI.toast('Lưu thất bại: ' + (err?.message || 'Lỗi không xác định'), 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

// ── Xây dựng payload từ form theo group ────────────────────────────────────
function buildPayload(group) {
  const map = {
    general: () => ({
      siteName:    getVal('siteName'),
      siteTagline: getVal('siteTagline'),
      siteUrl:     getVal('siteUrl'),
      adminEmail:  getVal('adminEmail'),
      timezone:    getSelectVal('timezone'),
      language:    getSelectVal('language'),
    }),
    content: () => ({
      postsPerPage:      getVal('postsPerPage'),
      defaultPostStatus: getRadioVal('defaultStatus'),
      allowGuestRead:    getSwitchVal('allowGuestRead'),
      showAuthor:        getSwitchVal('showAuthor'),
      showReadTime:      getSwitchVal('showReadTime'),
    }),
    comments: () => ({
      enableComments:  getSwitchVal('enableComments'),
      requireApproval: getSwitchVal('requireApproval'),
      requireLogin:    getSwitchVal('requireLogin'),
      allowNested:     getSwitchVal('allowNested'),
      maxNestDepth:    getVal('maxNestDepth'),
    }),
    seo: () => ({
      metaTitle:        getVal('metaTitle'),
      metaDescription:  getVal('metaDescription'),
      enableSitemap:    getSwitchVal('enableSitemap'),
      enableRobots:     getSwitchVal('enableRobots'),
      googleAnalyticsId: getVal('googleAnalytics'),
    }),
  };
  return map[group]?.() || {};
}

// ── Test API connection ───────────────────────────────────────────────────
async function testApiConnection() {
  const btn    = document.getElementById('testApiBtn');
  const result = document.getElementById('apiTestResult');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  try {
    const res = await fetch(`${localStorage.getItem('apiBaseUrl') || 'http://localhost:8055'}/actuator/health`);
    result.classList.remove('d-none');
    if (res.ok) {
      result.innerHTML = '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Connected</span>';
    } else {
      result.innerHTML = '<span class="badge text-bg-warning"><i class="bi bi-exclamation-triangle me-1"></i>Unreachable</span>';
    }
  } catch {
    result.classList.remove('d-none');
    result.innerHTML = '<span class="badge text-bg-danger"><i class="bi bi-x-circle me-1"></i>Connection failed</span>';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-activity me-1"></i>Test';
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.value = val;
}
function getVal(id) {
  return document.getElementById(id)?.value?.trim() ?? '';
}
function setSelect(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined) return;
  for (const opt of el.options) {
    if (opt.value === val || opt.text === val) { el.value = opt.value; break; }
  }
}
function getSelectVal(id) {
  return document.getElementById(id)?.value ?? '';
}
function setSwitch(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = val === 'true' || val === true;
}
function getSwitchVal(id) {
  return String(document.getElementById(id)?.checked ?? false);
}
function setRadio(name, val) {
  if (!val) return;
  const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (el) el.checked = true;
}
function getRadioVal(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
}

// ── SEO character counter ─────────────────────────────────────────────────
function setupCharCounter(elId, countId, max) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.addEventListener('input', () => updateCount(elId, countId, max));
  updateCount(elId, countId, max);
}
function updateCount(elId, countId, max) {
  const el   = document.getElementById(elId);
  const span = document.getElementById(countId);
  if (!el || !span) return;
  const len = el.value.length;
  span.textContent = len;
  span.className   = len > max ? 'text-danger fw-bold' : '';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
