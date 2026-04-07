package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "upload_trackers")
@Getter
@Setter
@NoArgsConstructor
public class UploadTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "object_name", nullable = false)
    private String objectName;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UploadTrackerStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public UploadTracker(String objectName, String url, UploadTrackerStatus status) {
        this.objectName = objectName;
        this.url = url;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }
}
