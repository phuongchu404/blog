//package me.phuongcm.blog.config;
//
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import me.phuongcm.blog.common.utils.ERole;
//import me.phuongcm.blog.entity.Permission;
//import me.phuongcm.blog.entity.Role;
//import me.phuongcm.blog.entity.RolePermission;
//import me.phuongcm.blog.repository.PermissionRepository;
//import me.phuongcm.blog.repository.RolePermissionRepository;
//import me.phuongcm.blog.repository.RoleRepository;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.core.annotation.Order;
//import org.springframework.stereotype.Component;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.Arrays;
//import java.util.List;
//import java.util.Map;
//
///**
// * Khởi tạo dữ liệu mặc định khi start app:
// * 1. Seed Roles (ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR)
// * 2. Seed Permissions (resource:action format)
// * 3. Gán Permissions cho từng Role (RBAC mapping)
// *
// * Idempotent: kiểm tra existsByName trước khi tạo - an toàn khi restart.
// */
//@Component
//@Order(1)
//@RequiredArgsConstructor
//@Slf4j
//public class DataInitializer implements CommandLineRunner {
//
//    private final RoleRepository roleRepository;
//    private final PermissionRepository permissionRepository;
//    private final RolePermissionRepository rolePermissionRepository;
//
//    // ========== Danh sách tất cả permissions ==========
//    // Format: name (dùng làm GrantedAuthority) → tag (mô tả hiển thị UI)
//    private static final List<String[]> ALL_PERMISSIONS = Arrays.asList(
//        // Post
//        new String[]{"post:read:all",     "Xem tất cả bài viết (kể cả chưa đăng)"},
//        new String[]{"post:create",       "Tạo bài viết mới"},
//        new String[]{"post:update:any",   "Cập nhật bất kỳ bài viết"},
//        new String[]{"post:delete:any",   "Xóa bất kỳ bài viết"},
//        new String[]{"post:publish",      "Xuất bản/hủy xuất bản bài viết"},
//        new String[]{"post:meta:manage",  "Quản lý metadata bài viết"},
//        // Category
//        new String[]{"category:create",   "Tạo danh mục mới"},
//        new String[]{"category:update",   "Cập nhật danh mục"},
//        new String[]{"category:delete",   "Xóa danh mục"},
//        // Tag
//        new String[]{"tag:create",        "Tạo tag mới"},
//        new String[]{"tag:update",        "Cập nhật tag"},
//        new String[]{"tag:delete",        "Xóa tag"},
//        // Comment
//        new String[]{"comment:create",    "Tạo bình luận"},
//        new String[]{"comment:update:any","Cập nhật bất kỳ bình luận"},
//        new String[]{"comment:delete:any","Xóa bất kỳ bình luận"},
//        new String[]{"comment:moderate",  "Duyệt/từ chối bình luận"},
//        new String[]{"comment:read:all",  "Xem tất cả bình luận (kể cả chờ duyệt)"},
//        // User
//        new String[]{"user:read:all",     "Xem danh sách tất cả người dùng"},
//        new String[]{"user:update:any",   "Cập nhật bất kỳ tài khoản"},
//        new String[]{"user:delete",       "Xóa tài khoản người dùng"}
//    );
//
//    // ========== ROLE_ADMIN: toàn quyền ==========
//    private static final List<String> ADMIN_PERMISSIONS = Arrays.asList(
//        "post:read:all", "post:create", "post:update:any", "post:delete:any",
//        "post:publish", "post:meta:manage",
//        "category:create", "category:update", "category:delete",
//        "tag:create", "tag:update", "tag:delete",
//        "comment:create", "comment:update:any", "comment:delete:any",
//        "comment:moderate", "comment:read:all",
//        "user:read:all", "user:update:any", "user:delete"
//    );
//
//    // ========== ROLE_USER: tạo/sửa/xóa content của mình ==========
//    private static final List<String> USER_PERMISSIONS = Arrays.asList(
//        "post:create", "post:update:any", "post:delete:any",
//        "post:meta:manage",
//        "comment:create", "comment:update:any", "comment:delete:any"
//    );
//
//    // ========== ROLE_MODERATOR: kiểm duyệt nội dung ==========
//    private static final List<String> MODERATOR_PERMISSIONS = Arrays.asList(
//        "comment:moderate", "comment:read:all", "comment:create",
//        "comment:delete:any"
//    );
//
//    @Override
//    @Transactional
//    public void run(String... args) {
//        log.info("=== DataInitializer: Seeding Roles, Permissions, Role-Permission mappings ===");
//
//        seedRoles();
//        seedPermissions();
//        seedRolePermissions();
//
//        log.info("=== DataInitializer: Done ===");
//    }
//
//    private void seedRoles() {
//        for (ERole eRole : ERole.values()) {
//            if (!roleRepository.existsByName(eRole.getValue())) {
//                Role role = new Role();
//                role.setName(eRole.getValue());
//                role.setDescription(switch (eRole) {
//                    case ROLE_ADMIN     -> "Quản trị viên — toàn quyền hệ thống";
//                    case ROLE_MODERATOR -> "Kiểm duyệt viên — duyệt nội dung";
//                    case ROLE_USER      -> "Người dùng thông thường";
//                });
//                roleRepository.save(role);
//                log.info("  Created role: {}", eRole.getValue());
//            }
//        }
//    }
//
//    private void seedPermissions() {
//        for (String[] perm : ALL_PERMISSIONS) {
//            String name = perm[0];
//            String tag  = perm[1];
//            if (!permissionRepository.existsByName(name)) {
//                permissionRepository.save(new Permission(name, tag));
//                log.info("  Created permission: {}", name);
//            }
//        }
//    }
//
//    private void seedRolePermissions() {
//        // Gán quyền cho từng role
//        assignPermissionsToRole(ERole.ROLE_ADMIN.getValue(),     ADMIN_PERMISSIONS);
//        assignPermissionsToRole(ERole.ROLE_USER.getValue(),      USER_PERMISSIONS);
//        assignPermissionsToRole(ERole.ROLE_MODERATOR.getValue(), MODERATOR_PERMISSIONS);
//    }
//
//    private void assignPermissionsToRole(String roleName, List<String> permissionNames) {
//        Role role = roleRepository.findByName(roleName).orElse(null);
//        if (role == null) {
//            log.warn("  Role not found: {}", roleName);
//            return;
//        }
//
//        for (String permName : permissionNames) {
//            Permission permission = permissionRepository.findByName(permName).orElse(null);
//            if (permission == null) {
//                log.warn("  Permission not found: {}", permName);
//                continue;
//            }
//            // Idempotent: chỉ tạo nếu chưa tồn tại
//            if (!rolePermissionRepository.existsByRoleIdAndPermissionId(role.getId(), permission.getId())) {
//                RolePermission rp = new RolePermission();
//                rp.setRole(role);
//                rp.setPermission(permission);
//                rolePermissionRepository.save(rp);
//                log.info("  Assigned {} → {}", roleName, permName);
//            }
//        }
//    }
//}
