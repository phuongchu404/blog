# Post Editor Guide

Tài liệu mô tả cấu trúc, thư viện và cách hoạt động của trang tạo/chỉnh sửa bài viết (`posts/create.html`).

---

## 📦 Thư viện sử dụng

| Thư viện | Phiên bản | Nguồn | Mục đích |
|---|---|---|---|
| **CKEditor 5** (ClassicEditor) | 41.4.2 | CDN | Rich text editor cho nội dung bài viết |
| **Tom Select** | 2.3.1 | CDN | Multi-select chọn tags (Vanilla JS) |
| AdminLTE | 4.0.0-rc7 | CDN | Layout & UI framework |
| Bootstrap | 5.3.7 | CDN | Component UI |
| Bootstrap Icons | 1.13.1 | CDN | Icons |

> **Lưu ý:** Dự án **không sử dụng jQuery**. Tom Select được chọn thay vì Select2 vì Tom Select là thư viện Vanilla JS thuần, không phụ thuộc vào jQuery.

---

## 🗂️ Cấu trúc layout

Trang được chia thành 2 cột:

```
┌─────────────────────────────────┬──────────────────┐
│  Left (col-md-8)                │  Right (col-md-4) │
│                                 │                   │
│  ┌─────────────────────────┐   │  ┌─────────────┐  │
│  │  Post Content Card      │   │  │  Publish    │  │
│  │  - Title                │   │  │  - Status   │  │
│  │  - Slug (auto-gen)      │   │  │  - Date     │  │
│  │  - Excerpt              │   │  └─────────────┘  │
│  │  - Content (CKEditor 5) │   │  ┌─────────────┐  │
│  └─────────────────────────┘   │  │  Category   │  │
│                                 │  │  Tags       │  │
│  ┌─────────────────────────┐   │  └─────────────┘  │
│  │  SEO Card               │   │  ┌─────────────┐  │
│  │  - Meta Title           │   │  │  Image      │  │
│  │  - Meta Description     │   │  └─────────────┘  │
│  │  - Keywords             │   │  ┌─────────────┐  │
│  └─────────────────────────┘   │  │  Author     │  │
│                                 │  └─────────────┘  │
└─────────────────────────────────┴──────────────────┘
```

---

## ✍️ CKEditor 5 — Rich Text Editor

### Khởi tạo

```js
ckEditor = await ClassicEditor.create(document.getElementById('editor'), {
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
  placeholder: 'Write your post content here...',
  language: 'en',
});
```

### Chức năng toolbar

| Nhóm | Chức năng |
|---|---|
| **Heading** | H1 → H6, Paragraph |
| **Text style** | Bold, Italic, Underline, Strikethrough |
| **Blocks** | Link, Blockquote, Code inline, Code block |
| **Lists** | Bullet list, Numbered list, Todo list |
| **Insert** | Table, Image upload, Media embed |
| **Layout** | Horizontal rule, Outdent/Indent |
| **History** | Undo, Redo |

### Lấy nội dung khi submit

```js
// Lấy HTML string từ editor
const content = ckEditor.getData();

// Set nội dung (dùng trong edit mode)
ckEditor.setData(post.content || '');
```

> **Định dạng lưu:** CKEditor trả về **HTML string** (không phải Markdown). Backend cần lưu và xử lý dưới dạng HTML.

---

## 🏷️ Tom Select — Tags Multi-Select

### Tại sao dùng Tom Select thay vì Select2?

| | Select2 | Tom Select |
|---|---|---|
| **Phụ thuộc** | ❌ Cần jQuery | ✅ Vanilla JS thuần |
| **Bundle size** | ~30KB + jQuery ~87KB | ~50KB all-in-one |
| **Bootstrap 5 theme** | Cần theme bên thứ 3 | ✅ CSS built-in `tom-select.bootstrap5` |
| **Phong cách code** | `$('#id').select2(...)` | `new TomSelect('#id', ...)` |

### Khởi tạo

```js
window.tomSelectTags = new TomSelect('#postTags', {
  plugins: ['remove_button', 'caret_position'],
  create: true,         // Cho phép gõ tự do để tạo tag mới
  placeholder: 'Select or type tags...',
  maxOptions: 200,
  delimiter: ',',
});
```

### Thêm options từ API

```js
const tags = await TagService.getAll();
const ts = window.tomSelectTags;

tags.forEach(t => {
  ts.addOption({ value: String(t.id), text: t.name });
});
ts.refreshOptions(false);
```

