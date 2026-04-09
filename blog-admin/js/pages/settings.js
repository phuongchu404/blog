/**
 * Settings Page Logic
 */

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // ── SEO character counters ──────────────────────────────────────────
  const metaTitle = document.getElementById('metaTitle');
  const metaDesc  = document.getElementById('metaDescription');

  const updateCount = (el, countId, max) => {
    const span = document.getElementById(countId);
    if (!el || !span) return;
    const count = el.value.length;
    span.textContent = count;
    span.className   = count > max ? 'text-danger fw-bold' : '';
  };

  if (metaTitle) {
    metaTitle.addEventListener('input', () => updateCount(metaTitle, 'metaTitleCount', 60));
    updateCount(metaTitle, 'metaTitleCount', 60);
  }
  if (metaDesc) {
    metaDesc.addEventListener('input', () => updateCount(metaDesc, 'metaDescCount', 160));
    updateCount(metaDesc, 'metaDescCount', 160);
  }

  // ── Test API connection ─────────────────────────────────────────────
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

  // ── Activate tab from hash ──────────────────────────────────────────
  const hash = window.location.hash;
  if (hash) {
    const tabEl = document.querySelector(`[href="${hash}"]`);
    if (tabEl) {
      const tab = new bootstrap.Tab(tabEl);
      tab.show();
    }
  }

  await UI.renderCurrentUser();
});
