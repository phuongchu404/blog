# 📚 Blog Backend - Tổng Quan Kiến Trúc

## Thông Tin Dự Án

| Thông tin | Giá trị |
|-----------|---------|
| Framework | Spring Boot 3.x |
| Database | MySQL (via Hibernate JPA) |
| Bảo mật | JWT (HS512) + OAuth2 (Google) |
| Port mặc định | 8080 |
| Base URL | `http://localhost:8080` |

---

## Kiến Trúc Tổng Thể

```
blog-backend/
├── advice/                    # Global Exception Handler
│   ├── GlobalExceptionHandler.java
│   ├── ApiErrorResponse.java
│   └── FieldErrorResponse.java
├── common/
│   ├── exception/             # Custom exceptions
│   │   ├── BadRequestException.java
│   │   ├── ServiceException.java
│   │   └── OAuth2AuthenticationProcessingException.java
│   └── utils/                 # Enums & utilities
│       ├── Error.java          # Lỗi chuẩn hoá với HTTP status
│       ├── ERole.java
│       ├── Status.java
│       ├── AuthProvider.java
│       └── CookieUtils.java
├── config/
│   ├── WebSecurityConfig.java  # JWT Security + CORS + phân quyền
│   └── CorsConfig.java
├── controller/                 # REST Controllers
│   ├── AuthController.java     # /auth/*
│   ├── PostController.java     # /api/posts/*
│   ├── PostMetaController.java # /api/posts/{id}/meta/*
│   ├── CategoryController.java # /api/categories/*
│   ├── TagController.java      # /api/tags/*
│   ├── CommentController.java  # /api/comments/*
│   ├── UserController.java     # /api/users/*
│   └── RoleController.java     # /api/roles/*
├── dto/                        # Data Transfer Objects
│   ├── PostDTO.java
│   ├── CategoryDTO.java
│   ├── TagDTO.java
│   ├── CommentDTO.java
│   ├── UserDTO.java
│   ├── RegisterRequest.java
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   └── ApiResponse.java        # Generic response wrapper
├── entity/                     # JPA Entities
│   ├── Post.java
│   ├── Category.java
│   ├── Tag.java
│   ├── PostComment.java
│   ├── PostMeta.java
│   ├── PostCategory.java       # Bảng trung gian Post-Category
│   ├── PostTag.java            # Bảng trung gian Post-Tag
│   ├── User.java
│   ├── Role.java
│   ├── UserRole.java           # Bảng trung gian User-Role
│   ├── Permission.java
│   ├── RolePermission.java
│   └── AuditEntity.java        # createdAt, updatedAt base class
├── repository/                 # Spring Data JPA Repositories
├── security/
│   ├── jwt/                    # JWT Filter, Util, Entry Point
│   ├── oauth2/                 # OAuth2 handlers
│   ├── service/                # CustomUserDetailsService
│   ├── SecurityUtil.java
│   └── CurrentUser.java
└── service/                    # Business Logic
    ├── AuthService.java
    ├── PostService.java
    ├── CategoryService.java
    ├── TagService.java
    ├── CommentService.java
    ├── PostMetaService.java
    ├── UserService.java
    ├── RoleService.java
    └── impl/                   # Service Implementations
```

---

## Mô Hình Dữ Liệu (Entities)

```
User (1) ──── (*) Post
Post (1) ──── (*) PostComment
Post (1) ──── (*) PostMeta
Post (*) ──── (*) Category  [qua PostCategory]
Post (*) ──── (*) Tag       [qua PostTag]
User (*) ──── (*) Role      [qua UserRole]
Role (*) ──── (*) Permission [qua RolePermission]
PostComment (1) ──── (*) PostComment  [self-referencing replies]
Category (1) ──── (*) Category        [self-referencing subcategories]
```

---

## Luồng Xác Thực (Auth Flow)

### JWT Flow:
```
1. Client → POST /auth/login  { username, password }
2. Server verify password → generate JWT (HS512)
3. Client nhận token → lưu vào localStorage/cookie
4. Client gửi request với header: Authorization: Bearer {token}
5. AuthTokenFilter extract token → validate → set SecurityContext
```

### OAuth2 Flow (Google):
```
1. Client redirect → /oauth2/authorize/google
2. Google callback → /login/oauth2/code/google
3. CustomOAuth2UserService xử lý user info
4. OAuth2AuthenticationSuccessHandler tạo JWT + redirect về frontend
```

---

## Phân Quyền (Authorization)

| Role | Quyền |
|------|-------|
| `ROLE_ADMIN` | Toàn quyền: CRUD posts, categories, tags; duyệt/từ chối comment; quản lý users |
| `ROLE_USER` | Tạo bài viết, tạo comment; xem các nội dung public |
| Anonymous | Xem posts/categories/tags đã publish, xem comments đã duyệt |

---

## Cấu Hình (application.yml)

```yaml
application:
  security:
    token-prefix: "Bearer "
    jwt:
      secret: <base64-encoded-256bit-secret>  # ← CẦN ĐẶT GIÁ TRỊ
      token-validity-in-seconds: 86400         # 24 giờ
      token-validity-in-seconds-for-remember-me: 2592000  # 30 ngày

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/blog
    username: root
    password: <your-password>
```

> ⚠️ **Lưu ý**: Đặt `jwt.secret` là chuỗi Base64 ít nhất 256-bit. Ví dụ tạo bằng lệnh:
> ```bash
> openssl rand -base64 32
> ```

---

## Setup & Chạy

```bash
# 1. Tạo database
mysql -u root -p
CREATE DATABASE blog;

# 2. Chạy SQL schema
mysql -u root -p blog < blog.sql

# 3. Khởi tạo roles (lần đầu)
POST http://localhost:8080/api/roles

# 4. Chạy ứng dụng
cd blog-backend
./mvnw spring-boot:run
```
