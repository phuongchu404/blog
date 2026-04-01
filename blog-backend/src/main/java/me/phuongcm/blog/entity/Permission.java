package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "permission")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tên permission theo định dạng "resource:action" dùng cho GrantedAuthority.
     * Ví dụ: "post:create", "post:publish", "comment:moderate", "user:delete"
     */
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Nhãn mô tả ngắn cho permission (hiển thị trên UI quản lý).
     * Ví dụ: "Tạo bài viết", "Duyệt bình luận"
     */
    @Column(name = "tag", nullable = false, length = 120)
    private String tag;

    @Column(name = "type", length = 20)
    private String type;

    @Column(name = "method", length = 10)
    private String method;

    @Column(name = "pattern", length = 200)
    private String pattern;

    @Column(name = "is_white_list")
    private Integer isWhiteList;

    @Column(name = "created_at")
    @CreatedDate
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    private LocalDateTime updatedAt;

    public Permission(String name, String tag) {
        this.name = name;
        this.tag = tag;
    }
}
