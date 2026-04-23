# Blog Platform – Kiến trúc Hệ thống

> **Phiên bản:** 1.0 | **Ngày:** 2026-04-23
> **Tác giả:** Auto-generated | **Repo:** `phuongchu404/blog`

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc tổng thể (System Architecture)](#2-kiến-trúc-tổng-thể-system-architecture)
3. [Cấu trúc thư mục dự án](#3-cấu-trúc-thư-mục-dự-án)
4. [Backend Architecture – blog-backend](#4-backend-architecture--blog-backend)
5. [Frontend Architecture – blog-admin](#5-frontend-architecture--blog-admin)
6. [Frontend Architecture – blog-public](#6-frontend-architecture--blog-public)
7. [Database Architecture](#7-database-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Event-Driven Architecture (Kafka)](#9-event-driven-architecture-kafka)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Data Flow](#11-data-flow)
12. [Design Patterns & Principles](#12-design-patterns--principles)

---

## 1. Tổng quan

Blog Platform là một hệ thống blog đa người dùng (multi-user blog) được thiết kế theo kiến trúc **monolithic backend** kết hợp **event-driven** cho các xử lý bất đồng bộ. Hệ thống chia làm 3 module chính:

| Module | Vai trò | Tech Stack |
|--------|---------|------------|
| **blog-backend** | REST API server, xử lý nghiệp vụ | Spring Boot 3.4.5, Java 21, JPA/Hibernate |
| **blog-admin** | Bảng điều khiển quản trị cho Admin | Vanilla JS, AdminLTE 4, CKEditor 5 |
| **blog-public** | Giao diện người dùng cuối (public blog) | Vanilla JS, Bootstrap 5 |

### Tech Stack tổng hợp

```
┌──────────────────────────────────────────────────────────┐
│  Language        │  Java 21, JavaScript (ES6+)            │
│  Framework       │  Spring Boot 3.4.5                     │
│  Database        │  MySQL 8.0                             │
│  Cache           │  Redis                                 │
│  Message Broker  │  Apache Kafka                          │
│  Search Engine   │  Elasticsearch                         │
│  Object Storage  │  MinIO                                 │
│  Security        │  Spring Security + JWT + OAuth2 Google │
│  ORM             │  Spring Data JPA / Hibernate           │
│  DTO Mapping     │  MapStruct 1.6.3                       │
│  Containerization│  Docker (eclipse-temurin:21-jre)       │
│  Frontend UI     │  AdminLTE 4 (Admin) / Custom CSS (Pub) │
│  Rich Editor     │  CKEditor 5 v43                        │
│  Build Tool      │  Maven                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc tổng thể (System Architecture)

### 2.1 High-Level Architecture Diagram

```
                        ┌─────────────────────────────────┐
                        │         END USERS               │
                        │  (Browser / Mobile Browser)     │
                        └────────┬──────────────┬─────────┘
                                 │              │
                    ┌────────────▼──┐    ┌──────▼───────────┐
                    │  blog-public  │    │   blog-admin      │
                    │  (Public UI)  │    │   (Admin Panel)   │
                    │  Vanilla JS   │    │   Vanilla JS      │
                    │  Bootstrap 5  │    │   AdminLTE 4      │
                    └──────┬────────┘    └───────┬───────────┘
                           │                     │
              ┌────────────┴─────────────────────┘
              │  HTTP REST API (JSON)
              │  Authorization: Bearer {JWT}
              ▼
    ┌─────────────────────────────────────────────────────────┐
    │                blog-backend (:8055)                      │
    │              Spring Boot 3.4.5 + Java 21                │
    │                                                          │
    │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
    │  │  Controllers │  │   Services    │  │   Security   │ │
    │  │  (REST API)  │  │  (Business    │  │  (JWT +      │ │
    │  │  16 modules  │  │   Logic)      │  │   OAuth2)    │ │
    │  └──────┬───────┘  └──────┬────────┘  └──────────────┘ │
    │         │                 │                             │
    │  ┌──────┴─────────────────┴──────────────────────────┐ │
    │  │              Data Access Layer                     │ │
    │  │  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │ │
    │  │  │   DTOs   │  │  Mappers  │  │  Repositories  │  │ │
    │  │  │ + Events │  │(MapStruct)│  │ (Spring Data   │  │ │
    │  │  │          │  │           │  │    JPA)        │  │ │
    │  │  └──────────┘  └───────────┘  └───────┬────────┘  │ │
    │  └────────────────────────────────────────┼───────────┘ │
    │                                           │             │
    │  ┌────────────────────────────────────────┼───────────┐ │
    │  │          Infrastructure Layer           │           │ │
    │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐│           │ │
    │  │  │  Config  │ │  Kafka   │ │  MinIO   ││           │ │
    │  │  │          │ │Producer/ │ │ Service  ││           │ │
    │  │  │          │ │Consumer  │ │          ││           │ │
    │  │  └──────────┘ └──────────┘ └──────────┘│           │ │
    │  └─────────────────────────────────────────────────────┘ │
    └─────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼──────────────────────┐
         │                │                      │
         ▼                ▼                      ▼
  ┌─────────────┐ ┌──────────────┐     ┌────────────────┐
  │   MySQL 8   │ │    Redis     │     │  Apache Kafka  │
  │   (:3307)   │ │   (:6379)    │     │    (:9092)     │
  │ Primary DB  │ │ View Counter │     │ Event Streaming│
  └─────────────┘ │ Cache        │     └───────┬────────┘
         │        └──────────────┘             │
         │                    ┌────────────────┼──────────┐
         │                    ▼                ▼          │
         │           ┌──────────────┐ ┌──────────────┐   │
         │           │Elasticsearch │ │  MinIO       │   │
         │           │  (:9200)     │ │  (:9000)     │   │
         │           │ Full-text    │ │ Object       │   │
         │           │ Search       │ │ Storage      │   │
         │           └──────────────┘ └──────────────┘   │
         └───────────────────────────────────────────────┘
```

### 2.2 Communication Patterns

```
┌──────────────┐     HTTP REST (JSON)      ┌──────────────┐
│  Frontend    │ ◄──────────────────────► │   Backend    │
│  (Admin/Pub) │    Bearer JWT Auth        │  (Spring)    │
└──────────────┘                           └──────┬───────┘
                                                  │
                                          ┌───────┴───────┐
                                          │  Kafka Topic  │
                                          └───┬───────┬───┘
                                              │       │
                                     ┌────────▼─┐ ┌──▼──────────┐
                                     │ES Sync   │ │Notification │
                                     │Consumer  │ │Consumer     │
                                     └─────┬────┘ └──────┬──────┘
                                           │             │
                                           ▼             ▼
                                    ┌────────────┐ ┌──────────┐
                                    │Elasticsearch│ │ MySQL DB │
                                    │  Index     │ │(notif.)  │
                                    └────────────┘ └──────────┘
```

---

## 3. Cấu trúc thư mục dự án

```
blog/                                   # Root repository
├── blog-backend/                       # Spring Boot Backend
│   ├── pom.xml                         # Maven dependencies
│   ├── Dockerfile                      # Docker image (JRE 21)
│   ├── docker-compose.yml              # Local dev services
│   ├── docker-compose.backend.yml      # Backend + infra
│   ├── src/main/java/me/phuongcm/blog/
│   │   ├── BlogBackendApplication.java # Main entry point
│   │   ├── advice/                     # Global exception handler
│   │   ├── annotation/                 # Custom annotations (@Auditable)
│   │   ├── aspect/                     # AOP aspects (AuditAspect)
│   │   ├── common/                     # Shared utilities
│   │   │   ├── exception/              # Custom exceptions
│   │   │   └── utils/                  # Enums, constants, helpers
│   │   ├── config/                     # Spring configuration
│   │   ├── controller/                 # REST controllers (16)
│   │   ├── dto/                        # DTOs + MapStruct mappers
│   │   ├── entity/                     # JPA entities (22+)
│   │   ├── repository/                 # Spring Data JPA repos (21)
│   │   ├── security/                   # JWT + OAuth2 + UserDetails
│   │   ├── service/                    # Business logic (20+ services)
│   │   │   └── impl/                   # Service implementations
│   │   └── spec/                       # JPA Specifications
│   └── src/main/resources/
│       └── application.yml             # App configuration
│
├── blog-admin/                         # Admin Panel (SPA-like)
│   ├── index.html                      # Dashboard
│   ├── login.html                      # Admin login
│   ├── posts/                          # Post management
│   ├── categories/                     # Category management
│   ├── comments/                       # Comment moderation
│   ├── tags/                           # Tag management
│   ├── users/                          # User management
│   ├── roles/                          # Role management
│   ├── permissions/                    # Permission management
│   ├── audit-logs/                     # Audit log viewer
│   ├── css/                            # Custom styles
│   └── js/
│       ├── http.js                     # HTTP client + token refresh
│       ├── auth.js                     # Auth guard
│       ├── api.js                      # API base URL config
│       ├── ui.js                       # UI helpers (toast, confirm)
│       ├── i18n.js                     # Internationalization
│       ├── locales/                    # en.js, vi.js
│       ├── pages/                      # Page-specific logic (12 modules)
│       ├── services/                   # API service layer (9 services)
│       └── template/                   # 3rd-party JS libs
│
├── blog-public/                        # Public Blog (SSR-like SPA)
│   ├── index.html                      # Homepage
│   ├── blog.html                       # Blog listing
│   ├── post.html                       # Post detail + comments
│   ├── category.html                   # Category page
│   ├── tag.html                        # Tag page
│   ├── author.html                     # Author profile
│   ├── search.html                     # Search results
│   ├── login.html                      # User login
│   ├── register.html                   # User registration
│   ├── profile.html                    # User profile
│   ├── membership.html                 # Membership page
│   ├── css/                            # Public styles
│   └── js/
│       ├── http.js                     # HTTP client
│       ├── auth.js                     # Auth management
│       ├── auth-pages.js               # Auth page logic
│       ├── ui.js                       # UI utilities
│       ├── i18n.js                     # i18n support
│       ├── *.service.js                # API services (6)
│       ├── *.js                        # Page logic (8 pages)
│       └── locales/                    # en.js, vi.js
│
├── AdminLTE-4.0.0-rc7/                 # AdminLTE source (reference)
├── readme/                             # Technical guides (Vietnamese)
├── blog.sql                            # Legacy DB schema
├── init_blog_sql.sql                   # Init SQL script
├── tech_blog_demo_data.sql             # Demo data
└── PROJECT_DOCUMENTATION.md            # Full project docs
```

---

## 4. Backend Architecture – blog-backend

### 4.1 Layered Architecture

Backend được thiết kế theo mô hình **Layered Architecture** chuẩn:

```
┌─────────────────────────────────────────────────────────┐
│                    Controller Layer                      │
│  (REST endpoints, request/response handling)             │
│  AuthController, PostController, CommentController, ...  │
├─────────────────────────────────────────────────────────┤
│                    Security Layer                        │
│  (JWT filter, OAuth2, RBAC permission check)             │
│  AuthTokenFilter → JwtUtil → UserDetailsService          │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│  (Business logic, orchestration)                         │
│  PostServiceImpl, CommentServiceImpl, UserServiceImpl    │
├─────────────────────────────────────────────────────────┤
│                    Data Access Layer                     │
│  (JPA Repositories + Specifications)                     │
│  PostRepository, UserRepository, ...                     │
├─────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                  │
│  (External services integration)                         │
│  KafkaProducer, MinIOService, RedisTemplate, ES Client   │
├─────────────────────────────────────────────────────────┤
│                    Cross-cutting Concerns                │
│  AOP (AuditAspect), GlobalExceptionHandler, CORS         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Package Structure Chi tiết

```
me.phuongcm.blog/
│
├── BlogBackendApplication.java           # @SpringBootApplication entry point
│
├── controller/                           # REST API Layer (16 Controllers)
│   ├── AuthController                    #   /auth/* - Login, Register, Refresh, Logout
│   ├── PostController                    #   /api/posts/* - CRUD + Search + Publish
│   ├── PostMetaController                #   /api/posts/{id}/meta/* - SEO Meta data
│   ├── CommentController                 #   /api/comments/* - CRUD + Moderate
│   ├── CategoryController                #   /api/categories/* - CRUD (hierarchical)
│   ├── TagController                     #   /api/tags/* - CRUD
│   ├── UserController                    #   /api/users/* - CRUD + Role assignment
│   ├── RoleController                    #   /api/roles/* - CRUD + Permission assign
│   ├── PermissionController              #   /api/permissions/* - CRUD
│   ├── FileController                    #   /api/files/* - Upload to MinIO
│   ├── NotificationController            #   /api/notifications/* - Read/Unread
│   ├── NewsletterController              #   /api/newsletter/* - Subscribe/Unsubscribe
│   ├── MembershipController              #   /api/membership/* - Membership plans
│   ├── SeriesController                  #   /api/series/* - Post series
│   ├── SiteSettingController             #   /api/settings/* - Site configuration
│   └── AuditLogController               #   /api/admin/audit-logs/* - Logs + Export
│
├── service/                              # Business Logic Layer
│   ├── AuthService                       # Authentication interface
│   ├── PostService                       # Post CRUD + search interface
│   ├── CommentService                    # Comment CRUD + moderation interface
│   ├── CategoryService                   # Category CRUD interface
│   ├── TagService                        # Tag CRUD interface
│   ├── UserService                       # User management interface
│   ├── RoleService                       # Role management interface
│   ├── PermissionService                 # Permission management interface
│   ├── PostMetaService                   # Post meta (SEO) interface
│   ├── MinIOService                      # File storage interface
│   ├── UploadTrackerService              # Orphaned file tracking interface
│   ├── KafkaProducerService              # Kafka event publisher
│   ├── ElasticsearchSyncService          # ES index sync (Kafka Consumer)
│   ├── NotificationService               # Notification creation (Kafka Consumer)
│   ├── NotificationStreamService         # SSE notification stream
│   ├── EmailService                      # Email sending interface
│   ├── NewsletterService                 # Newsletter subscription interface
│   ├── SeriesService                     # Post series interface
│   ├── SiteSettingService                # Site settings interface
│   ├── OrphanedFileCleanupTask           # Scheduled cleanup task
│   └── impl/                             # Implementations
│       ├── AuthServiceImpl.java
│       ├── PostServiceImpl.java
│       ├── CommentServiceImpl.java
│       ├── CategoryServiceImpl.java
│       ├── TagServiceImpl.java
│       ├── UserServiceImpl.java
│       ├── RoleServiceImpl.java
│       ├── PermissionServiceImpl.java
│       ├── PostMetaServiceImpl.java
│       ├── MinIOServiceImpl.java
│       ├── UploadTrackerServiceImpl.java
│       ├── EmailServiceImpl.java
│       ├── NewsletterServiceImpl.java
│       ├── SeriesServiceImpl.java
│       └── SiteSettingServiceImpl.java
│
├── repository/                           # Data Access Layer (21 Repositories)
│   ├── PostRepository                    # Post JPA queries + Specifications
│   ├── PostSearchRepository              # Elasticsearch repository
│   ├── PostCategoryRepository            # Post-Category join table
│   ├── PostTagRepository                 # Post-Tag join table
│   ├── PostMetaRepository                # Post metadata (key-value)
│   ├── PostCommentRepository             # Comments + replies
│   ├── UserRepository                    # User queries
│   ├── RoleRepository                    # Role queries
│   ├── PermissionRepository              # Permission queries
│   ├── UserRoleRepository                # User-Role join table
│   ├── RolePermissionRepository          # Role-Permission join table
│   ├── CategoryRepository                # Category tree queries
│   ├── TagRepository                     # Tag queries
│   ├── NotificationRepository            # Notification queries
│   ├── AuditLogRepository                # Audit log queries
│   ├── RefreshTokenRepository            # JWT refresh tokens
│   ├── UploadTrackerRepository           # File tracking queries
│   ├── NewsletterSubscriberRepository    # Newsletter subscribers
│   ├── SeriesRepository                  # Series queries
│   ├── SeriesPostRepository              # Series-Post join
│   └── SiteSettingRepository             # Site settings
│
├── entity/                               # JPA Entity Models (22+ Entities)
│   ├── User                              # User account (LOCAL / GOOGLE)
│   ├── Post                              # Blog post (Draft/Published/Archived)
│   ├── PostMeta                          # Key-value metadata for Post
│   ├── PostComment                       # Comment with nested replies
│   ├── Category                          # Hierarchical category (self-ref)
│   ├── Tag                               # Flat tag
│   ├── PostCategory                      # Join: Post ↔ Category (M:M)
│   ├── PostTag                           # Join: Post ↔ Tag (M:M)
│   ├── Role                              # Role (ROLE_ADMIN, ROLE_USER, ...)
│   ├── Permission                        # Permission (resource:action format)
│   ├── UserRole                          # Join: User ↔ Role (M:M)
│   ├── RolePermission                    # Join: Role ↔ Permission (M:M)
│   ├── RefreshToken                      # JWT refresh token (7 days)
│   ├── Notification                      # In-app notification
│   ├── AuditLog                          # Action audit trail
│   ├── AuditEntity                       # Base entity with audit fields
│   ├── UploadTracker                     # File upload tracking (UNUSED/USED)
│   ├── UploadTrackerStatus               # Upload status enum
│   ├── NewsletterSubscriber              # Email subscriber
│   ├── Series                            # Post series/group
│   ├── SeriesPost                        # Join: Series ↔ Post
│   ├── SiteSetting                       # Site configuration KV store
│   └── PostDocument                      # Elasticsearch document (not MySQL)
│
├── dto/                                  # Data Transfer Objects
│   ├── ApiResponse.java                  # Generic wrapper: { success, message, data }
│   ├── PostDTO / PostMapper              # Post DTO + MapStruct mapper
│   ├── CommentDTO / CommentResponseDTO   # Comment DTOs
│   ├── CategoryDTO / CategoryMapper      # Category DTO + mapper
│   ├── TagDTO / TagMapper                # Tag DTO + mapper
│   ├── UserDTO / UserMapper              # User DTO + mapper
│   ├── RoleDTO / RoleMapper / RoleResponseDTO
│   ├── PermissionDTO / PermissionMapper  # Permission DTO + mapper
│   ├── SeriesDTO                         # Series DTO
│   ├── LoginRequest / LoginResponse      # Auth DTOs
│   ├── RegisterRequest                   # Registration DTO
│   ├── TokenRefreshRequest / Response    # Token refresh DTOs
│   ├── ChangePasswordRequestDTO          # Password change DTO
│   ├── AssignPermissionsRequestDTO       # Role permission assignment
│   ├── MembershipRequest                 # Membership DTO
│   ├── NewsletterSubscribeRequest        # Newsletter DTO
│   ├── PostEvent                         # Kafka event: Post (CREATED/UPDATED/DELETED)
│   ├── CommentEvent                      # Kafka event: Comment (CREATED)
│   └── NotificationStreamEvent           # SSE event DTO
│
├── config/                               # Spring Configuration
│   ├── WebSecurityConfig                 # Security filter chain, CORS, endpoint rules
│   ├── CorsConfig                        # CORS origins configuration
│   ├── WebConfig                         # Web MVC configuration
│   ├── AsyncConfig                       # Async task executor
│   ├── RedisConfig                       # Redis template setup
│   ├── MinIOConfig                       # MinIO client bean
│   ├── PasswordEncoderConfig             # BCrypt password encoder
│   ├── DataInitializer                   # Seed data on startup
│   └── ViewCountSyncScheduler            # Cron: Redis → MySQL view count sync
│
├── security/                             # Security Layer
│   ├── jwt/
│   │   ├── JwtUtil.java                  # JWT generate/validate/parse
│   │   ├── AuthTokenFilter.java          # OncePerRequestFilter: extract JWT
│   │   └── AuthEntryPointJwt.java        # Handle 401 unauthorized
│   ├── oauth2/
│   │   ├── CustomOAuth2UserService.java  # Google login: create/update User
│   │   ├── OAuth2AuthenticationSuccessHandler.java  # Generate JWT after OAuth2
│   │   ├── OAuth2AuthenticationFailureHandler.java  # Handle OAuth2 errors
│   │   ├── CustomAuthorizationRequestResolver.java  # Custom OAuth2 flow
│   │   ├── HttpCookieOAuth2AuthorizationRequestRepository.java
│   │   └── UserOAuth2Response.java       # OAuth2 user data
│   ├── service/
│   │   ├── CustomUserDetails.java        # UserDetails implementation
│   │   ├── CustomUserDetailsService.java # Load user from DB
│   │   └── RefreshTokenService.java      # Create/verify/delete refresh tokens
│   ├── CurrentUser.java                  # @CurrentUser annotation
│   └── SecurityUtil.java                 # Get current user from SecurityContext
│
├── common/                               # Shared Code
│   ├── exception/
│   │   ├── BadRequestException.java      # 400 errors
│   │   ├── ServiceException.java         # Generic service error
│   │   ├── TokenRefreshException.java    # Refresh token error
│   │   └── OAuth2AuthenticationProcessingException.java
│   └── utils/
│       ├── AppConstants.java             # App-wide constants
│       ├── AuthProvider.java             # LOCAL | GOOGLE enum
│       ├── CookieUtils.java              # Cookie utilities
│       ├── ERole.java                    # Role name constants
│       ├── Error.java                    # Error response builder
│       ├── PublishedStatus.java          # Comment publish status
│       ├── SlugUtils.java                # Slug generation
│       ├── Status.java                   # Post status enum
│       └── StringUtils.java              # String utilities
│
├── advice/                               # AOP Advice
│   └── GlobalExceptionHandler            # @ControllerAdvice exception handler
│
├── annotation/                           # Custom Annotations
│   └── @Auditable                        # Mark methods for audit logging
│
├── aspect/                               # AOP Aspects
│   └── AuditAspect                       # Auto-capture audit log on @Auditable
│
└── spec/                                 # JPA Specifications
    └── (Dynamic query builders for filtering/pagination)
```

### 4.3 Request Processing Pipeline

```
HTTP Request
    │
    ▼
┌──────────────────────┐
│  Tomcat (Embedded)   │  :8055
│  Thread Pool         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  CORS Filter         │  CorsConfig
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  AuthTokenFilter     │  Extract JWT from Authorization header
│  (OncePerRequest)    │  Validate token → Load UserDetails
│                      │  Set SecurityContext
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Spring Security     │  @PreAuthorize("hasAuthority('...')")
│  Authorization       │  Check endpoint-level permissions
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Controller          │  @RestController
│  (Request → DTO)     │  Validate input, delegate to Service
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Service Layer       │  Business logic
│  (Transaction)       │  Orchestrate repositories + external services
└──────────┬───────────┘
           │
    ┌──────┼──────────────┬──────────────┐
    ▼      ▼              ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
│ MySQL  │ │ Redis  │ │ MinIO  │ │ Kafka        │
│ (JPA)  │ │(Cache) │ │(Files) │ │ (Events)     │
└────────┘ └────────┘ └────────┘ └──────────────┘
           │
           ▼
┌──────────────────────┐
│  ApiResponse<T>      │  { success: true, message: "...", data: T }
│  (JSON Response)     │
└──────────────────────┘
```

### 4.4 Dependencies (pom.xml)

| Dependency | Version | Mục đích |
|-----------|---------|----------|
| `spring-boot-starter-web` | 3.4.5 | REST API, Embedded Tomcat |
| `spring-boot-starter-security` | 3.4.5 | Authentication & Authorization |
| `spring-boot-starter-data-jpa` | 3.4.5 | ORM, Hibernate, Repository pattern |
| `spring-boot-starter-data-redis` | 3.4.5 | Redis cache & view counter |
| `spring-boot-starter-cache` | 3.4.5 | Caching abstraction |
| `spring-boot-starter-data-elasticsearch` | — | Elasticsearch integration |
| `spring-boot-starter-oauth2-client` | — | Google OAuth2 login |
| `spring-boot-starter-aop` | — | AOP for audit logging |
| `spring-boot-starter-mail` | — | Email (Gmail SMTP) |
| `spring-boot-starter-validation` | — | Bean validation |
| `spring-boot-starter-actuator` | — | Health check endpoint |
| `spring-kafka` | 3.x | Kafka producer/consumer |
| `jjwt` | 0.12.6 | JWT token creation & validation |
| `mapstruct` | 1.6.3 | Entity ↔ DTO mapping |
| `minio` | 8.5.9 | Object storage client |
| `mysql-connector-j` | — | MySQL JDBC driver |
| `lombok` | latest | Boilerplate reduction |
| `ulid-creator` | 5.1.0 | ULID generation |

---

## 5. Frontend Architecture – blog-admin

### 5.1 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    blog-admin (Admin Panel)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    HTML Pages                          │ │
│  │  index.html │ login.html │ posts/*.html │ ...etc      │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │              Page Scripts (js/pages/)                   │ │
│  │  dashboard.js │ posts-create.js │ users.js │ ...etc    │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │            Service Layer (js/services/)                 │ │
│  │  post.service │ user.service │ category.service │ ...  │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │              HTTP Client (js/http.js)                   │ │
│  │  • Auto-attach Bearer token                            │ │
│  │  • Auto-refresh token on 401                           │ │
│  │  • Unwrap ApiResponse → data                           │ │
│  │  • Error handling & redirect                           │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │         Shared Modules                                  │ │
│  │  auth.js │ ui.js │ api.js │ i18n.js │ locales/        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  UI Framework: AdminLTE 4 (Bootstrap 5)                     │
│  Rich Editor: CKEditor 5 v43                                │
│  Tag Select: TomSelect                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 JavaScript Architecture Pattern

```
                    ┌─────────────┐
                    │  HTML Page  │  (e.g., posts/index.html)
                    └──────┬──────┘
                           │ <script src="js/pages/posts-index.js">
                           ▼
                    ┌─────────────┐
                    │  Page JS    │  (pages/posts-index.js)
                    │  - init()   │  DOM manipulation, event handlers
                    │  - render() │  Dynamic table/card rendering
                    └──────┬──────┘
                           │ calls service methods
                           ▼
                    ┌─────────────┐
                    │  Service    │  (services/post.service.js)
                    │  - getAll() │  API endpoint abstraction
                    │  - create() │  Parameter formatting
                    │  - update() │
                    │  - delete() │
                    └──────┬──────┘
                           │ calls Http.get/post/put/delete
                           ▼
                    ┌─────────────┐
                    │  http.js    │  HTTP Client wrapper
                    │  - fetch()  │  Add Authorization header
                    │  - unwrap   │  Handle 401 → refresh token
                    └──────┬──────┘
                           │ HTTP REST
                           ▼
                    ┌─────────────┐
                    │  Backend    │  blog-backend:8055
                    │  API        │
                    └─────────────┘
```

### 5.3 Module chi tiết

| Module | Page JS | Service JS | HTML | Mô tả |
|--------|---------|-----------|------|-------|
| Dashboard | `dashboard.js` | Multiple services | `index.html` | Thống kê tổng quan |
| Login | `login.js` | — | `login.html` | Đăng nhập admin |
| Posts List | `posts-index.js` | `post.service.js` | `posts/index.html` | Danh sách bài viết |
| Post Editor | `posts-create.js` | `post.service.js` | `posts/create.html` | Tạo/sửa bài (CKEditor 5) |
| Categories | `categories.js` | `category.service.js` | `categories/index.html` | Quản lý danh mục |
| Comments | `comments.js` | `comment.service.js` | `comments/index.html` | Kiểm duyệt bình luận |
| Tags | `tags.js` | `tag.service.js` | `tags/index.html` | Quản lý nhãn |
| Users | `users.js` | `user.service.js` | `users/index.html` | Quản lý người dùng |
| Roles | `roles.js` | `role.service.js` | `roles/index.html` | Quản lý vai trò |
| Permissions | `permissions.js` | `permission.service.js` | `permissions/index.html` | Quản lý quyền |
| Audit Logs | `audit-logs.js` | — | `audit-logs/index.html` | Xem log + export CSV |
| Profile | `profile.js` | `user.service.js` | `profile.html` | Hồ sơ admin |
| Settings | `settings.js` | `setting.service.js` | `settings.html` | Cài đặt hệ thống |

---

## 6. Frontend Architecture – blog-public

### 6.1 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                   blog-public (Public Blog)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    HTML Pages                          │ │
│  │  index │ blog │ post │ category │ tag │ author │ ...  │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │              Page Scripts (*.js)                        │ │
│  │  index.js │ blog.js │ post.js │ category.js │ ...     │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │            Service Layer (*.service.js)                 │ │
│  │  post.service │ category.service │ tag.service │ ...  │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │              HTTP Client (http.js)                      │ │
│  │  • Token management                                    │ │
│  │  • Auto-refresh                                        │ │
│  │  • ApiResponse unwrapping                              │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │         Shared Modules                                  │ │
│  │  auth.js │ auth-pages.js │ ui.js │ i18n.js │ locales │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  UI Framework: Custom CSS + Bootstrap 5                      │
│  Notification: SSE (Server-Sent Events)                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Module chi tiết

| Module | Page JS | Service JS | HTML | Mô tả |
|--------|---------|-----------|------|-------|
| Homepage | `index.js` | `post.service.js` | `index.html` | Bài nổi bật + mới nhất |
| Blog List | `blog.js` | `post.service.js` | `blog.html` | Tất cả bài (phân trang) |
| Post Detail | `post.js` | `post.service.js` + `comment.service.js` | `post.html` | Đọc bài + bình luận |
| Category | `category.js` | `category.service.js` | `category.html` | Bài theo danh mục |
| Tag | `tag.js` | `tag.service.js` | `tag.html` | Bài theo nhãn |
| Author | `author.js` | `user.service.js` | `author.html` | Trang tác giả |
| Search | `search.js` | `post.service.js` | `search.html` | Kết quả tìm kiếm |
| Auth | `auth-pages.js` | — | `login.html` / `register.html` | Đăng nhập/Đăng ký |
| Profile | — | `user.service.js` | `profile.html` | Hồ sơ người dùng |
| Membership | `membership.js` | — | `membership.html` | Gói thành viên |
| Notification | — | `notification.service.js` | (SSE in all pages) | Thông báo real-time |

---

## 7. Database Architecture

### 7.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER MANAGEMENT                              │
│                                                                     │
│  ┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐ │
│  │   user   │────<│ user_role │>────│   role   │────<│role_perm │ │
│  └────┬─────┘     └───────────┘     └────┬─────┘     └────┬─────┘ │
│       │                                   │                │        │
│       │                                   │          ┌─────▼──────┐ │
│       │                                   │          │ permission │ │
│       │                                   │          └────────────┘ │
│  ┌────▼──────┐                                                           │
│  │refresh_tok│                                                           │
│  │  (1:N)    │                                                           │
│  └───────────┘                                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        CONTENT MANAGEMENT                           │
│                                                                     │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐                │
│  │   user   │────<│     post     │>────│post_categ│>──┐            │
│  │ (author) │     └──────┬───────┘     └──────────┘   │            │
│  └──────────┘            │                            ▼            │
│                     ┌────┼────┐                  ┌──────────┐       │
│                     │    │    │                  │ category │       │
│                     ▼    ▼    ▼                  │ (self-ref│       │
│               ┌─────┐ ┌─┴──┐ ┌──────┐           │ parent_id)│      │
│               │post_│ │post│ │post_ │           └──────────┘       │
│               │meta │ │tag │ │comm  │                               │
│               │(KV) │ │    │ │(self-│                               │
│               └─────┘ └──┬─┘ │ref)  │                               │
│                          │   └──────┘                               │
│                          ▼                                          │
│                     ┌──────────┐                                    │
│                     │   tag    │                                    │
│                     └──────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION & LOG                            │
│                                                                     │
│  ┌──────────┐     ┌────────────┐     ┌──────────────┐              │
│  │   user   │────<│notification│     │  audit_log   │              │
│  └──────────┘     └────────────┘     └──────────────┘              │
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐    │
│  │upload_tracker│     │newsletter_sub│     │   site_setting   │    │
│  │(UNUSED/USED) │     │   (email)    │     │   (KV config)    │    │
│  └──────────────┘     └──────────────┘     └──────────────────┘    │
│                                                                     │
│  ┌──────────┐     ┌──────────────┐                                  │
│  │  series  │────<│  series_post │                                  │
│  └──────────┘     └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Database Technology Matrix

| Dữ liệu | Storage | Lý do |
|----------|---------|-------|
| Dữ liệu nghiệp vụ (User, Post, Comment, ...) | **MySQL 8.0** | ACID, relational, consistent |
| View count (tạm thời) | **Redis** | Tốc độ cao, INCR atomic |
| Full-text search index | **Elasticsearch** | Fuzzy search, relevance scoring |
| File/ảnh | **MinIO** | S3-compatible object storage |
| Refresh token | **MySQL** | Cần persistent, dễ query |
| Audit log | **MySQL** | Cần query, filter, export |

---

## 8. Security Architecture

### 8.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: CORS Filter                                   │
│  - Allowed origins: localhost:5500, 127.0.0.1:5500      │
│  - Credentials: true                                    │
├─────────────────────────────────────────────────────────┤
│  Layer 2: JWT Authentication Filter (AuthTokenFilter)   │
│  - Extract token from Authorization: Bearer {jwt}       │
│  - Validate signature + expiry                          │
│  - Load UserDetails → SecurityContext                   │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Spring Security Authorization                 │
│  - Endpoint-level: public / authenticated rules         │
│  - Method-level: @PreAuthorize("hasAuthority('...')")   │
├─────────────────────────────────────────────────────────┤
│  Layer 4: RBAC (Role-Based Access Control)              │
│  - User → Roles → Permissions                           │
│  - Permission format: {resource}:{action}:{scope}       │
│  - Example: post:publish, comment:moderate              │
└─────────────────────────────────────────────────────────┘
```

### 8.2 JWT Token Lifecycle

```
                    ┌─────────────┐
                    │  Login      │
                    │  (Username  │
                    │  + Password)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ AuthControl.│
                    │  login()    │
                    └──────┬──────┘
                           │
               ┌───────────┼───────────┐
               ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Access Token    │    │  Refresh Token   │
    │  (JWT, 1 giờ)    │    │  (UUID, 7 ngày)  │
    │  → localStorage  │    │  → MySQL DB      │
    └──────────────────┘    └──────────────────┘
               │                       │
               │  Mỗi request          │  Khi access token hết hạn
               ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  AuthTokenFilter │    │  POST /auth/     │
    │  Validate JWT    │    │  refresh         │
    │  → SecurityCtx   │    │  → New access    │
    └──────────────────┘    │    token          │
                            └──────────────────┘
```

### 8.3 OAuth2 Google Login Flow

```
┌──────────┐     ┌───────────────┐     ┌──────────┐     ┌──────────────┐
│  User    │────►│ /oauth2/      │────►│  Google  │────►│ OAuth2       │
│  Browser │     │ authorize     │     │  Login   │     │ Callback     │
└──────────┘     │ ?client_name= │     │  Page    │     │ /code/google │
                 │ google        │     └──────────┘     └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ CustomOAuth2 │
                                                    │ UserService  │
                                                    │ → Create/    │
                                                    │   Update User│
                                                    └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Success      │
                                                    │ Handler      │
                                                    │ → Generate   │
                                                    │   JWT        │
                                                    └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Redirect     │
                                                    │ → Frontend   │
                                                    │ + JWT token  │
                                                    └──────────────┘
```

---

## 9. Event-Driven Architecture (Kafka)

### 9.1 Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     EVENT-DRIVEN ARCHITECTURE                   │
│                                                                  │
│  ┌──────────────┐                        ┌──────────────────┐   │
│  │ PostService  │──PostEvent(CREATED)───►│                  │   │
│  │              │──PostEvent(UPDATED)───►│  Kafka Topic:    │   │
│  │              │──PostEvent(DELETED)───►│  blog.events.post│   │
│  └──────────────┘                        └────────┬─────────┘   │
│                                                    │             │
│                                          ┌─────────▼─────────┐  │
│                                          │ElasticsearchSync  │  │
│                                          │Service (Consumer) │  │
│                                          │ → ES index upsert │  │
│                                          │ → ES index delete │  │
│                                          └───────────────────┘  │
│                                                                  │
│  ┌────────────────┐                    ┌──────────────────────┐  │
│  │CommentService  │─CommentEvent──────►│  Kafka Topic:        │  │
│  │                │ (CREATED)          │  blog.events.comment │  │
│  └────────────────┘                    └─────────┬────────────┘  │
│                                                  │              │
│                                        ┌─────────▼────────────┐ │
│                                        │NotificationService   │ │
│                                        │(Consumer)            │ │
│                                        │ → NEW_COMMENT notif  │ │
│                                        │ → REPLY_COMMENT notif│ │
│                                        └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Kafka Topics

| Topic | Producer | Consumer | Event Types | Mục đích |
|-------|----------|----------|-------------|----------|
| `blog.events.post` | PostService | ElasticsearchSyncService | `CREATED`, `UPDATED`, `DELETED` | Đồng bộ ES index |
| `blog.events.comment` | CommentService | NotificationService | `CREATED` | Tạo thông báo |

### 9.3 Scheduled Background Jobs

| Job | Schedule | Mô tả |
|-----|----------|-------|
| `ViewCountSyncScheduler` | Mỗi 5 phút | Sync Redis view counter → MySQL `post.view_count` |
| `OrphanedFileCleanupTask` | Hàng đêm | Xóa file MinIO không được sử dụng > 24h |

---

## 10. Infrastructure & Deployment

### 10.1 Service Map

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER / LOCAL ENVIRONMENT                 │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  blog-backend        │    │  blog-admin (Static HTML)   │ │
│  │  Spring Boot :8055   │    │  Served by Live Server/NGINX│ │
│  │  Java 21 JRE         │    │  :5500                      │ │
│  │  Docker: temurin-21  │    └─────────────────────────────┘ │
│  └─────────┬───────────┘                                     │
│            │                                                  │
│  ┌─────────▼───────────────────────────────────────────────┐ │
│  │                Infrastructure Services                   │ │
│  │                                                          │ │
│  │  ┌───────────┐  ┌─────────┐  ┌──────────┐              │ │
│  │  │ MySQL 8.0 │  │  Redis  │  │   MinIO  │              │ │
│  │  │  :3307    │  │  :6379  │  │  :9000   │              │ │
│  │  │ Primary DB│  │  Cache  │  │  Storage │              │ │
│  │  └───────────┘  └─────────┘  └──────────┘              │ │
│  │                                                          │ │
│  │  ┌───────────┐  ┌───────────────┐                       │ │
│  │  │  Kafka    │  │Elasticsearch  │  ┌──────────────────┐ │ │
│  │  │  :9092    │  │  :9200        │  │ blog-public      │ │ │
│  │  │ Messaging │  │  Full-text    │  │ (Static HTML)    │ │ │
│  │  └───────────┘  └───────────────┘  │ Served by        │ │ │
│  │                                    │ Live Server/NGINX│ │ │
│  │                                    │ :5500            │ │ │
│  │                                    └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Port Mapping

| Service | Port | Protocol | Mô tả |
|---------|------|----------|-------|
| Spring Boot | `8055` | HTTP | Backend REST API |
| MySQL | `3307` | TCP | Primary database |
| Redis | `6379` | TCP | Cache & view counter |
| Kafka | `9092` | TCP | Message broker |
| Elasticsearch | `9200` | HTTP | Search engine |
| MinIO API | `9000` | HTTP | Object storage |
| MinIO Console | `9001` | HTTP | MinIO management UI |
| blog-admin | `5500` | HTTP | Admin panel (Live Server) |
| blog-public | `5500` | HTTP | Public blog (Live Server) |

### 10.3 Docker Configuration

```dockerfile
# Dockerfile - Multi-stage not used; build with Maven outside
FROM eclipse-temurin:21-jre-jammy
# Port: 8055
# Volumes: /app/config, /app/logs, /app/uploads
# Entry: PropertiesLauncher for external config
```

```yaml
# docker-compose.yml - Local development
# Services: MySQL, Redis, Kafka (+ Zookeeper), Elasticsearch, MinIO
```

---

## 11. Data Flow

### 11.1 Tạo bài viết (Create Post)

```
Admin → posts/create.html
    │
    │ [1] Upload ảnh (CKEditor paste / featured image)
    ▼
POST /api/files/upload
    → MinIO.putObject()
    → UploadTracker.insert(status=UNUSED)
    → Return image URL
    │
    │ [2] Submit form
    ▼
POST /api/posts { title, content, imageUrl, tagIds[], categoryIds[], status, metaTitle, metaDescription, metaKeywords }
    │
    ▼
PostServiceImpl.createPost()
    ├─ Generate slug from title
    ├─ INSERT post → MySQL
    ├─ INSERT post_tag (M:N) → MySQL
    ├─ INSERT post_category (M:N) → MySQL
    ├─ INSERT post_meta (metaTitle, metaDescription, metaKeywords) → MySQL
    ├─ If status=PUBLISHED → set publishedAt
    ├─ Scan content → mark UploadTracker entries as USED
    └─ Kafka.send("blog.events.post", PostEvent(CREATED))
              │
              ▼
        ElasticsearchSyncService.consume()
              → ES.index(new PostDocument)
    │
    ▼
Response: PostDTO → Admin sees success toast
```

### 11.2 Đọc bài + Đếm lượt xem

```
User → post.html?slug=my-article
    │
    ▼
GET /api/posts/slug/my-article
    │
    ▼
PostServiceImpl.getPostBySlug()
    ├─ SELECT FROM post WHERE slug=? AND status=1 → MySQL
    ├─ Redis.INCR("post:view:{id}") ← Non-blocking counter
    └─ Return PostDTO
    │
    │ [Background - mỗi 5 phút]
    ▼
ViewCountSyncScheduler.syncViewCounts()
    ├─ SCAN Redis keys: post:view:*
    ├─ UPDATE post SET view_count = view_count + delta
    └─ DEL Redis keys
```

### 11.3 Tìm kiếm bài viết

```
User → search.html?keyword=spring+boot
    │
    ▼
GET /api/posts/search?keyword=spring+boot
    │
    ▼
PostServiceImpl.searchPosts("spring boot")
    │
    ├─ [Primary] Elasticsearch query:
    │    multi_match(title, summary, content)
    │    → postIds → SELECT FROM post WHERE id IN (?) AND status=1
    │
    └─ [Fallback] MySQL LIKE:
         WHERE (title LIKE '%spring boot%' OR content LIKE '%spring boot%')
           AND status=1
```

### 11.4 Bình luận + Thông báo

```
User → Comment on post
    │
    ▼
POST /api/comments { postId, content, parentId? }
    │
    ▼
CommentServiceImpl.createComment()
    ├─ INSERT post_comment (published=false) → MySQL
    └─ Kafka.send("blog.events.comment", CommentEvent(CREATED))
              │
              ▼
        NotificationService.consume()
              ├─ If commenter ≠ post author → INSERT notification(NEW_COMMENT)
              └─ If reply & replier ≠ parent author → INSERT notification(REPLY_COMMENT)
    
Admin → Approve comment
    │
    ▼
PUT /api/comments/{id}/approve
    → UPDATE post_comment SET published=true, published_at=NOW()

Public → See approved comments
    GET /api/comments/post/{postId}/published
```

---

## 12. Design Patterns & Principles

### 12.1 Patterns sử dụng

| Pattern | Vị trí | Mô tả |
|---------|--------|-------|
| **Layered Architecture** | Backend tổng thể | Controller → Service → Repository → DB |
| **Repository Pattern** | `repository/` | Abstraction cho data access (Spring Data JPA) |
| **DTO Pattern** | `dto/` | Tách biệt internal entity và API response |
| **Service-Interface Pattern** | `service/` + `service/impl/` | Interface + Implementation separation |
| **Mapper Pattern** | `dto/*Mapper.java` | MapStruct: Entity ↔ DTO tự động |
| **Observer/Event-Driven** | Kafka Producer/Consumer | Giảm coupling giữa PostService và ES Sync |
| **AOP (Aspect-Oriented)** | `aspect/AuditAspect` + `@Auditable` | Cross-cutting concern: audit logging |
| **Filter Chain** | `security/jwt/AuthTokenFilter` | Request pipeline processing |
| **Global Exception Handler** | `advice/GlobalExceptionHandler` | Centralized error handling |
| **Service Layer (Frontend)** | `js/services/*.service.js` | Abstraction cho API calls |
| **HTTP Interceptor** | `js/http.js` | Token inject, 401 handling, response unwrap |
| **Specification Pattern** | `spec/` | Dynamic query building cho filtering/pagination |
| **Template Method** | CKEditor UploadAdapter | Custom image upload adapter |
| **Scheduled Tasks** | `ViewCountSyncScheduler`, `OrphanedFileCleanupTask` | Background data maintenance |

### 12.2 API Response Wrapper Pattern

Tất cả API response đều được wrap trong `ApiResponse<T>`:

```json
// Success
{
    "success": true,
    "message": "Tạo bài viết thành công",
    "data": { ... }
}

// Error
{
    "success": false,
    "message": "Không tìm thấy bài viết với id=99",
    "data": null
}
```

Frontend `http.js` tự động unwrap: `response.success === true` → return `response.data`.

### 12.3 Key Principles

- **Separation of Concerns**: Mỗi layer có trách nhiệm rõ ràng
- **Convention over Configuration**: Tuân thủ Spring Boot conventions
- **Fail-Safe**: Elasticsearch fallback → MySQL LIKE khi ES lỗi
- **Eventual Consistency**: View count (Redis → MySQL), ES index (Kafka async)
- **Security in Depth**: CORS → JWT Filter → Endpoint Auth → Method Auth
- **No Framework Lock-in (Frontend)**: Vanilla JS, không dùng React/Vue → dễ maintain

---

> **Tài liệu liên quan:**
> - `PROJECT_DOCUMENTATION.md` – Chi tiết API endpoints, entities, services
> - `blog-backend/BACKEND_OVERVIEW.md` – Backend overview
> - `blog-backend/DEPLOYMENT_GUIDE.md` – Hướng dẫn deploy
> - `blog-backend/SYSTEM_ARCHITECTURE.md` – System architecture chi tiết
> - `blog-backend/OAUTH2_FLOW.md` – OAuth2 flow chi tiết
> - `readme/` – Các hướng dẫn kỹ thuật bổ sung (Vietnamese)