package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "newsletter_subscriber")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NewsletterSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    /** true = đã xác nhận qua email, false = chờ xác nhận hoặc đã hủy */
    @Column(nullable = false)
    private Boolean active = false;

    /**
     * Token dùng để xác nhận đăng ký (confirm) và hủy đăng ký (unsubscribe).
     * Sau khi confirm thành công token được tái tạo để dùng cho unsubscribe link.
     */
    @Column(name = "confirm_token", unique = true, length = 100)
    private String confirmToken;

    @Column(name = "subscribed_at")
    private LocalDateTime subscribedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
