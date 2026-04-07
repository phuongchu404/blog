/**
 * Settings Page Logic
 */

document.addEventListener('DOMContentLoaded', function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // Character counters for SEO fields
  const metaTitle = document.getElementById('metaTitle');
  const metaDesc = document.getElementById('metaDescription');
  
  const updateCount = (el, countId, max) => {
    const span = document.getElementById(countId);
    if (!el || !span) return;
    const count = el.value.length;
    span.textContent = count;
    if (span) {
      span.className = count > max ? 'text-danger fw-bold' : '';
    }
  };

  if (metaTitle) {
    metaTitle.addEventListener('input', () => updateCount(metaTitle, 'metaTitleCount', 60));
    updateCount(metaTitle, 'metaTitleCount', 60);
  }
  if (metaDesc) {
    metaDesc.addEventListener('input', () => updateCount(metaDesc, 'metaDescCount', 160));
    updateCount(metaDesc, 'metaDescCount', 160);
  }

  // Test API connection
  const testApiBtn = document.getElementById('testApiBtn');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', function () {
      const result = document.getElementById('apiTestResult');
      if (result) {
        result.classList.remove('d-none');
        result.innerHTML = '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Connected</span>';
      }
    });
  }

  // Activate tab from hash
  const hash = window.location.hash;
  if (hash) {
    const tabEl = document.querySelector(`[href="${hash}"]`);
    if (tabEl) {
      const tab = new bootstrap.Tab(tabEl);
      tab.show();
    }
  }

  // Hiển thị user hiện tại
  if (typeof UI !== 'undefined' && UI.renderCurrentUser) {
    UI.renderCurrentUser();
  }
});
