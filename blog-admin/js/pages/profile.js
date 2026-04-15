/**
 * Profile Page Logic
 */

let currentUser = null;

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();

  // ── Load user info ──────────────────────────────────────────────────
  try {
    currentUser = await Auth.me();
    const firstName = document.getElementById('firstName');
    const lastName  = document.getElementById('lastName');
    const username  = document.getElementById('username');
    const email     = document.getElementById('email');
    const bio       = document.getElementById('bio');
    const website   = document.getElementById('website');
    const preview   = document.getElementById('profilePhotoPreview');

    if (firstName) firstName.value = currentUser.firstName || currentUser.username || '';
    if (lastName)  lastName.value  = currentUser.lastName || '';
    if (username)  username.value  = currentUser.username || '';
    if (email)     email.value     = currentUser.email || '';
    if (bio)       bio.value       = currentUser.bio || '';
    if (website)   website.value   = currentUser.website || '';
    if (preview && currentUser.imageUrl) preview.src = currentUser.imageUrl;

    // Roles
    const roleBadges = (currentUser.roles || []).map(r => `<span class="badge text-bg-danger me-1">${r}</span>`).join('');
    const badgeContainer = document.querySelector('.card .card-body span.badge');
    if (badgeContainer) {
      badgeContainer.replaceWith(...(new DOMParser().parseFromString(roleBadges || '<span class="badge text-bg-secondary">USER</span>', 'text/html').body.childNodes));
    }

    // Member since
    const memberSince = document.querySelector('.card-footer small');
    if (memberSince && currentUser.createdAt) {
      memberSince.textContent = 'Member since ' + UI.formatDate(currentUser.createdAt);
    }
  } catch (err) {
    UI.toast('Failed to load profile: ' + err.message, 'danger');
  }

  // ── Save profile info ───────────────────────────────────────────────
  const profileForm = document.getElementById('profileInfoForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!currentUser) return;
      const payload = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName:  document.getElementById('lastName').value.trim(),
        username:  document.getElementById('username').value.trim(),
        email:     document.getElementById('email').value.trim(),
        intro:     document.getElementById('bio').value.trim(),
        imageUrl:  window.profileImagePath || currentUser.imageUrl || null,
      };
      try {
        await UserService.update(currentUser.id, payload);
        currentUser = await Auth.me();
        localStorage.setItem('user', JSON.stringify(currentUser));
        await UI.renderCurrentUser();
        UI.toast('Profile updated successfully.');
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // ── Change password ─────────────────────────────────────────────────
  const changePwForm = document.getElementById('changePasswordForm');
  if (changePwForm) {
    changePwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const newPw     = document.getElementById('newPassword').value;
      const confPw    = document.getElementById('confirmPassword').value;
      const currentPw = document.getElementById('currentPassword').value;

      if (newPw !== confPw) { UI.toast('Passwords do not match.', 'warning'); return; }
      try {
        await UserService.update(currentUser.id, { password: newPw, currentPassword: currentPw });
        UI.toast('Password changed successfully.');
        this.reset();
      } catch (err) { UI.toast(err.message, 'danger'); }
    });
  }

  // ── Toggle password visibility ──────────────────────────────────────
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', function () {
      const target = document.getElementById(this.dataset.target);
      const icon   = this.querySelector('i');
      if (target && icon) {
        target.type  = target.type === 'password' ? 'text' : 'password';
        icon.className = target.type === 'text' ? 'bi bi-eye-slash' : 'bi bi-eye';
      }
    });
  });

  // ── Password strength meter ─────────────────────────────────────────
  const newPwInput = document.getElementById('newPassword');
  if (newPwInput) {
    newPwInput.addEventListener('input', function () {
      const val = this.value;
      let strength = 0;
      if (val.length >= 8)       strength++;
      if (/[A-Z]/.test(val))     strength++;
      if (/[0-9]/.test(val))     strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;
      const levels = [
        { pct: 0,   cls: '',          text: 'Enter a password' },
        { pct: 25,  cls: 'bg-danger', text: 'Weak' },
        { pct: 50,  cls: 'bg-warning', text: 'Fair' },
        { pct: 75,  cls: 'bg-info',   text: 'Good' },
        { pct: 100, cls: 'bg-success', text: 'Strong' },
      ];
      const l   = levels[strength];
      const bar = document.getElementById('pwStrengthBar');
      const label = document.getElementById('pwStrengthLabel');
      if (bar)   { bar.style.width = l.pct + '%'; bar.className = 'progress-bar ' + l.cls; }
      if (label) label.textContent = l.text;
    });
  }

  // ── Photo upload — preview + upload thật lên MinIO ─────────────────
  const photoUpload = document.getElementById('photoUpload');
  if (photoUpload) {
    photoUpload.addEventListener('change', async function () {
      const file = this.files && this.files[0];
      if (!file) return;
      // Preview ngay lập tức
      const reader  = new FileReader();
      const preview = document.getElementById('profilePhotoPreview');
      reader.onload = e => { if (preview) preview.src = e.target.result; };
      reader.readAsDataURL(file);
      // Upload lên MinIO
      const formData = new FormData();
      formData.append('upload', file);
      try {
        const res = await Http.upload('/api/files/upload?folder=blog/avatars', formData);
        if (res && res.path) {
          window.profileImagePath = res.path;
          UI.toast('Ảnh đã tải lên. Nhấn Save để lưu.', 'success');
        }
      } catch (err) {
        UI.toast('Upload thất bại: ' + err.message, 'danger');
      }
    });
  }

  await UI.renderCurrentUser();
});
