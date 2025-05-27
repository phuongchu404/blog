package me.phuongcm.blog.security.jwt;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

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

    public String createToken(String username) {
        return createToken(username, false);
    }

    public String createToken(String username, boolean rememberMe) {
        Long now = (new Date()).getTime();
        Date validity;
        if(rememberMe) {
            validity= new Date(now + tokenValidityInSecondsForRememberMe * 1000);
        }else {
            validity = new Date(now + tokenValidityInSeconds * 1000);
        }

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer("me.phuongcm.blog")
                .issueTime(new Date())
                .expirationTime(validity)
                .claim("authorities", "ROLE_USER")
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secret.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Error sign jwt: {}",e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            JWSObject jwsObject = JWSObject.parse(token);
            if (!jwsObject.verify(new MACVerifier(secret.getBytes()))) {
                throw new RuntimeException("Invalid JWT signature");
            }
            JWTClaimsSet claimsSet = JWTClaimsSet.parse(jwsObject.getPayload().toJSONObject());
            return claimsSet.getSubject();
        } catch (Exception e) {
            log.error("Error parsing jwt: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT token");
        }
    }

}
