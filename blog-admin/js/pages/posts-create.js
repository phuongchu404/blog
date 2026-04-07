/**
 * Posts Create/Edit Page Logic
 */

// Lấy postId từ URL nếu đang edit
const urlParams = new URLSearchParams(window.location.search);
const editPostId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

let ckEditor = null;

/**
 * Custom Upload Adapter for CKEditor 5
 */
class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }
  upload() {
    return this.loader.file.then(file => new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('upload', file);

      Http.upload('/api/files/upload', formData)
        .then(result => {
          if (result && result.url) {
            resolve({ default: result.url });
          } else {
            reject('Upload failed');
          }
        })
        .catch(error => {
          reject(error.message || 'Upload failed');
        });
    }));
  }
  abort() {}
}

function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

async function savePost(status) {
  const title = document.getElementById('postTitle').value.trim();
  const content = ckEditor ? ckEditor.getData() : '';

  if (!title) { UI.toast('Title is required.', 'warning'); return; }
  if (!content || content === '<p>&nbsp;</p>') {
    UI.toast('Content cannot be empty.', 'warning');
    return;
  }

  const selectedTags = window.tomSelectTags ? window.tomSelectTags.getValue() : [];

  const payload = {
    title,
    slug: document.getElementById('postSlug').value.trim() || UI.toSlug(title),
    summary: document.getElementById('postExcerpt').value.trim(),
    content,
    status: status === 'PUBLISHED' ? 1 : (status === 'ARCHIVED' ? 2 : 0),
    imageUrl: window.featuredImageUrl || null,
    metaTitle: document.getElementById('metaTitle').value.trim(),
    metaDescription: document.getElementById('metaDescription').value.trim(),
    metaKeywords: document.getElementById('metaKeywords').value.trim(),
    authorId: document.getElementById('postAuthor').value || null,
    tagIds: selectedTags,
    categoryIds: document.getElementById('postCategory').value ? [Number(document.getElementById('postCategory').value)] : [],
  };

  try {
    let post;
    if (editPostId) {
      post = await PostService.update(editPostId, payload);
      UI.toast('Post updated successfully.');
    } else {
      post = await PostService.create(payload);
      UI.toast('Post created successfully.');
      if (post?.id) window.location.href = `create.html?id=${post.id}`;
    }
  } catch (err) {
    UI.toast('Failed to save post: ' + err.message, 'danger');
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  // ── Sidebar Overlay Scrollbars ──────────────────────────────────────
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
    });
  }

  // ── CKEditor 5 ──────────────────────────────────────────────────────
  const editorEl = document.getElementById('editor');
  if (editorEl) {
    ckEditor = await ClassicEditor.create(editorEl, {
      extraPlugins: [MyCustomUploadAdapterPlugin],
      toolbar: {
        items: [
          'heading', '|',
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'link', 'blockQuote', 'code', 'codeBlock', '|',
          'bulletedList', 'numberedList', 'todoList', '|',
          'insertTable', '|',
          'imageUpload', 'mediaEmbed', '|',
          'horizontalLine', '|',
          'outdent', 'indent', '|',
          'undo', 'redo',
        ],
        shouldNotGroupWhenFull: true,
      },
      image: {
        resizeUnit: '%',
        resizeOptions: [
          { name: 'resizeImage:original', value: null,  label: 'Original' },
          { name: 'resizeImage:25',       value: '25',  label: '25%' },
          { name: 'resizeImage:50',       value: '50',  label: '50%' },
          { name: 'resizeImage:75',       value: '75',  label: '75%' },
          { name: 'resizeImage:100',      value: '100', label: '100%' },
        ],
        toolbar: [
          'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
          'toggleImageCaption', 'imageTextAlternative', '|',
          'resizeImage:25', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original',
        ],
      },
      placeholder: 'Write your post content here...',
      language: 'en',
    });
  }

  // ── Tom Select (Tags) ────────────────────────────────────────────
  const tagsEl = document.getElementById('postTags');
  if (tagsEl) {
    window.tomSelectTags = new TomSelect('#postTags', {
      plugins: ['remove_button', 'caret_position'],
      create: true,
      placeholder: 'Select or type tags...',
      maxOptions: 200,
      delimiter: ',',
      dropdownParent: 'body'
    });
  }

  // ── Auto slug từ title ──────────────────────────────────────────────
  const titleInput = document.getElementById('postTitle');
  if (titleInput) {
    titleInput.addEventListener('input', function () {
      document.getElementById('postSlug').value = UI.toSlug(this.value);
    });
  }

  // ── Meta description char counter ───────────────────────────────────
  const metaDescInput = document.getElementById('metaDescription');
  if (metaDescInput) {
    metaDescInput.addEventListener('input', function () {
      const countEl = document.getElementById('metaDescCount');
      if (countEl) countEl.textContent = `(${this.value.length}/160)`;
    });
  }

  // ── Image preview & upload ──────────────────────────────────────────
  const fileInput = document.getElementById('featuredImageFile');
  if (fileInput) {
    fileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('imgPreview');
        if (preview) {
          preview.src = e.target.result;
          preview.classList.remove('d-none');
        }
        const dropZone = document.getElementById('imgDropZone');
        if (dropZone) dropZone.classList.add('d-none');
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('upload', file);
      try {
        const res = await Http.upload('/api/files/upload', formData);
        if (res && res.url) {
          window.featuredImageUrl = res.url;
          UI.toast('Featured image uploaded.');
        }
      } catch (err) {
        UI.toast('Failed to upload featured image: ' + err.message, 'danger');
      }
    });
  }

  // ── Load Categories ─────────────────────────────────────────────────
  try {
    const res = await CategoryService.getAll();
    const cats = Array.isArray(res) ? res : (res.content ?? []);
    const sel = document.getElementById('postCategory');
    if (sel) {
      sel.innerHTML = '<option value="">-- Choose Category --</option>' +
        cats.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    }
  } catch (_) {
    UI.toast('Could not load categories.', 'warning');
  }

  // ── Load Tags into Tom Select ────────────────────────────────────
  try {
    const res = await TagService.getAll();
    const tags = Array.isArray(res) ? res : (res.content ?? []);
    const ts = window.tomSelectTags;
    if (ts) {
      tags.forEach(t => {
        const text = t.title || t.name || t;
        ts.addOption({ value: t.id, text: text });
      });
      ts.refreshOptions(false);
    }
  } catch (_) { }

  // ── Load Authors & Set Default ──────────────────────────────────────
  try {
    const users = await Http.get('/api/users/all') || [];
    const list = Array.isArray(users) ? users : (users.content ?? []);
    const selAut = document.getElementById('postAuthor');

    if (selAut) {
      selAut.innerHTML = list.map(u =>
        `<option value="${u.id}">${u.username || u.name || ('User ' + u.id)}</option>`
      ).join('');

      const me = await Auth.me();
      if (me && me.id) selAut.value = me.id;
    }
  } catch (_) {
    const selAut = document.getElementById('postAuthor');
    if (selAut) selAut.innerHTML = '<option value="">-- Could not load --</option>';
  }

  // ── Edit mode: load existing post ───────────────────────────────────
  if (editPostId) {
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbAction = document.getElementById('breadcrumbAction');
    const btnPublish = document.getElementById('btnPublish');
    const publishDate = document.getElementById('publishDate');

    if (pageTitle) pageTitle.textContent = 'Edit Post';
    if (breadcrumbAction) breadcrumbAction.textContent = 'Edit';
    if (btnPublish) btnPublish.innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Post';
    if (publishDate) publishDate.disabled = true;

    try {
      const post = await PostService.getById(editPostId);
      document.getElementById('postTitle').value = post.title || '';
      document.getElementById('postSlug').value = post.slug || '';
      document.getElementById('postExcerpt').value = post.summary || '';
      document.getElementById('postStatus').value = post.status || '0';

      if (ckEditor) ckEditor.setData(post.content || '');

      if (post.categories && post.categories.length > 0) {
        document.getElementById('postCategory').value = post.categories[0].id;
      }

      if (post.tags && post.tags.length && window.tomSelectTags) {
        const ts = window.tomSelectTags;
        post.tags.forEach(t => {
          const val = t.id;
          const text = t.title || t.name;
          if (!ts.options[val]) ts.addOption({ value: val, text });
          ts.addItem(val, true);
        });
      }

      if (post.imageUrl) {
        window.featuredImageUrl = post.imageUrl;
        const preview = document.getElementById('imgPreview');
        if (preview) {
          preview.src = post.imageUrl;
          preview.classList.remove('d-none');
        }
        const dropZone = document.getElementById('imgDropZone');
        if (dropZone) dropZone.classList.add('d-none');
      }

      document.getElementById('metaTitle').value = post.metaTitle || '';
      document.getElementById('metaDescription').value = post.metaDescription || '';
      document.getElementById('metaKeywords').value = post.metaKeywords || '';
      if (post.metaDescription) {
        document.getElementById('metaDescCount').textContent = `(${post.metaDescription.length}/160)`;
      }

      if (post.publishedAt) {
        const container = document.getElementById('publishDateContainer');
        const pubDateInput = document.getElementById('publishDate');
        if (container) container.classList.remove('d-none');
        if (pubDateInput) {
          pubDateInput.value = post.publishedAt.substring(0, 16);
          pubDateInput.disabled = true;
        }
      }

      // SEO meta
      try {
        const meta = await PostService.getMeta(editPostId);
        const metaMap = {};
        (Array.isArray(meta) ? meta : []).forEach(m => metaMap[m.key] = m.value);
        if (metaMap.metaTitle) document.getElementById('metaTitle').value = metaMap.metaTitle;
        if (metaMap.metaDescription) {
          document.getElementById('metaDescription').value = metaMap.metaDescription;
          document.getElementById('metaDescCount').textContent = `(${metaMap.metaDescription.length}/160)`;
        }
        if (metaMap.metaKeywords) document.getElementById('metaKeywords').value = metaMap.metaKeywords;
      } catch (_) { }

    } catch (err) { UI.toast('Failed to load post: ' + err.message, 'danger'); }
  }

  // ── Form interactions ───────────────────────────────────────────────
  const postForm = document.getElementById('postForm');
  if (postForm) {
    postForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      await savePost(document.getElementById('postStatus').value || 'PUBLISHED');
    });
  }

  const btnDraft = document.getElementById('btnDraft');
  if (btnDraft) {
    btnDraft.addEventListener('click', async function () {
      await savePost('DRAFT');
    });
  }

  await UI.renderCurrentUser();
});