### Lấy giá trị đã chọn khi submit

```js
const selectedTags = window.tomSelectTags.getValue();
// Trả về: ['1', '3', 'my-new-tag']
// - Số: là id của tag đã có sẵn trong DB
// - Chuỗi: là tên tag mới do người dùng gõ
```

### Phân biệt tag mới và tag cũ khi gửi API

```js
const payload = {
  tagIds:   selectedTags.filter(v => !isNaN(Number(v))).map(Number), // [1, 3]
  tagNames: selectedTags.filter(v => isNaN(Number(v))),              // ['my-new-tag']
};
```

---

## 🌐 Dữ liệu động từ API

Tất cả các dropdown được populate tự động khi trang load, **không hardcode** dữ liệu trong HTML.

| Field | API Endpoint | Ghi chú |
|---|---|---|
| **Category** | `GET /api/categories` | Single-select |
| **Tags** | `GET /api/tags` | Multi-select qua Tom Select |
| **Author** | `GET /api/users` | Single-select |

---

## ✏️ Chế độ Edit (Edit Mode)

Trang `create.html` kiêm luôn chức năng **chỉnh sửa bài viết**. Chế độ edit được kích hoạt khi URL có tham số `?id=`.

```
/posts/create.html          → Tạo bài viết mới
/posts/create.html?id=123   → Chỉnh sửa bài viết có id = 123
```

### Cách phát hiện chế độ edit

```js
const urlParams  = new URLSearchParams(window.location.search);
const editPostId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

if (editPostId) {
  // Gọi API lấy dữ liệu bài viết và điền vào form
  const post = await PostService.getById(editPostId);
  ckEditor.setData(post.content || '');
  // ...
}
```

### Sau khi tạo thành công

```js
post = await PostService.create(payload);
// Tự động chuyển sang edit mode với id vừa tạo
if (post?.id) window.location.href = `create.html?id=${post.id}`;
```

---

## ✅ Validate trước khi submit

```js
const title   = document.getElementById('postTitle').value.trim();
const content = ckEditor.getData();

if (!title)   { UI.toast('Title is required.', 'warning');   return; }
if (!content || content === '<p>&nbsp;</p>') {
  UI.toast('Content cannot be empty.', 'warning');
  return;
}
```

> CKEditor trả về `<p>&nbsp;</p>` khi editor trống, vì vậy cần kiểm tra thêm trường hợp này.

---

## 💾 Payload gửi lên API

```js
const payload = {
  title,                // string
  slug,                 // string (auto-gen từ title nếu để trống)
  excerpt,              // string
  content,              // HTML string từ CKEditor
  status,               // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  categoryId,           // number | null
  tagIds,               // number[] — id của tags đã có sẵn
  tagNames,             // string[] — tên tags mới do người dùng tạo
};
```

### SEO Meta (lưu riêng sau khi tạo/update bài viết)

```js
await Promise.allSettled([
  metaTitle && PostService.setMeta(pid, 'metaTitle',       metaTitle),
  metaDesc  && PostService.setMeta(pid, 'metaDescription', metaDesc),
  metaKw    && PostService.setMeta(pid, 'metaKeywords',    metaKw),
]);
```

---

## 🖼️ Featured Image Preview

Khi người dùng chọn ảnh, preview được hiển thị ngay lập tức trước khi upload lên server.

```js
document.getElementById('featuredImageFile').addEventListener('change', function () {
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('imgPreview');
    preview.src = e.target.result;
    preview.classList.remove('d-none');
    document.getElementById('imgDropZone').classList.add('d-none');
  };
  reader.readAsDataURL(this.files[0]);
});
```

---

## 📋 Checklist tích hợp Backend

- [ ] API `GET /api/categories` trả về `[{ id, name }]`
- [ ] API `GET /api/tags` trả về `[{ id, name }]`
- [ ] API `GET /api/users` trả về `[{ id, username }]`
- [ ] API `POST /api/posts` nhận payload bao gồm `tagIds` và `tagNames`
- [ ] API `PUT /api/posts/{id}` nhận payload tương tự
- [ ] API `GET /api/posts/{id}` trả về `tags: [{ id, name }]`
- [ ] API `POST /api/posts/{id}/meta` nhận `{ key, value }`
- [ ] API `GET /api/posts/{id}/meta` trả về `[{ key, value }]`
- [ ] Backend lưu `content` dưới dạng HTML (không phải Markdown)
