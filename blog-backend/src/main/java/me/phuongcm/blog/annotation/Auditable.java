package me.phuongcm.blog.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu method cần ghi nhật ký hoạt động vào bảng audit_log.
 *
 * Sử dụng:
 *   @Auditable(action = "CREATE", resource = "POST")
 *   public PostDTO createPost(...) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /** Hành động thực hiện: LOGIN, LOGOUT, REGISTER, CREATE, UPDATE, DELETE,
     *  PUBLISH, UNPUBLISH, APPROVE, REJECT, UPLOAD, CHANGE_PASSWORD, EXPORT */
    String action();

    /** Tài nguyên tác động: AUTH, POST, COMMENT, CATEGORY, TAG,
     *  USER, ROLE, PERMISSION, FILE, NOTIFICATION */
    String resource();

    /** Mô tả tùy chỉnh (để trống thì AuditAspect tự sinh). */
    String detail() default "";
}
