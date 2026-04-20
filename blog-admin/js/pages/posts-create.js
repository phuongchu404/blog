/**
 * Posts Create/Edit Page Logic
 */

// Lấy postId từ URL nếu đang edit
const urlParams = new URLSearchParams(window.location.search);
const editPostId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

let ckEditor = null;
let publishDatePicker = null;
let pendingEditorData = '';
let pendingAuthorId = '';
let pendingCategoryId = '';
let pendingTags = [];

// ── CKEditor Upload Adapter ────────────────────────────────────────────────────

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
  abort() { }
}

function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

// ── Save ───────────────────────────────────────────────────────────────────────

async function savePost(status) {
  const title = document.getElementById('postTitle').value.trim();
  const content = ckEditor
    ? ckEditor.getData()
    : (document.getElementById('postContent')?.value || pendingEditorData || '');

  if (!title) { UI.toast(I18n.t('create_post_dyn.title_required'), 'warning'); return; }
  if (!content || content === '<p>&nbsp;</p>') {
    UI.toast(I18n.t('create_post_dyn.content_required'), 'warning');
    return;
  }

  const selectedTags = window.tomSelectTags ? window.tomSelectTags.getValue() : [];

  const payload = {
    title,
    slug: document.getElementById('postSlug').value.trim() || UI.toSlug(title),
    summary: document.getElementById('postExcerpt').value.trim(),
    content,
    status: status === 'PUBLISHED' ? 1 : (status === 'ARCHIVED' ? 2 : 0),
    imageUrl: window.featuredImagePath || window.featuredImageUrl || null,
    metaTitle: document.getElementById('metaTitle').value.trim(),
    metaDescription: document.getElementById('metaDescription').value.trim(),
    metaKeywords: document.getElementById('metaKeywords').value.trim(),
    authorId: document.getElementById('postAuthor').value || null,
    tagIds: selectedTags,
    categoryIds: document.getElementById('postCategory').value ? [Number(document.getElementById('postCategory').value)] : [],
    memberOnly: document.getElementById('memberOnly')?.checked || false,
  };

  try {
    if (editPostId) {
      await PostService.update(editPostId, payload);
      UI.toast(I18n.t('create_post_dyn.updated'));
    } else {
      await PostService.create(payload);
      UI.toast(I18n.t('create_post_dyn.created'));
    }
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  } catch (err) {
    UI.toast(I18n.t('create_post_dyn.save_failed') + err.message, 'danger');
  }
}

function setEditorContent(content) {
  const normalized = content || '';
  pendingEditorData = normalized;

  const hiddenContent = document.getElementById('postContent');
  if (hiddenContent) hiddenContent.value = normalized;

  if (ckEditor) {
    ckEditor.setData(normalized);
  }
}

function setTagSelections(tags) {
  pendingTags = Array.isArray(tags) ? tags : [];
  if (!pendingTags.length) return;

  const ts = window.tomSelectTags;
  if (ts) {
    pendingTags.forEach(t => {
      const value = String(t.id);
      const text = t.title || t.name || `Tag ${t.id}`;
      if (!ts.options[value]) ts.addOption({ value, text });
      ts.addItem(value, true);
    });
    return;
  }

  const tagSelect = document.getElementById('postTags');
  if (!tagSelect) return;

  pendingTags.forEach(t => {
    const value = String(t.id);
    let option = Array.from(tagSelect.options).find(opt => opt.value === value);
    if (!option) {
      option = new Option(t.title || t.name || `Tag ${t.id}`, value, false, true);
      tagSelect.add(option);
    }
    option.selected = true;
  });
}

function applyPendingAuthorSelection() {
  if (!pendingAuthorId) return;
  const authorSelect = document.getElementById('postAuthor');
  if (!authorSelect) return;

  const value = String(pendingAuthorId);
  let option = Array.from(authorSelect.options).find(opt => opt.value === value);
  if (!option) {
    option = new Option(`User ${value}`, value, false, true);
    authorSelect.add(option);
  }
  authorSelect.value = value;
}

function applyPendingCategorySelection() {
  if (!pendingCategoryId) return;
  const categorySelect = document.getElementById('postCategory');
  if (!categorySelect) return;

  const value = String(pendingCategoryId);
  let option = Array.from(categorySelect.options).find(opt => opt.value === value);
  if (!option) {
    option = new Option(`Category ${value}`, value, false, true);
    categorySelect.add(option);
  }
  categorySelect.value = value;
}

