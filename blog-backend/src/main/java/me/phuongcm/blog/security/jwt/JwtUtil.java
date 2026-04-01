package me.phuongcm.blog.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class xử lý JWT token dùng jjwt 0.12.x API.
 *
 * Thay đổi so với 0.11.x:
 * - Jwts.parserBuilder() → Jwts.parser()
 * - .setSigningKey(key) → .verifyWith(secretKey)
 * - .parseClaimsJws(token) → .parseSignedClaims(token)
 * - .getBody() → .getPayload()
 * - Builder: .setSubject() → .subject(), .setIssuedAt() → .issuedAt(), .setExpiration() → .expiration()
 * - signWith(algorithm, key) → signWith(key) — auto-detect algorithm từ key type
 * - key() trả về SecretKey thay vì Key
 */
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

    /**
     * Tạo JWT token cho username, không nhớ đăng nhập (24h mặc định).
     */
    public String createToken(String username) {
        return createToken(username, false);
    }

    /**
     * Tạo JWT token cho username.
     * @param username tên đăng nhập
     * @param rememberMe nếu true, token có thời hạn dài hơn (30 ngày)
     */
    public String createToken(String username, boolean rememberMe) {
        Date now = new Date();
        long expiryMs = rememberMe
                ? tokenValidityInSecondsForRememberMe * 1000
                : tokenValidityInSeconds * 1000;
        Date expiration = new Date(now.getTime() + expiryMs);

        // jjwt 0.12.x: dùng method chain mới — subject/issuedAt/expiration thay vì setXxx
        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey())        // auto-detect HMAC-SHA algorithm từ key size
                .compact();
    }

    /**
     * Validate JWT token — trả về true nếu token hợp lệ và chưa hết hạn.
     */
    public boolean validateToken(String token) {
        try {
            // jjwt 0.12.x: Jwts.parser() + verifyWith(SecretKey) + parseSignedClaims()
            Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Lấy username từ JWT token.
     */
    public String getUsernameFromToken(String token) {
        // jjwt 0.12.x: .getPayload() thay cho .getBody()
        return Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Tạo SecretKey từ Base64-encoded secret string.
     * Trả về SecretKey (javax.crypto) thay vì Key (java.security) như 0.11.x.
     */
    private SecretKey secretKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
