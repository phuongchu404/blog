package me.phuongcm.blog.security.oauth2;

import lombok.*;

import java.util.Map;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserOAuth2Response {
    private Long id;

    private String email;

    private String username;

    private String password;

    private Set<String> roles;

    private Map<String, Object> attributes;
}
