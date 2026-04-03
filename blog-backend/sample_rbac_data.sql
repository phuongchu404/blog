-- ==========================================
-- MẪU DỮ LIỆU RBAC (Role-Based Access Control)
-- Cho 2 loại Permission: MENU và API
-- ==========================================

-- Lưu ý: Thực thi đoạn script này khi các bảng user, role, permission, role_permission, user_role đã được tạo (Hibernate auto-ddl hoặc Flyway script).
-- Tắt kiểm tra khóa ngoại (nếu cần thiết để truncate bảng, tuỳ chọn)
-- SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. Insert Roles (Bảng role)
-- ==========================================
INSERT INTO `role` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'ROLE_ADMIN', 'Administrator with full access', NOW(), NOW()),
(2, 'ROLE_EDITOR', 'Editor can manage posts and content', NOW(), NOW()),
(3, 'ROLE_USER', 'Normal user', NOW(), NOW());

-- ==========================================
-- 2. Insert Permissions (Type: MENU) - Quyền truy cập các màn hình hiển thị
-- ==========================================
-- Pattern với type MENU có thể là đường dẫn route ở Frontend (VD: Vue Router)
INSERT INTO `permission` (`id`, `name`, `tag`, `type`, `method`, `pattern`, `is_white_list`, `created_at`, `updated_at`) VALUES
-- Admin Menus
(1, 'menu:dashboard', 'Dashboard', 'MENU', NULL, '/admin/dashboard', 0, NOW(), NOW()),
(2, 'menu:users', 'Quản lý người dùng', 'MENU', NULL, '/admin/users', 0, NOW(), NOW()),
(3, 'menu:roles', 'Quản lý Role', 'MENU', NULL, '/admin/roles', 0, NOW(), NOW()),
(4, 'menu:permissions', 'Quản lý Permission', 'MENU', NULL, '/admin/permissions', 0, NOW(), NOW()),
-- Editor Menus
(5, 'menu:posts', 'Quản lý bài viết', 'MENU', NULL, '/admin/posts', 0, NOW(), NOW()),
(6, 'menu:categories', 'Quản lý danh mục', 'MENU', NULL, '/admin/categories', 0, NOW(), NOW()),
(7, 'menu:tags', 'Quản lý tag', 'MENU', NULL, '/admin/tags', 0, NOW(), NOW());

-- ==========================================
-- 3. Insert Permissions (Type: API) - Quyền gọi API thực thi tác vụ
-- ==========================================
INSERT INTO `permission` (`id`, `name`, `tag`, `type`, `method`, `pattern`, `is_white_list`, `created_at`, `updated_at`) VALUES
-- Post API
(8, 'post:read', 'Xem bài viết', 'API', 'GET', '/api/v1/posts/**', 1, NOW(), NOW()), -- is_white_list = 1 (public)
(9, 'post:create', 'Tạo bài viết', 'API', 'POST', '/api/v1/posts', 0, NOW(), NOW()),
(10, 'post:update', 'Cập nhật bài viết', 'API', 'PUT', '/api/v1/posts/**', 0, NOW(), NOW()),
(11, 'post:delete', 'Xóa bài viết', 'API', 'DELETE', '/api/v1/posts/**', 0, NOW(), NOW()),

-- User API
(12, 'user:read', 'Xem user', 'API', 'GET', '/api/v1/users/**', 0, NOW(), NOW()),
(13, 'user:create', 'Tạo user', 'API', 'POST', '/api/v1/users', 0, NOW(), NOW()),
(14, 'user:update', 'Cập nhật user', 'API', 'PUT', '/api/v1/users/**', 0, NOW(), NOW()),
(15, 'user:delete', 'Xóa user', 'API', 'DELETE', '/api/v1/users/**', 0, NOW(), NOW()),

-- Role API
(16, 'role:read', 'Xem role', 'API', 'GET', '/api/v1/roles/**', 0, NOW(), NOW()),
(17, 'role:manage', 'Quản lý role (Create/Update/Delete)', 'API', '*', '/api/v1/roles/**', 0, NOW(), NOW()),

-- Permission API
(18, 'permission:read', 'Xem permission', 'API', 'GET', '/api/v1/permissions/**', 0, NOW(), NOW()),
(19, 'permission:manage', 'Quản lý permission (Create/Update/Delete)', 'API', '*', '/api/v1/permissions/**', 0, NOW(), NOW());

-- ==========================================
-- 4. Map Permissions to Roles (Role_Permission)
-- ==========================================
-- ROLE_ADMIN (id=1) được cấp TẤT CẢ chức năng (cả MENU và API)
INSERT INTO `role_permission` (`role_id`, `permission_id`, `created_at`, `updated_at`)
SELECT 1, id, NOW(), NOW() FROM `permission`;

-- ROLE_EDITOR (id=2) chỉ được cấp MENU và API liên quan đến Post, Category, Tag
INSERT INTO `role_permission` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(2, 1, NOW(), NOW()),  -- Dashboard Menu
(2, 5, NOW(), NOW()),  -- Manage Posts Menu
(2, 6, NOW(), NOW()),  -- Manage Categories Menu
(2, 7, NOW(), NOW()),  -- Manage Tags Menu
(2, 8, NOW(), NOW()),  -- post:read API
(2, 9, NOW(), NOW()),  -- post:create API
(2, 10, NOW(), NOW()), -- post:update API
(2, 11, NOW(), NOW()); -- post:delete API

-- ROLE_USER (id=3) chỉ có quyền đọc API Post (thêm dashboard nếu cần)
INSERT INTO `role_permission` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(3, 8, NOW(), NOW());  -- post:read API

-- ==========================================
-- 5. Insert Sample Users (Bảng user)
-- ==========================================
-- Lưu ý: Mật khẩu dưới đây là '123456' đã được băm bằng BCrypt ($2a$12$...)
INSERT INTO `user` (`id`, `username`, `password`, `email`, `status`, `provider`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$12$R.S91B33PzGE92MvV9v5CewT862QWc8sDccAEYp17F5B/YpEofzha', 'admin@example.com', 1, 'LOCAL', NOW(), NOW()),
(2, 'editor', '$2a$12$R.S91B33PzGE92MvV9v5CewT862QWc8sDccAEYp17F5B/YpEofzha', 'editor@example.com', 1, 'LOCAL', NOW(), NOW()),
(3, 'user_test', '$2a$12$R.S91B33PzGE92MvV9v5CewT862QWc8sDccAEYp17F5B/YpEofzha', 'user@example.com', 1, 'LOCAL', NOW(), NOW());

-- ==========================================
-- 6. Map Roles to Users (User_Role)
-- ==========================================
INSERT INTO `user_role` (`user_id`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 1, NOW(), NOW()), -- User: admin -> Role: ROLE_ADMIN
(2, 2, NOW(), NOW()), -- User: editor -> Role: ROLE_EDITOR
(3, 3, NOW(), NOW()); -- User: user_test -> Role: ROLE_USER

-- SET FOREIGN_KEY_CHECKS = 1;
