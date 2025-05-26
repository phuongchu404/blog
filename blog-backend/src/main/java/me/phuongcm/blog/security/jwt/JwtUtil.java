package me.phuongcm.blog.security.jwt;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JwtUtil {

    @Value("${application.security.jwt.secret}")
    String secret;

    @Value("${application.security.jwt.token-validity-in-seconds}")
    Long tokenValidityInSeconds;

    @Value("${application.security.jwt.token-validity-in-seconds-for-remember-me}")
    Long tokenValidityInSecondsForRememberMe;

}
