/**
 * Dashboard Page Logic
 */

async function deletePost(id) {
  if (!UI.confirm('Delete this post?')) return;
  try {
    await PostService.delete(id);
    UI.toast('Post deleted.');
    location.reload();
  } catch (err) {
    UI.toast(err.message, 'danger');
  }
}

// Gán vào window
window.deletePost = deletePost;

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // Load thống kê
  try {
    const [posts, categories, tags, users] = await Promise.allSettled([
      PostService.getAll(),
      CategoryService.getAll(),
      TagService.getAll(),
      UserService.getAll(),
    ]);

    const statPosts = document.getElementById('stat-posts');
    const statCategories = document.getElementById('stat-categories');
    const statUsers = document.getElementById('stat-users');

    if (statPosts && posts.status === 'fulfilled' && posts.value) {
      statPosts.textContent = Array.isArray(posts.value) ? posts.value.length : (posts.value.totalElements ?? '—');
    }
    if (statCategories && categories.status === 'fulfilled' && categories.value) {
      statCategories.textContent = Array.isArray(categories.value) ? categories.value.length : '—';
    }
    if (statUsers && users.status === 'fulfilled' && users.value) {
      statUsers.textContent = Array.isArray(users.value) ? users.value.length : '—';
    }
  } catch (_) {}

  // Load recent posts
  try {
    const posts = await PostService.getAll();
    const list = Array.isArray(posts) ? posts : (posts.content ?? []);
    const tbody = document.getElementById('recent-posts-body');
    if (tbody) {
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No posts found.</td></tr>';
      } else {
        tbody.innerHTML = list.slice(0, 5).map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${p.title || '—'}</td>
            <td><span class="badge text-bg-info">${p.categoryName || '—'}</span></td>
            <td>${UI.statusBadge(p.status)}</td>
            <td>${UI.formatDate(p.createdAt || p.publishedAt)}</td>
            <td>
              <a href="posts/create.html?id=${p.id}" class="btn btn-xs btn-warning"><i class="bi bi-pencil"></i></a>
              <button class="btn btn-xs btn-danger" onclick="deletePost(${p.id})"><i class="bi bi-trash"></i></button>
            </td>
          </tr>`).join('');
      }
    }
  } catch (_) {}

  // Hiển thị user hiện tại
  await UI.renderCurrentUser();

  // Logout
  document.querySelectorAll('[data-action="logout"]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); Auth.logout(); })
  );
});
