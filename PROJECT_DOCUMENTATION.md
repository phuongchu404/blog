# Blog Platform – Tài liệu Kỹ thuật Toàn diện

> **Phiên bản:** 1.0 | **Ngày cập nhật:** 2026-04-10  
> **Tech stack:** Spring Boot 3.4.5 · MySQL 8 · Redis · Kafka · Elasticsearch · MinIO · Vanilla JS

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Backend – blog-backend](#3-backend--blog-backend)
   - [Cấu trúc thư mục](#31-cấu-trúc-thư-mục)
   - [Entities & Database Schema](#32-entities--database-schema)
   - [API Endpoints](#33-api-endpoints)
   - [Services – Nghiệp vụ chính](#34-services--nghiệp-vụ-chính)
   - [Bảo mật (Security)](#35-bảo-mật-security)
4. [Admin Frontend – blog-admin](#4-admin-frontend--blog-admin)
5. [Public Frontend – blog-public](#5-public-frontend--blog-public)
6. [Luồng dữ liệu (Data Flow)](#6-luồng-dữ-liệu-data-flow)
7. [Hệ thống thông báo (Kafka + Notification)](#7-hệ-thống-thông-báo-kafka--notification)
8. [Xác thực & Phân quyền (Auth & RBAC)](#8-xác-thực--phân-quyền-auth--rbac)
9. [Định dạng API Response](#9-định-dạng-api-response)
10. [Hạ tầng & Cấu hình](#10-hạ-tầng--cấu-hình)

---

## 1. Tổng quan hệ thống

Blog Platform là ứng dụng blog đa người dùng với các tính năng:

| Tính năng | Mô tả |
|-----------|-------|
| **Quản lý bài viết** | Tạo, sửa, xóa, xuất bản bài với trạng thái Draft / Published / Archived |
| **Phân loại nội dung** | Danh mục (Category) phân cấp cha–con, Nhãn (Tag) phẳng |
| **Bình luận có kiểm duyệt** | Bình luận lồng nhau (replies), duyệt/từ chối trước khi công khai |
| **Tìm kiếm thông minh** | Elasticsearch làm primary, fallback về MySQL LIKE |
| **Lưu trữ file** | Ảnh upload qua MinIO; tracking orphaned files |
| **Thống kê lượt xem** | Redis counter → sync định kỳ xuống MySQL |
| **Thông báo real-time** | Kafka event-driven notifications |
| **Phân quyền chi tiết** | RBAC với permission dạng `resource:action` |
| **Đăng nhập OAuth2** | Hỗ trợ Google login |
| **Audit log** | Ghi log mọi hành động quan trọng, export CSV |

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  blog-public     │         │       blog-admin             │  │
│  │  (Vanilla JS)    │         │  (Vanilla JS + AdminLTE)     │  │
│  └────────┬─────────┘         └──────────────┬───────────────┘  │
└───────────┼──────────────────────────────────┼─────────────────┘
            │  HTTP REST (Bearer JWT)           │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   blog-backend  (Spring Boot :8055)             │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │ Controllers│  │  Services  │  │  Security (JWT + OAuth2) │  │
│  └─────┬──────┘  └─────┬──────┘  └──────────────────────────┘  │
│        │               │                                        │
│        └───────┬────────┘                                       │
│                ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Data Layer                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │  MySQL   │  │  Redis   │  │  MinIO   │  │  JPA   │  │   │
│  │  │  :3307   │  │  :6379   │  │  :9000   │  │ Repos  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌────────────────────────────┐  │
│  │   Kafka Producer         │  │   Kafka Consumers          │  │
│  │  (PostEvent,CommentEvent)│  │  (ES Sync, Notification)   │  │
│  └─────────────┬────────────┘  └────────────────────────────┘  │
└────────────────┼────────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │   Apache Kafka :9092   │
    │   topic: blog.events.post    │
    │   topic: blog.events.comment │
    └────────────────────────┘
                 │
    ┌────────────┴───────────┐
    ▼                        ▼
┌──────────────────┐  ┌───────────────────────┐
│  Elasticsearch   │  │  Notification Service │
│  :9200           │  │  (DB + in-app notifs) │
│  Index: posts    │  └───────────────────────┘
└──────────────────┘
```

---

## 3. Backend – blog-backend

### 3.1 Cấu trúc thư mục

```
blog-backend/src/main/java/me/phuongcm/blog/
│
├── advice/                  # GlobalExceptionHandler – xử lý lỗi toàn cục
├── annotation/              # @Auditable – annotation đánh dấu method cần audit
├── aspect/                  # AuditAspect – AOP tự động ghi audit log
│
├── common/
│   ├── exception/           # Custom exceptions (ResourceNotFoundException, v.v.)
│   └── utils/               # Enums (PostStatus, CommentStatus), constants
│
├── config/                  # Spring configurations
│   ├── WebSecurityConfig    # JWT Filter, CORS, permit rules
│   ├── KafkaConfig          # Producer/Consumer factory
│   ├── ElasticsearchConfig  # ES client setup
│   ├── RedisConfig          # Redis template
│   └── MinIOConfig          # MinIO client
│
├── controller/              # REST controllers (14 controllers)
├── dto/                     # DTOs + MapStruct mappers
├── entity/                  # JPA entities (20+ bảng)
├── repository/              # Spring Data JPA repositories
│
├── security/
│   ├── JwtUtil              # Tạo/validate JWT
│   ├── JwtAuthFilter        # Filter kiểm tra token mỗi request
│   ├── CustomUserDetailsService
│   ├── CustomOAuth2UserService        # Xử lý Google login
│   ├── OAuth2AuthenticationSuccessHandler
│   └── RefreshTokenService  # Quản lý refresh token
│
└── service/
    ├── impl/                # Implementations
    ├── KafkaProducerService # Gửi events lên Kafka
    ├── ElasticsearchSyncService  # Consumer: sync ES index
    ├── NotificationService       # Consumer: tạo notification
    ├── MinIOService         # Upload/delete file
    ├── UploadTrackerService # Tracking orphaned uploads
    └── ViewCountSyncScheduler    # Cron job sync view count
```

---

### 3.2 Entities & Database Schema

#### Sơ đồ quan hệ (ERD tóm tắt)

```
user ──< user_role >── role ──< role_permission >── permission
 │
 ├──< post (author_id)
 │     ├──< post_category >── category (self-ref parent_id)
 │     ├──< post_tag      >── tag
 │     ├──< post_meta
 │     └──< post_comment (parent_id self-ref)
 │
 └──< notification (recipient_id)

refresh_token ──> user
audit_log ──> user
upload_tracker (độc lập, quản lý file upload)
```

#### Chi tiết từng Entity

**`user`** – Tài khoản người dùng
```
id, username, password (BCrypt), email, full_name
first_name, last_name, middle_name, mobile
status, image_url
provider (LOCAL | GOOGLE), provider_id   ← OAuth2
intro, profile (text)
last_login, created_at, updated_at
```

**`post`** – Bài viết
```
id, author_id (FK → user), parent_id (self-ref)
title, slug (UNIQUE)
summary (excerpt), content (longtext)
status:  0=Draft | 1=Published | 2=Archived
image_url (featured image)
view_count, created_at, updated_at, published_at
```
> **Lưu ý:** `meta_title`, `meta_description`, `meta_keywords` đã được chuyển
> hoàn toàn sang bảng `post_meta` (key-value). PostDTO vẫn expose 3 field này
> nhưng backend đọc/ghi qua `PostMetaService`.

**`post_comment`** – Bình luận
```
id, post_id (FK), user_id (FK), parent_id (self-ref ← replies)
title, content
published: false=Pending | true=Approved
created_at, published_at
```

**`category`** – Danh mục (phân cấp)
```
id, parent_id (self-ref), title, slug (UNIQUE)
meta_title, content, image_url
```

**`tag`** – Nhãn (phẳng)
```
id, title, slug (UNIQUE), meta_title, content
```

**`role`** / **`permission`** – Phân quyền
```
role:       id, name (e.g. ROLE_ADMIN), description
permission: id, name (e.g. "post:create"), tag, type, method, pattern
            is_white_list (bỏ qua security check nếu true)
```

**`refresh_token`** – JWT Refresh
```
id, user_id (FK), token (UUID), expiry_date (7 ngày)
```

**`notification`** – Thông báo
```
id, recipient_id (FK → user)
type: NEW_COMMENT | REPLY_COMMENT
message, post_id, post_slug, post_title, comment_id
is_read (boolean), created_at
```

**`audit_log`** – Lịch sử hành động
```
id, user_id, username, action (CREATE/UPDATE/DELETE/PUBLISH/LOGIN…)
resource, resource_id, detail (JSON)
ip_address, status (SUCCESS/FAIL), duration_ms, error_message
created_at
```

**`upload_tracker`** – Theo dõi file upload
```
id, file_name, file_url
status: UNUSED | USED
created_at
```

**`post_meta`** – Key-value metadata mở rộng cho bài viết
```
id, post_id (FK → post), key (varchar 50), content (TEXT)
```
Các key SEO chuẩn được hệ thống tự quản lý:

| Key | Ý nghĩa | Tương đương cũ |
|-----|---------|---------------|
| `metaTitle` | SEO title (≤100 ký tự) | `post.meta_title` (đã xóa) |
| `metaDescription` | SEO description (≤160 ký tự) | `post.meta_description` (đã xóa) |
| `metaKeywords` | SEO keywords | `post.meta_keywords` (đã xóa) |

Có thể thêm bất kỳ key tùy chỉnh nào qua `PUT /api/posts/{id}/meta/{key}`.

**`PostDocument`** (Elasticsearch, không lưu MySQL)
```
id (String), postId, title, slug, summary, content
authorName, status
```

---

### 3.3 API Endpoints

#### Auth – `/auth`
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/auth/login` | Public | Đăng nhập, trả về JWT + refresh token |
| POST | `/auth/register` | Public | Đăng ký tài khoản mới |
| GET  | `/auth/me` | Authenticated | Lấy thông tin user hiện tại |
| POST | `/auth/refresh` | Public | Làm mới access token |
| POST | `/auth/logout` | Authenticated | Đăng xuất, xóa refresh token |
| POST | `/auth/change-password` | Authenticated | Đổi mật khẩu |

#### Posts – `/api/posts`
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/posts` | `post:read:all` | Tất cả bài (admin) |
| GET | `/api/posts/published` | Public | Bài đã xuất bản |
| GET | `/api/posts/{id}` | Public | Chi tiết bài theo ID |
| GET | `/api/posts/slug/{slug}` | Public | Chi tiết bài theo slug |
| GET | `/api/posts/search?keyword=` | Public | Tìm kiếm bài viết |
| GET | `/api/posts/author/{authorId}` | Public | Bài của tác giả |
| GET | `/api/posts/category/{categorySlug}` | Public | Bài theo danh mục |
| GET | `/api/posts/tag/{tagSlug}` | Public | Bài theo nhãn |
| POST | `/api/posts` | `post:create` | Tạo bài mới |
| PUT | `/api/posts/{id}` | `post:update:any` | Cập nhật bài |
| DELETE | `/api/posts/{id}` | `post:delete:any` | Xóa bài |
| PUT | `/api/posts/{id}/publish` | `post:publish` | Xuất bản bài |
| PUT | `/api/posts/{id}/unpublish` | `post:publish` | Hủy xuất bản |

#### Comments – `/api/comments`
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/comments` | `comment:read:all` | Tất cả bình luận (admin) |
| GET | `/api/comments/post/{postId}` | `comment:read:all` | BL của bài (admin) |
| GET | `/api/comments/post/{postId}/published` | Public | BL đã duyệt |
| GET | `/api/comments/{id}/replies` | Public | Replies của bình luận |
| POST | `/api/comments` | `comment:create` | Tạo bình luận |
| PUT | `/api/comments/{id}` | `comment:update:any` | Sửa bình luận |
| DELETE | `/api/comments/{id}` | `comment:delete:any` | Xóa bình luận |
| PUT | `/api/comments/{id}/approve` | `comment:moderate` | Duyệt bình luận |
| PUT | `/api/comments/{id}/reject` | `comment:moderate` | Từ chối bình luận |

#### Users, Roles, Permissions, Categories, Tags
*(Pattern tương tự – CRUD chuẩn với permission check tương ứng)*

| Resource | Base path | Permission prefix |
|----------|-----------|------------------|
| Users | `/api/users` | `user:` |
| Roles | `/api/roles` | `role:` |
| Permissions | `/api/permissions` | `permission:` |
| Categories | `/api/categories` | `category:` |
| Tags | `/api/tags` | `tag:` |

#### Notifications – `/api/notifications`
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/notifications` | Authenticated | Danh sách thông báo (phân trang) |
| GET | `/api/notifications/unread-count` | Authenticated | Số chưa đọc |
| PUT | `/api/notifications/{id}/read` | Authenticated | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | Authenticated | Đọc tất cả |

#### Files & Audit
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/files/upload` | Authenticated | Upload ảnh lên MinIO |
| GET | `/api/admin/audit-logs` | Admin | Xem audit log |
| GET | `/api/admin/audit-logs/export` | Admin | Export CSV |

---

### 3.4 Services – Nghiệp vụ chính

#### PostServiceImpl
```
createPost(PostDTO):
  1. Generate slug từ title (nếu slug rỗng)
  2. Lưu Post vào MySQL (không ghi meta SEO vào post table)
  3. Liên kết tags (PostTag) và categories (PostCategory)
  4. Nếu status=PUBLISHED → set publishedAt = now
  5. saveMetaFields(): upsert metaTitle/Description/Keywords vào post_meta
  6. Scan content để mark UploadTracker → USED
  7. Send PostEvent(CREATED) → Kafka topic "blog.events.post"
  8. enrichWithMeta(): đọc lại post_meta → gắn vào PostDTO response

updatePost(id, PostDTO):
  1. Fetch bài hiện tại
  2. Cập nhật fields (không ghi meta SEO vào post table)
  3. Đồng bộ lại tags/categories (xóa cũ, thêm mới)
  4. saveMetaFields(): upsert metaTitle/Description/Keywords vào post_meta
  5. Send PostEvent(UPDATED) → Kafka

deletePost(id):
  1. Soft delete hoặc hard delete bài
  2. Send PostEvent(DELETED) → Kafka

searchPosts(keyword):
  1. Thử query Elasticsearch → lấy postIds
  2. Fetch posts MySQL WHERE id IN (postIds) AND status=1
  3. Nếu ES lỗi hoặc không có kết quả → fallback MySQL LIKE

getPostBySlug(slug):
  1. Lấy bài từ MySQL
  2. Tăng Redis counter: INCR post:view:{id}
  3. Trả về PostDTO
```

#### CommentServiceImpl
```
createComment(CommentDTO):
  1. Lưu PostComment với published=false
  2. Send CommentEvent → Kafka topic "blog.events.comment"
  
approveComment(id):
  1. Set published=true, publishedAt=now
  
rejectComment(id):
  1. Set published=false
```

#### ElasticsearchSyncService (Kafka Consumer)
```
@KafkaListener("blog.events.post"):
  CREATED | UPDATED → index/upsert PostDocument vào ES
  DELETED → delete document khỏi ES index
```

#### NotificationService (Kafka Consumer)
```
@KafkaListener("blog.events.comment"):
  1. Lấy thông tin post, comment, parentComment
  2. Tạo notification cho tác giả bài (nếu không tự comment)
     type = NEW_COMMENT
  3. Nếu là reply → tạo notification cho tác giả comment cha
     (nếu không phải tự reply chính mình)
     type = REPLY_COMMENT
  4. Lưu vào bảng notification
```

#### ViewCountSyncScheduler
```
@Scheduled(fixedRate = 5 phút):
  1. Lấy tất cả keys Redis: post:view:*
  2. Với mỗi key → UPDATE post SET view_count += value WHERE id = ?
  3. Xóa key Redis sau khi sync
```

#### UploadTrackerService
```
trackUpload(fileUrl):
  → INSERT upload_tracker(file_url, status=UNUSED)

markUsed(post):
  → Scan post.imageUrl + post.content tìm URLs
  → UPDATE upload_tracker SET status=USED WHERE file_url IN (urls)

cleanupOrphaned() [@Scheduled]:
  → Tìm UNUSED entries cũ hơn N ngày
  → Xóa file khỏi MinIO
  → Xóa record khỏi DB
```

---

### 3.5 Bảo mật (Security)

#### JWT Authentication Flow

```
Login Request
    │
    ▼
AuthController.login()
    │  validate username + password (BCrypt)
    ▼
JwtUtil.generateToken(username, roles)
    │  → Access Token (1 giờ)
    │
RefreshTokenService.createRefreshToken()
    │  → Refresh Token (7 ngày, lưu DB)
    ▼
Response: { accessToken, refreshToken, expiresIn }
    │
    ▼  (client lưu localStorage)

Mỗi request tiếp theo:
    Header: Authorization: Bearer {accessToken}
    │
    ▼
JwtAuthFilter
    │  extract + validate JWT
    │  load UserDetails → set SecurityContext
    ▼
Controller → @PreAuthorize check permission
```

#### Token Auto-Refresh (Frontend)

```
Request trả về 401
    │
    ▼
http.js interceptor gọi Auth.refresh()
    │  POST /auth/refresh { refreshToken }
    ▼
Nhận accessToken mới → lưu localStorage
    │
    ▼
Retry request gốc với token mới
    │
    ▼  (Nếu refresh cũng fail → redirect /login.html)
```

#### OAuth2 Google Flow

```
User click "Login with Google"
    │
    ▼
Redirect → /oauth2/authorize?client_name=google
    │
    ▼  (Google authorization page)
Redirect back → /login/oauth2/code/google
    │
    ▼
CustomOAuth2UserService.loadUser()
    │  Tạo/cập nhật User với provider=GOOGLE, providerId=googleId
    ▼
OAuth2SuccessHandler → JwtUtil.generateToken()
    │
    ▼
Redirect về frontend kèm token
```

#### RBAC (Role-Based Access Control)

**Phân cấp quyền:**
```
User → [ROLE_USER, ROLE_ADMIN, ...] → [permission1, permission2, ...]
```

**Format permission:** `{resource}:{action}` hoặc `{resource}:{action}:{scope}`

| Permission | Ý nghĩa |
|-----------|---------|
| `post:create` | Tạo bài viết |
| `post:update:any` | Sửa bất kỳ bài nào |
| `post:delete:any` | Xóa bất kỳ bài nào |
| `post:publish` | Xuất bản/hủy xuất bản |
| `post:read:all` | Xem tất cả bài kể cả draft |
| `comment:moderate` | Duyệt/từ chối bình luận |
| `user:assign-role` | Gán role cho user |
| `role:assign` | Gán permission cho role |

**Hai lớp kiểm tra:**
1. `HttpSecurity` → endpoint-level (public / authenticated)
2. `@PreAuthorize("hasAuthority('post:publish')")` → method-level (fine-grained)

---

## 4. Admin Frontend – blog-admin

### Cấu trúc

```
blog-admin/
├── index.html               # Dashboard – thống kê tổng quan
├── login.html               # Đăng nhập admin
├── posts/
│   ├── index.html           # Danh sách bài viết
│   └── create.html          # Tạo/sửa bài (CKEditor 5)
├── categories/index.html    # Quản lý danh mục
├── comments/index.html      # Kiểm duyệt bình luận
├── tags/index.html          # Quản lý nhãn
├── users/index.html         # Quản lý người dùng
├── roles/index.html         # Quản lý vai trò
├── permissions/index.html   # Quản lý quyền
├── profile.html             # Hồ sơ admin
├── settings.html            # Cài đặt hệ thống
└── js/
    ├── http.js              # HTTP client (auto-refresh token)
    ├── auth.js              # Login / logout / guard
    ├── ui.js                # Toast, confirm dialog, toSlug
    ├── *.service.js         # Service layers (7 services)
    └── pages/
        ├── dashboard.js
        ├── posts-index.js
        ├── posts-create.js
        ├── categories.js
        ├── comments.js
        ├── users.js
        ├── roles.js
        ├── permissions.js
        ├── tags.js
        └── audit-logs.js
```

### Kiến trúc JavaScript

```
Page JS (e.g. categories.js)
    │  gọi service methods
    ▼
*.service.js  (e.g. category.service.js)
    │  gọi Http.get/post/put/delete
    ▼
http.js  (Http client)
    │  thêm Authorization header
    │  unwrap ApiResponse wrapper → trả về data
    │  handle 401 → auto-refresh token
    ▼
Backend API (:8055)
```

### Tính năng từng trang

**Dashboard (index.html)**
- Hiển thị: tổng bài viết, danh mục, người dùng, bình luận
- Load song song dùng `Promise.allSettled()`
- Danh sách bài mới + bình luận chờ duyệt

**Post Editor (posts/create.html)**
- CKEditor 5 v43 – rich text editor
- Custom UploadAdapter: ảnh paste/upload → POST `/api/files/upload` → MinIO
- TomSelect: chọn nhiều tags
- Chọn category (checkbox)
- SEO fields: meta title, description, keywords
- Auto-generate slug từ title
- Actions: Save Draft | Publish | Archive
- Ảnh đại diện (featured image) với preview

**Comment Moderation (comments/index.html)**
- Table bình luận với cột: nội dung, tác giả, bài viết, trạng thái
- Actions: Duyệt / Từ chối / Xóa ngay trên bảng
- Hiển thị replies lồng nhau

**Role & Permission Management**
- Tạo role → gán checklist permissions
- Thay đổi role → cập nhật permission set ngay lập tức

---

## 5. Public Frontend – blog-public

### Cấu trúc

```
blog-public/
├── index.html           # Trang chủ – bài nổi bật + mới nhất
├── blog.html            # Tất cả bài viết (phân trang)
├── post.html            # Đọc bài + bình luận
├── category.html        # Bài theo danh mục
├── tag.html             # Bài theo nhãn
├── author.html          # Trang tác giả
├── search/              # Kết quả tìm kiếm
├── login.html           # Đăng nhập
├── register.html        # Đăng ký
├── profile.html         # Hồ sơ người dùng
└── js/
    ├── http.js
    ├── auth.js / auth-pages.js
    ├── ui.js
    ├── *.service.js
    └── pages/
        ├── index.js
        ├── blog.js
        ├── post.js      # Đọc bài + comment + reply
        ├── category.js
        ├── tag.js
        ├── author.js
        └── search.js
```

### Tính năng chính

**Trang chủ (index.html)**
- Hero section với bài nổi bật
- Grid bài viết mới nhất
- Sidebar: danh mục, nhãn phổ biến
- Search bar

**Đọc bài (post.html)**
- Render HTML content từ CKEditor
- Thông tin tác giả + avatar
- Phần bình luận:
  - Hiển thị bình luận (chỉ published=true)
  - Form gửi bình luận (yêu cầu đăng nhập)
  - Button Reply → nested reply form
  - Hiển thị replies lồng nhau

**Tìm kiếm (search/)**
- Gọi `GET /api/posts/search?keyword=`
- Elasticsearch → MySQL fallback tự động ở backend

---

## 6. Luồng dữ liệu (Data Flow)

### 6.1 Tạo bài viết

```
Admin mở posts/create.html
    │
    │  1. Upload ảnh nội tuyến (paste vào CKEditor)
    ▼
POST /api/files/upload
    → MinIO lưu file
    → UploadTracker insert (status=UNUSED)
    → Trả về URL ảnh
    │
    │  2. Submit form bài viết
    ▼
POST /api/posts
    Body: { title, content, imageUrl, tagIds[], categoryIds[], status, meta... }
    │
    ▼
PostService.createPost()
    ├─ Generate slug (nếu trống)
    ├─ INSERT into post
    ├─ INSERT into post_tag (M2M)
    ├─ INSERT into post_category (M2M)
    ├─ Nếu status=1: publishedAt = NOW()
    ├─ Scan URLs → mark UploadTracker USED
    └─ Kafka.send("blog.events.post", PostEvent{type=CREATED, postId})
               │
               ▼
        ElasticsearchSyncService
        → ES index "posts" upsert document
    │
    ▼
Trả về PostDTO (kèm tags đầy đủ, categories đầy đủ)
Admin thấy toast "Tạo bài thành công"
```

### 6.2 Đọc bài và đếm lượt xem

```
User mở post.html?slug=my-article
    │
    ▼
GET /api/posts/slug/my-article
    │
    ▼
PostService.getPostBySlug("my-article")
    ├─ SELECT * FROM post WHERE slug='my-article' AND status=1
    ├─ Redis: INCR post:view:{id}   ← không block response
    └─ Trả về PostDTO
    │
    ▼  (mỗi 5 phút)
ViewCountSyncScheduler
    ├─ Đọc tất cả post:view:* từ Redis
    ├─ UPDATE post SET view_count = view_count + delta
    └─ DEL key Redis
```

### 6.3 Gửi bình luận và thông báo

```
User đọc bài → gõ bình luận → Submit
    │
    ▼
POST /api/comments
    Body: { postId, content, parentId (nếu reply) }
    │
    ▼
CommentService.createComment()
    ├─ INSERT post_comment (published=false)
    └─ Kafka.send("blog.events.comment", CommentEvent{commentId, postId, userId, parentCommentId})
               │
               ▼
        NotificationService (Kafka Consumer)
        │
        ├─ Lấy tác giả bài: nếu tác giả ≠ người comment
        │    → INSERT notification(recipient=tác giả, type=NEW_COMMENT)
        │
        └─ Nếu có parentComment và tác giả cha ≠ người comment
             → INSERT notification(recipient=tác giả cha, type=REPLY_COMMENT)

Admin vào comments/ → Approve bình luận
    │
    ▼
PUT /api/comments/{id}/approve
    → UPDATE post_comment SET published=true, published_at=NOW()

Public thấy bình luận khi GET /api/comments/post/{postId}/published
```

### 6.4 Tìm kiếm bài viết

```
User gõ keyword → Enter
    │
    ▼
GET /api/posts/search?keyword=spring+boot
    │
    ▼
PostService.searchPosts("spring boot")
    │
    ├─ [Thử 1] Elasticsearch query:
    │    { match: { title | summary | content: "spring boot" } }
    │    → Lấy danh sách postIds
    │    → SELECT * FROM post WHERE id IN (ids) AND status=1
    │    → Trả về nếu có kết quả
    │
    └─ [Fallback] MySQL LIKE:
         SELECT * FROM post
         WHERE (title LIKE '%spring boot%' OR content LIKE '%spring boot%')
           AND status=1
```

### 6.5 Upload file và dọn dẹp orphan

```
CKEditor paste ảnh
    │
    ▼
POST /api/files/upload (multipart)
    ├─ MinIO.putObject(bucket, filename, stream)
    ├─ UploadTracker.insert(url, status=UNUSED)
    └─ Trả về { url: "http://minio:9000/public-bucket/abc.png" }

Khi lưu bài:
    PostService scan imageUrl + content
    → Tìm URLs khớp upload_tracker
    → UPDATE status=USED

Background job (hàng đêm):
    → Tìm upload_tracker WHERE status=UNUSED AND created_at < 24h trước
    → MinIO.removeObject(url)
    → DELETE FROM upload_tracker
```

---

## 7. Hệ thống thông báo (Kafka + Notification)

### Kafka Topics

| Topic | Producer | Consumer | Mục đích |
|-------|----------|----------|----------|
| `blog.events.post` | PostService | ElasticsearchSyncService | Sync ES index |
| `blog.events.comment` | CommentService | NotificationService | Tạo notification |

### CommentEvent

```json
{
  "commentId": 42,
  "postId": 10,
  "postAuthorId": 3,
  "commenterId": 7,
  "parentCommentId": null,
  "parentCommentAuthorId": null,
  "eventType": "CREATED"
}
```

### Notification trong Admin

```
Admin Header → Bell icon → [3]  ← unread count (polling mỗi 30s)
    │
    Click bell
    ▼
GET /api/notifications?page=0&size=10
    → Danh sách notification, mới nhất trên đầu

Click notification
    → PUT /api/notifications/{id}/read
    → Redirect đến bài/bình luận tương ứng
```

---

## 8. Xác thực & Phân quyền (Auth & RBAC)

### Vòng đời Token

```
accessToken:   1 giờ   (configurable, 30 ngày nếu remember-me)
refreshToken:  7 ngày  (lưu bảng refresh_token, xóa khi logout)
```

### Storage phía Client

```javascript
localStorage.setItem('token', accessToken)
localStorage.setItem('refreshToken', refreshToken)
localStorage.setItem('user', JSON.stringify(userInfo))
```

### Kiểm tra quyền trong Controller

```java
// Chỉ cần authenticated
@GetMapping("/me")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> getMe() { ... }

// Cần permission cụ thể
@PutMapping("/{id}/publish")
@PreAuthorize("hasAuthority('post:publish')")
public ResponseEntity<?> publishPost(...) { ... }

// Public
@GetMapping("/published")
public ResponseEntity<?> getPublished() { ... }
```

---

## 9. Định dạng API Response

### Thành công

```json
{
  "success": true,
  "message": "Tạo bài viết thành công",
  "data": {
    "id": 42,
    "title": "Hướng dẫn Spring Boot",
    "slug": "huong-dan-spring-boot",
    "status": 1,
    "tags": [...],
    "categories": [...]
  }
}
```

### Lỗi

```json
{
  "success": false,
  "message": "Không tìm thấy bài viết với id=99",
  "data": null
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công (GET/PUT) |
| 201 | Tạo mới thành công (POST) |
| 204 | Xóa thành công (DELETE) |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không có quyền |
| 404 | Không tìm thấy resource |
| 500 | Lỗi server |

### Frontend unwrap response

`http.js` tự động unwrap: nếu `response.success === true` → trả về `response.data`, ngược lại throw error với `response.message`.

---

## 10. Hạ tầng & Cấu hình

### Services cần chạy (Local Development)

| Service | Port | Mục đích |
|---------|------|---------|
| MySQL 8.0 | 3307 | Primary database |
| Redis | 6379 | View count cache, session |
| Apache Kafka | 9092 | Event streaming |
| Elasticsearch | 9200 | Full-text search |
| MinIO | 9000 | Object storage (file/image) |
| Spring Boot App | 8055 | Backend API |

### application.yml – Cấu hình chính

```yaml
server:
  port: 8055

spring:
  datasource:
    url: jdbc:mysql://localhost:3307/blog
    username: root
    password: 123456
  jpa:
    hibernate:
      ddl-auto: update      # Tự động migrate schema

  kafka:
    bootstrap-servers: localhost:9092
    topics:
      post: blog.events.post
      comment: blog.events.comment

  data:
    redis:
      host: localhost
      port: 6379
    elasticsearch:
      cluster-nodes: http://localhost:9200

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}

app:
  jwt:
    secret: ${JWT_SECRET}
    token-validity: 3600000          # 1 giờ
    remember-me-validity: 2592000000 # 30 ngày
    refresh-validity: 604800000      # 7 ngày

minio:
  url: http://localhost:9000
  access-key: phuongchu404
  secret-key: Phuong1590@
  public-bucket: public-bucket
  private-bucket: private-bucket
```

### Các file khởi tạo Database

| File | Mô tả |
|------|-------|
| `blog.sql` | Schema cũ (legacy) |
| `init_blog_sql.sql` | Script khởi tạo đầy đủ |
| `tech_blog_demo_data.sql` | Dữ liệu mẫu |

### Dependencies chính (pom.xml)

| Dependency | Phiên bản | Mục đích |
|-----------|-----------|---------|
| spring-boot-starter-web | 3.4.5 | REST API |
| spring-boot-starter-security | 3.4.5 | Security |
| spring-boot-starter-data-jpa | 3.4.5 | ORM |
| spring-boot-starter-data-redis | 3.4.5 | Redis |
| spring-kafka | 3.x | Kafka |
| spring-data-elasticsearch | 5.x | Elasticsearch |
| jjwt | 0.12.6 | JWT |
| mapstruct | 1.6.3 | DTO mapping |
| minio | 8.5.9 | Object storage |
| lombok | latest | Boilerplate |

---

## Phụ lục – Quick Reference

### Trạng thái bài viết

| Giá trị | Tên | Hiển thị |
|---------|-----|----------|
| 0 | Draft | Chỉ admin |
| 1 | Published | Công khai |
| 2 | Archived | Ẩn, không xóa |

### Trạng thái bình luận

| Giá trị | Tên | Hiển thị |
|---------|-----|----------|
| false | Pending | Chờ duyệt, ẩn với public |
| true | Approved | Hiện với public |

### Kafka Event Types

| Event | Trigger |
|-------|---------|
| `PostEvent.CREATED` | Tạo bài mới |
| `PostEvent.UPDATED` | Cập nhật bài |
| `PostEvent.DELETED` | Xóa bài |
| `CommentEvent.CREATED` | Tạo bình luận |

### Notification Types

| Type | Gửi khi |
|------|---------|
| `NEW_COMMENT` | Ai đó comment vào bài của bạn |
| `REPLY_COMMENT` | Ai đó reply vào comment của bạn |
