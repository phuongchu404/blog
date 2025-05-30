package me.phuongcm.blog.entity;

import jakarta.annotation.Nonnull;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.phuongcm.blog.common.utils.AuthProvider;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "user")
public class User extends AuditEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", length = 100, nullable = false)
    private String username; //chưa có

    @Column(name = "password", length = 100, nullable = true)
    private String password; //passwordHash

//    @Column(name = "full_name", length = 100)
//    private String fullName;
    @Column(name = "first_name", length = 50)
    private String firstName;

    @Column(name = "middle_name", length = 50)
    private String middleName;

    @Column(name = "last_name", length = 50)
    private String lastName;

    @Column(name = "email", length = 50, unique = true)
    private String email;

    @Column(name = "status", length = 1, nullable = false)
    private Integer status; //chưa có

    @Column(name = "mobile", length = 10)
    private String mobile;

    @Column(name = "image_url")
    private String imageUrl; //chưa có

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "intro")
    private String intro;

    @Column(name = "profile")
    private String profile;

    @NotNull
    @Column(name = "provider")
    @Enumerated(EnumType.STRING)
    private AuthProvider provider; //chưa có

    @Column(name = "provider_id")
    private String providerId; //chưa có
}
