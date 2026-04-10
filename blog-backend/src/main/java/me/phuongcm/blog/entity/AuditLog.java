package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_user_id",   columnList = "user_id"),
        @Index(name = "idx_audit_action",    columnList = "action"),
        @Index(name = "idx_audit_resource",  columnList = "resource"),
        @Index(name = "idx_audit_created",   columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID user thực hiện (null nếu anonymous) */
    @Column(name = "user_id")
    private Long userId;

    /** Username tại thời điểm thực hiện */
    @Column(name = "username", length = 100)
    private String username;

    /** Hành động: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PUBLISH, APPROVE... */
    @Column(name = "action", length = 30, nullable = false)
    private String action;

    /** Tài nguyên: POST, COMMENT, USER, CATEGORY, TAG, ROLE, PERMISSION, AUTH, FILE */
    @Column(name = "resource", length = 30, nullable = false)
    private String resource;

    /** ID tài nguyên bị tác động (nullable) */
    @Column(name = "resource_id")
    private Long resourceId;

    /** Mô tả chi tiết hành động */
    @Column(name = "detail", length = 500)
    private String detail;

    /** IP address của client */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /** User-Agent (trình duyệt / client) */
    @Column(name = "user_agent", length = 300)
    private String userAgent;

    /** SUCCESS | FAIL */
    @Column(name = "status", length = 10, nullable = false)
    private String status;

    /** Thời gian thực thi (milliseconds) */
    @Column(name = "duration_ms")
    private Integer durationMs;

    /** Thông báo lỗi nếu status = FAIL */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
