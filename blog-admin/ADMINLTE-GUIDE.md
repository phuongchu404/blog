# Hướng dẫn sử dụng & Custom AdminLTE 4

> **Version:** AdminLTE 4.0.0-rc7 | **Framework:** Bootstrap 5.3 | **License:** MIT

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Cài đặt](#2-cài-đặt)
3. [Cấu trúc HTML cơ bản](#3-cấu-trúc-html-cơ-bản)
4. [Layout Options](#4-layout-options)
5. [Sidebar](#5-sidebar)
6. [Header (Navbar)](#6-header-navbar)
7. [Components](#7-components)
8. [Dark Mode & Color Scheme](#8-dark-mode--color-scheme)
9. [Custom với SCSS Variables](#9-custom-với-scss-variables)
10. [JavaScript API](#10-javascript-api)
11. [Tips & Best Practices](#11-tips--best-practices)

---

## 1. Giới thiệu

AdminLTE 4 là một admin dashboard template mã nguồn mở, xây dựng trên nền **Bootstrap 5**. So với v3, AdminLTE 4 có nhiều thay đổi lớn:

| Tính năng | v3 | v4 |
|---|---|---|
| Framework | Bootstrap 4 | Bootstrap 5 |
| JavaScript | jQuery | Vanilla JS |
| CSS | LESS | SCSS |
| Dark Mode | Không | Có (CSS Variables) |
| Accessibility | Cơ bản | WCAG 2.1 AA |
| Source | Compiled only | Astro + Rollup |

---

## 2. Cài đặt

### Cách 1: CDN (Đơn giản nhất — dùng trong blog-admin này)

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/styles/overlayscrollbars.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-rc7/dist/css/adminlte.min.css" />

<!-- JavaScript (cuối body) -->
<script src="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/browser/overlayscrollbars.browser.es6.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-rc7/dist/js/adminlte.min.js"></script>
```

### Cách 2: NPM (Để custom SCSS)

```bash
npm install admin-lte@4.0.0-rc7
```

### Cách 3: Local Files

```html
<link rel="stylesheet" href="./assets/css/adminlte.min.css" />
<script src="./assets/js/adminlte.min.js"></script>
```

---

## 3. Cấu trúc HTML cơ bản

AdminLTE 4 có cấu trúc HTML bắt buộc như sau:

```html
<body class="layout-fixed sidebar-expand-lg bg-body-tertiary">
  <!-- Wrapper bao toàn bộ layout -->
  <div class="app-wrapper">

    <!-- 1. Header / Navbar trên cùng -->
    <nav class="app-header navbar navbar-expand bg-body">
      ...
    </nav>

    <!-- 2. Sidebar bên trái -->
    <aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <!-- Brand/Logo -->
      <div class="sidebar-brand">...</div>
      <!-- Menu items -->
      <div class="sidebar-wrapper">
        <nav class="mt-2">
          <ul class="nav sidebar-menu flex-column" data-lte-toggle="treeview">
            ...
          </ul>
        </nav>
      </div>
    </aside>

    <!-- 3. Nội dung chính -->
    <main class="app-main">
      <!-- Breadcrumb header -->
      <div class="app-content-header">...</div>
      <!-- Content area -->
      <div class="app-content">
        <div class="container-fluid">
          <!-- Nội dung trang ở đây -->
        </div>
      </div>
    </main>

    <!-- 4. Footer -->
    <footer class="app-footer">...</footer>

  </div>
</body>
```

---

## 4. Layout Options

Thay đổi class trên thẻ `<body>` để thay đổi layout:

### Classes body chính

| Class | Mô tả |
|---|---|
| `layout-fixed` | Header + Sidebar cố định khi scroll |
| `sidebar-expand-lg` | Sidebar mở rộng trên màn hình `lg` trở lên |
| `sidebar-expand-md` | Sidebar mở rộng trên màn hình `md` trở lên |
| `sidebar-collapse` | Sidebar bị thu nhỏ mặc định |
| `sidebar-mini` | Sidebar thu nhỏ chỉ hiện icon |
| `sidebar-open` | Sidebar mở (dùng trên mobile) |

### Ví dụ layout combinations

```html
<!-- Layout mặc định: header + sidebar cố định -->
<body class="layout-fixed sidebar-expand-lg bg-body-tertiary">

<!-- Sidebar mini (chỉ icon khi thu gọn) -->
<body class="layout-fixed sidebar-mini sidebar-expand-lg bg-body-tertiary">

<!-- Sidebar mặc định không cố định -->
<body class="sidebar-expand-lg bg-body-tertiary">

<!-- Bắt đầu với sidebar đã thu gọn -->
<body class="layout-fixed sidebar-mini sidebar-collapse sidebar-expand-lg bg-body-tertiary">
```

---

## 5. Sidebar

### 5.1 Sidebar Theme (Màu nền)

Sidebar màu tối/sáng được điều khiển bằng `data-bs-theme`:

```html
<!-- Sidebar tối (dark) - mặc định của AdminLTE -->
<aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">

<!-- Sidebar sáng (light) -->
<aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="light">

<!-- Sidebar với màu cụ thể Bootstrap -->
<aside class="app-sidebar bg-primary shadow" data-bs-theme="dark">
<aside class="app-sidebar bg-dark shadow" data-bs-theme="dark">
<aside class="app-sidebar bg-success shadow" data-bs-theme="dark">
```

### 5.2 Cấu trúc Sidebar Menu

```html
<ul class="nav sidebar-menu flex-column"
    data-lte-toggle="treeview"
    role="navigation"
    data-accordion="false">   <!-- false = nhiều menu cùng mở; true = accordion -->

  <!-- Header phân nhóm -->
  <li class="nav-header">MAIN MENU</li>

  <!-- Item đơn giản -->
  <li class="nav-item">
    <a href="index.html" class="nav-link active">
      <i class="nav-icon bi bi-speedometer2"></i>
      <p>Dashboard</p>
    </a>
  </li>

  <!-- Item có submenu (treeview) -->
  <li class="nav-item">
    <a href="#" class="nav-link">
      <i class="nav-icon bi bi-file-earmark-text"></i>
      <p>
        Posts
        <i class="nav-arrow bi bi-chevron-right"></i>  <!-- Mũi tên -->
      </p>
    </a>
    <ul class="nav nav-treeview">
      <li class="nav-item">
        <a href="posts/index.html" class="nav-link">
          <i class="nav-icon bi bi-circle"></i>
          <p>All Posts</p>
        </a>
      </li>
    </ul>
  </li>

  <!-- Item có badge -->
  <li class="nav-item">
    <a href="#" class="nav-link">
      <i class="nav-icon bi bi-bell"></i>
      <p>
        Notifications
        <span class="nav-badge badge text-bg-danger ms-auto">5</span>
        <i class="nav-arrow bi bi-chevron-right"></i>
      </p>
    </a>
  </li>

</ul>
```

### 5.3 Active state

Thêm class `active` vào `<a class="nav-link">` và `menu-open` vào `<li class="nav-item">` chứa submenu đang mở:

```html
<!-- Menu cha đang mở -->
<li class="nav-item menu-open">
  <a href="#" class="nav-link active">...</a>
  <ul class="nav nav-treeview">
    <!-- Item con đang active -->
    <li class="nav-item">
      <a href="posts/index.html" class="nav-link active">...</a>
    </li>
  </ul>
</li>
```

### 5.4 OverlayScrollbars cho Sidebar

Thêm custom scrollbar vào sidebar (tự động ẩn khi không scroll):

```javascript
document.addEventListener('DOMContentLoaded', function () {
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  // Chỉ áp dụng trên desktop, không áp dụng mobile
  if (sidebarWrapper && OverlayScrollbarsGlobal?.OverlayScrollbars !== undefined && window.innerWidth > 992) {
    OverlayScrollbarsGlobal.OverlayScrollbars(sidebarWrapper, {
      scrollbars: {
        theme: 'os-theme-light',   // 'os-theme-light' hoặc 'os-theme-dark'
        autoHide: 'leave',          // 'never' | 'scroll' | 'leave' | 'move'
        clickScroll: true,
      },
    });
  }
});
```

---

## 6. Header (Navbar)

### 6.1 Cấu trúc cơ bản

```html
<nav class="app-header navbar navbar-expand bg-body">
  <div class="container-fluid">

    <!-- Left side: toggle + nav links -->
    <ul class="navbar-nav">
      <!-- Toggle sidebar -->
      <li class="nav-item">
        <a class="nav-link" data-lte-toggle="sidebar" href="#" role="button">
          <i class="bi bi-list"></i>
        </a>
      </li>
    </ul>

    <!-- Right side: notifications, user dropdown -->
    <ul class="navbar-nav ms-auto">

      <!-- Fullscreen toggle -->
      <li class="nav-item">
        <a class="nav-link" href="#" data-lte-toggle="fullscreen">
          <i data-lte-icon="maximize" class="bi bi-arrows-fullscreen"></i>
          <i data-lte-icon="minimize" class="bi bi-fullscreen-exit" style="display:none"></i>
        </a>
      </li>

      <!-- Notification bell với badge -->
      <li class="nav-item dropdown">
        <a class="nav-link" data-bs-toggle="dropdown" href="#">
          <i class="bi bi-bell-fill"></i>
          <span class="navbar-badge badge text-bg-warning">3</span>
        </a>
        <div class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
          <span class="dropdown-item dropdown-header">3 Notifications</span>
          <div class="dropdown-divider"></div>
          <a href="#" class="dropdown-item">
            <i class="bi bi-envelope me-2"></i> 2 new messages
            <span class="float-end text-secondary fs-7">5 mins</span>
          </a>
          <div class="dropdown-divider"></div>
          <a href="#" class="dropdown-item dropdown-footer">See All Notifications</a>
        </div>
      </li>

      <!-- User menu -->
      <li class="nav-item dropdown user-menu">
        <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown">
          <img src="user.jpg" class="user-image rounded-circle shadow" alt="User" />
          <span class="d-none d-md-inline">Admin</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
          <li class="user-header text-bg-primary">
            <img src="user.jpg" class="rounded-circle shadow" alt="User" />
            <p>Admin <small>Administrator</small></p>
          </li>
          <li class="user-footer">
            <a href="#" class="btn btn-outline-secondary">Profile</a>
            <a href="login.html" class="btn btn-outline-danger float-end">Sign out</a>
          </li>
        </ul>
      </li>

    </ul>
  </div>
</nav>
```

### 6.2 Màu Header

```html
<!-- Trắng (mặc định) -->
<nav class="app-header navbar navbar-expand bg-body">

<!-- Xanh dương -->
<nav class="app-header navbar navbar-expand bg-primary" data-bs-theme="dark">

<!-- Tối -->
<nav class="app-header navbar navbar-expand bg-dark" data-bs-theme="dark">
```

---

## 7. Components

### 7.1 Small Box (Stat widgets)

```html
<div class="small-box text-bg-primary">   <!-- text-bg-success | warning | danger | info -->
  <div class="inner">
    <h3>150</h3>
    <p>New Orders</p>
  </div>
  <!-- Icon: dùng Bootstrap Icon hoặc SVG -->
  <i class="small-box-icon bi bi-cart-fill"></i>
  <!-- Footer link -->
  <a href="#" class="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover">
    More info <i class="bi bi-link-45deg"></i>
  </a>
</div>
```

### 7.2 Info Box

```html
<div class="info-box">
  <span class="info-box-icon text-bg-primary"><i class="bi bi-envelope"></i></span>
  <div class="info-box-content">
    <span class="info-box-text">Messages</span>
    <span class="info-box-number">1,410</span>
  </div>
</div>

<!-- Với progress bar -->
<div class="info-box">
  <span class="info-box-icon text-bg-success"><i class="bi bi-graph-up"></i></span>
  <div class="info-box-content">
    <span class="info-box-text">Sales</span>
    <span class="info-box-number">41,410</span>
    <div class="progress">
      <div class="progress-bar" style="width: 70%"></div>
    </div>
    <span class="progress-description">70% completed</span>
  </div>
</div>
```

### 7.3 Cards

```html
<!-- Card cơ bản -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <div class="card-tools">
      <!-- Collapse button -->
      <button type="button" class="btn btn-tool" data-lte-toggle="card-collapse">
        <i class="bi bi-dash-lg"></i>
      </button>
      <!-- Remove button -->
      <button type="button" class="btn btn-tool" data-lte-toggle="card-remove">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  </div>
  <div class="card-body">Content here</div>
  <div class="card-footer">Footer here</div>
</div>

<!-- Card màu outline -->
<div class="card card-primary card-outline">...</div>
<div class="card card-success card-outline">...</div>
<div class="card card-warning card-outline">...</div>
<div class="card card-danger card-outline">...</div>
```

### 7.4 Breadcrumb (App Content Header)

```html
<div class="app-content-header">
  <div class="container-fluid">
    <div class="row">
      <div class="col-sm-6">
        <h3 class="mb-0">Page Title</h3>
      </div>
      <div class="col-sm-6">
        <ol class="breadcrumb float-sm-end">
          <li class="breadcrumb-item"><a href="#">Home</a></li>
          <li class="breadcrumb-item"><a href="#">Section</a></li>
          <li class="breadcrumb-item active">Current Page</li>
        </ol>
      </div>
    </div>
  </div>
</div>
```

---

## 8. Dark Mode & Color Scheme

### 8.1 Dark mode toàn trang

Thêm attribute vào thẻ `<html>`:

```html
<!-- Light mode -->
<html lang="en" data-bs-theme="light">

<!-- Dark mode -->
<html lang="en" data-bs-theme="dark">

<!-- Tự động theo hệ thống -->
<html lang="en">
<!-- Thêm meta tag -->
<meta name="color-scheme" content="light dark" />
```

### 8.2 Toggle Dark/Light mode bằng JavaScript

```javascript
function toggleDarkMode() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-bs-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Khôi phục theme đã lưu khi load trang
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
});
```

### 8.3 Dark mode cho từng component

```html
<!-- Sidebar luôn dark dù page ở light mode -->
<aside class="app-sidebar" data-bs-theme="dark">

<!-- Card luôn dark -->
<div class="card" data-bs-theme="dark">

<!-- Dropdown luôn light -->
<div class="dropdown-menu" data-bs-theme="light">
```

---

## 9. Custom với SCSS Variables

### 9.1 Setup

Tạo file `custom.scss` và import AdminLTE:

```scss
// 1. Override Bootstrap variables trước
$primary:   #3d7fc1;
$success:   #28a745;
$font-size-base: 0.9rem;

// 2. Override AdminLTE variables
$lte-sidebar-width:     280px;  // mặc định 250px
$lte-transition-speed:  0.2s;   // mặc định 0.3s

// 3. Import AdminLTE (sẽ dùng các variable đã override)
@import "node_modules/admin-lte/src/scss/adminlte";

// 4. Thêm CSS custom của bạn
.my-custom-class {
  color: $primary;
}
```

### 9.2 Biến Sidebar quan trọng

```scss
// Kích thước
$lte-sidebar-width:               250px;     // Chiều rộng khi mở
$lte-sidebar-mini-width:          50px;      // Chiều rộng khi mini
$lte-sidebar-breakpoint:          lg;        // Breakpoint responsive

// Màu sidebar (light theme)
$lte-sidebar-color:               #555;      // Màu chữ menu
$lte-sidebar-hover-bg:            rgba(0,0,0,.1); // Màu nền khi hover
$lte-sidebar-menu-active-bg:      rgba(0,0,0,.1); // Màu nền item active
$lte-sidebar-menu-active-color:   #000;      // Màu chữ item active

// Màu sidebar (dark theme)
$lte-sidebar-color-dark:          #c2c7d0;
$lte-sidebar-hover-bg-dark:       rgba(255,255,255,.1);
$lte-sidebar-menu-active-color-dark: #fff;
```

### 9.3 Biến Header quan trọng

```scss
$lte-app-header-height:           57px;      // Chiều cao header
$lte-app-header-bottom-border-color: var(--bs-border-color);
$lte-zindex-app-header:           1034;      // z-index header
```

### 9.4 Biến khác

```scss
// Transition
$lte-transition-speed:            .3s;
$lte-transition-fn:               ease-in-out;

// Card
$lte-card-shadow:                 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
$lte-card-title-font-size:        1.1rem;

// Z-index
$lte-zindex-sidebar:              1038;
$lte-zindex-fixed-header:         1030;
```

### 9.5 Override CSS thông thường (không cần SCSS)

Nếu chỉ cần thay đổi nhỏ, có thể dùng CSS thường sau khi load adminlte.css:

```html
<link rel="stylesheet" href="adminlte.min.css" />
<style>
  /* Thay màu sidebar */
  .app-sidebar {
    background-color: #1e3a5f !important;
  }

  /* Thay màu brand text */
  .brand-text {
    color: #ffd700 !important;
  }

  /* Thay chiều rộng sidebar */
  :root {
    --lte-sidebar-width: 270px;
  }

  /* Custom brand link */
  .brand-link {
    border-bottom: 1px solid rgba(255,255,255,.1);
    padding: 1rem 0.5rem;
  }
</style>
```

---

## 10. JavaScript API

### 10.1 Sidebar Toggle

Điều khiển sidebar bằng JavaScript:

```javascript
// Toggle sidebar (mở/đóng)
document.querySelector('[data-lte-toggle="sidebar"]').click();

// Hoặc dispatch event trực tiếp trên .app-wrapper
const wrapper = document.querySelector('.app-wrapper');

// Collapse sidebar
wrapper.classList.add('sidebar-collapse');

// Expand sidebar
wrapper.classList.remove('sidebar-collapse');

// Toggle
wrapper.classList.toggle('sidebar-collapse');
```

### 10.2 Lắng nghe sự kiện Sidebar

```javascript
const sidebar = document.querySelector('.app-sidebar');

// Khi sidebar mở
sidebar.addEventListener('open.lte.push-menu', function() {
  console.log('Sidebar opened');
});

// Khi sidebar đóng
sidebar.addEventListener('collapse.lte.push-menu', function() {
  console.log('Sidebar collapsed');
});
```

### 10.3 Card Widget Controls

Các nút điều khiển card dùng `data-lte-toggle`:

```html
<!-- Collapse card content -->
<button data-lte-toggle="card-collapse">
  <i class="bi bi-dash-lg"></i>
</button>

<!-- Remove/close card -->
<button data-lte-toggle="card-remove">
  <i class="bi bi-x-lg"></i>
</button>

<!-- Fullscreen card -->
<button data-lte-toggle="card-fullscreen">
  <i class="bi bi-arrows-fullscreen"></i>
</button>
```

### 10.4 Fullscreen Toggle

```html
<a data-lte-toggle="fullscreen">
  <i data-lte-icon="maximize" class="bi bi-arrows-fullscreen"></i>
  <i data-lte-icon="minimize" class="bi bi-fullscreen-exit" style="display:none"></i>
</a>
```

### 10.5 Treeview (Sidebar accordion)

Treeview được kích hoạt tự động khi có `data-lte-toggle="treeview"`. Điều khiển:

```javascript
// data-accordion="false" = nhiều menu cùng mở
// data-accordion="true"  = chỉ 1 menu mở tại một thời điểm

// Mở menu programmatically
const menuItem = document.querySelector('.nav-item');
menuItem.classList.add('menu-open');
menuItem.querySelector('.nav-link').classList.add('active');
```

---

## 11. Tips & Best Practices

### 11.1 Tổ chức file cho dự án thực tế

```
blog-admin/
├── index.html
├── login.html
├── posts/
├── categories/
├── users/
├── assets/
│   ├── css/
│   │   └── custom.css      ← CSS override của bạn
│   ├── js/
│   │   └── app.js          ← Logic JS của bạn
│   └── img/
│       └── logo.png        ← Logo riêng
└── ADMINLTE-GUIDE.md
```

### 11.2 Thêm logo riêng

```html
<div class="sidebar-brand">
  <a href="index.html" class="brand-link">
    <!-- Thay AdminLTE logo bằng logo của bạn -->
    <img src="assets/img/logo.png" alt="Blog Logo"
         class="brand-image opacity-75 shadow"
         style="max-height: 33px; width: auto;" />
    <span class="brand-text fw-bold">My Blog</span>
  </a>
</div>
```

### 11.3 Đánh dấu active menu theo URL hiện tại

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath ||
        currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active');
      // Mở parent menu nếu có
      const parentItem = link.closest('.nav-treeview')?.closest('.nav-item');
      if (parentItem) {
        parentItem.classList.add('menu-open');
        parentItem.querySelector(':scope > .nav-link')?.classList.add('active');
      }
    }
  });
});
```

### 11.4 Responsive — Hide sidebar trên mobile

AdminLTE tự xử lý responsive. Sidebar sẽ:
- **Desktop (`>= lg`)**: Luôn hiển thị, có thể collapse
- **Mobile (`< lg`)**: Ẩn mặc định, click hamburger để mở overlay

Không cần thêm CSS gì thêm.

### 11.5 Các class utility hay dùng

```html
<!-- Font size nhỏ (AdminLTE custom) -->
<span class="fs-7">Smaller text</span>

<!-- Badge trên navbar icon -->
<span class="navbar-badge badge text-bg-danger">5</span>

<!-- Nav badge trong sidebar -->
<span class="nav-badge badge text-bg-info me-3">New</span>

<!-- Dropdown footer link -->
<a href="#" class="dropdown-item dropdown-footer">See All</a>

<!-- Dropdown header -->
<span class="dropdown-item dropdown-header">Title</span>
```

### 11.6 Performance

- Dùng `adminlte.min.css` và `adminlte.min.js` trên production
- Thêm `preload` cho CSS chính:
  ```html
  <link rel="preload" href="adminlte.min.css" as="style" />
  ```
- Font Source Sans 3 nên load với `media="print" onload="this.media='all'"` để không block render

---

## Tài liệu tham khảo

- [AdminLTE Official Docs](https://adminlte.io/docs/4.x/)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [OverlayScrollbars](https://kingsora.github.io/OverlayScrollbars/)
- [AdminLTE GitHub](https://github.com/ColorlibHQ/AdminLTE)
- [jsDelivr CDN](https://www.jsdelivr.com/package/npm/admin-lte)