async function loadPostForEdit(postId) {
  const pageTitle = document.getElementById('pageTitle');
  const breadcrumbAction = document.getElementById('breadcrumbAction');
  const btnPublish = document.getElementById('btnPublish');
  const publishDate = document.getElementById('publishDate');

  if (pageTitle) pageTitle.textContent = I18n.t('create_post_dyn.edit_title');
  if (breadcrumbAction) breadcrumbAction.textContent = I18n.t('create_post_dyn.edit_breadcrumb');
  if (btnPublish) btnPublish.innerHTML = I18n.t('create_post_dyn.btn_update') || '<i class="bi bi-check-circle me-1"></i> Update Post';
  if (publishDate) publishDate.disabled = true;

  try {
    const post = await PostService.getById(postId);
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postSlug').value = post.slug || '';
    document.getElementById('postExcerpt').value = post.summary || '';

    const statusMap = { 0: 'DRAFT', 1: 'PUBLISHED', 2: 'ARCHIVED' };
    document.getElementById('postStatus').value = statusMap[post.status] ?? 'DRAFT';

    setEditorContent(post.content || '');

    pendingAuthorId = post.authorId ? String(post.authorId) : '';
    applyPendingAuthorSelection();

    pendingCategoryId = String(post.categories?.[0]?.id ?? post.categoryIds?.[0] ?? '');
    applyPendingCategorySelection();

    setTagSelections(post.tags || []);

    if (post.imageUrl) {
      window.featuredImageUrl = post.imageUrl;
      window.featuredImagePath = post.imageUrl;
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

    const memberOnlyChk = document.getElementById('memberOnly');
    if (memberOnlyChk) memberOnlyChk.checked = post.memberOnly || false;

    if (post.metaDescription) {
      document.getElementById('metaDescCount').textContent = `(${post.metaDescription.length}/160)`;
    }

    if (post.publishedAt) {
      const container = document.getElementById('publishDateContainer');
      if (container) container.classList.remove('d-none');

      if (publishDatePicker) {
        publishDatePicker.setDate(new Date(post.publishedAt));
      } else if (publishDate) {
        publishDate.value = post.publishedAt.replace('T', ' ').slice(0, 16);
      }
    }
  } catch (err) {
    UI.toast(I18n.t('create_post_dyn.load_failed') + err.message, 'danger');
  }
}

// ── DOMContentLoaded ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  UI.initSidebar();
  const editPostPromise = editPostId ? loadPostForEdit(editPostId) : Promise.resolve();

  // ── CKEditor 5 v43 ─────────────────────────────────────────────────
  const editorEl = document.getElementById('editor');
  if (editorEl) {
    (async () => {
      try {
      const {
        ClassicEditor,
        Autoformat,
        Bold, Italic, Underline, Strikethrough, Code,
        BlockQuote, CodeBlock,
        Essentials,
        FileRepository,
        Heading,
        HorizontalLine,
        Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload,
        ImageResize,
        Indent, IndentBlock,
        Link,
        List, TodoList,
        MediaEmbed,
        Paragraph,
        PasteFromOffice,
        Table, TableToolbar,
      } = CKEDITOR;

      ckEditor = await ClassicEditor.create(editorEl, {
        plugins: [
          Autoformat,
          Bold, Italic, Underline, Strikethrough, Code,
          BlockQuote, CodeBlock,
          Essentials, FileRepository,
          Heading, HorizontalLine,
          Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, ImageResize,
          Indent, IndentBlock,
          Link,
          List, TodoList,
          MediaEmbed, Paragraph, PasteFromOffice,
          Table, TableToolbar,
        ],
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
            { name: 'resizeImage:original', value: null, label: 'Original' },
            { name: 'resizeImage:25', value: '25', label: '25%' },
            { name: 'resizeImage:50', value: '50', label: '50%' },
            { name: 'resizeImage:75', value: '75', label: '75%' },
            { name: 'resizeImage:100', value: '100', label: '100%' },
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

      if (pendingEditorData) {
        ckEditor.setData(pendingEditorData);
      }
      } catch (_) {
        UI.toast(I18n.t('create_post_dyn.editor_failed'), 'warning');
      }
    })();
  }

  // ── Tom Select (Tags) ───────────────────────────────────────────────
  const tagsEl = document.getElementById('postTags');
  if (tagsEl) {
    try {
      window.tomSelectTags = new TomSelect('#postTags', {
        plugins: ['remove_button', 'caret_position'],
        create: true,
        placeholder: 'Select or type tags...',
        maxOptions: 200,
        delimiter: ',',
        dropdownParent: 'body',
      });
    } catch (_) {
      window.tomSelectTags = null;
    }
  }

  // ── BS5 DateTime Picker (Publish Date) ──────────────────────────────
  const publishDateInput = document.getElementById('publishDate');
  const publishDateToggle = document.getElementById('publishDateToggle');
  if (publishDateInput) {
    try {
      setDatetimeLocale('en-us');
      createDatetimeTemplate();
      publishDatePicker = createDatetimePicker(publishDateInput, null, null, {
        format: 'YYYY-MM-DD HH:mm',
        showTime: true,
        use24Hour: true,
        startDay: 1,
      });
      publishDateInput.addEventListener('click', () => publishDatePicker.open());
      publishDateToggle?.remove();
    } catch (_) {
      publishDatePicker = null;
    }
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
        const res = await Http.upload('/api/files/upload?folder=blog/posts', formData);
        if (res && res.url) {
          window.featuredImageUrl  = res.url;   // dùng để hiển thị preview
          window.featuredImagePath = res.path;  // lưu vào DB (path tương đối)
          UI.toast(I18n.t('create_post_dyn.upload_success'));
        }
      } catch (err) {
        UI.toast(I18n.t('create_post_dyn.upload_failed') + err.message, 'danger');
      }
    });
  }

  // ── Load Categories ─────────────────────────────────────────────────
  const categoriesPromise = (async () => {
    try {
      const res = await CategoryService.getAll();
      const cats = Array.isArray(res) ? res : (res.content ?? []);
      const sel = document.getElementById('postCategory');
      if (sel) {
        sel.innerHTML = `<option value="">${I18n.t('create_post_dyn.choose_category')}</option>` +
          cats.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        applyPendingCategorySelection();
      }
    } catch (_) {
      UI.toast(I18n.t('create_post_dyn.cat_load_failed'), 'warning');
    }
  })();

  // ── Load Tags into Tom Select ────────────────────────────────────────
  const tagsPromise = (async () => {
    try {
      const res = await TagService.getAll();
      const tags = Array.isArray(res) ? res : (res.content ?? []);
      const ts = window.tomSelectTags;
      if (ts) {
        tags.forEach(t => {
          const text = t.title || t.name || t;
          ts.addOption({ value: String(t.id), text: text });
        });
        ts.refreshOptions(false);
      } else {
        const tagSelect = document.getElementById('postTags');
        if (tagSelect) {
          tagSelect.innerHTML = tags.map(t => `<option value="${t.id}">${t.title || t.name || t}</option>`).join('');
        }
      }
      setTagSelections(pendingTags);
    } catch (_) { }
  })();

  // ── Load Authors & Set Default ──────────────────────────────────────
  const authorsPromise = (async () => {
    try {
      const [users, me] = await Promise.all([
        Http.get('/api/users/all'),
        Auth.me().catch(() => null),
      ]);
      const list = Array.isArray(users) ? users : (users?.content ?? []);
      const selAut = document.getElementById('postAuthor');

      if (selAut) {
        selAut.innerHTML = list.map(u =>
          `<option value="${u.id}">${u.username || u.name || ('User ' + u.id)}</option>`
        ).join('');

        if (pendingAuthorId) {
          applyPendingAuthorSelection();
        } else if (me && me.id) {
          selAut.value = String(me.id);
        }
      }
    } catch (_) {
      const selAut = document.getElementById('postAuthor');
      if (selAut) selAut.innerHTML = '<option value="">-- Could not load --</option>';
    }
  })();

  // ── Edit mode: load existing post ───────────────────────────────────
  await Promise.allSettled([editPostPromise, categoriesPromise, tagsPromise, authorsPromise]);

  // ── Áp dụng defaultPostStatus từ Settings (chỉ khi tạo mới) ────────
  if (!editPostId) {
    try {
      const contentSettings = await SettingService.getByGroup('content');
      const defaultStatus = (contentSettings?.defaultPostStatus || 'draft').toUpperCase();
      const statusEl = document.getElementById('postStatus');
      if (statusEl && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(defaultStatus)) {
        statusEl.value = defaultStatus;
      }
    } catch (_) { }
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
