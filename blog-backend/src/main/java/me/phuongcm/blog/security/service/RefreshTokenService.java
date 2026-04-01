package me.phuongcm.blog.security.service;

import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.entity.RefreshToken;
import me.phuongcm.blog.repository.RefreshTokenRepository;
import me.phuongcm.blog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${application.security.jwt.token-validity-in-seconds-for-refresh:604800}") // Default 7 days
    private Long refreshTokenDurationSecs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        if (userId == null) {
            throw new ServiceException(Error.USER_NOT_FOUND);
        }
        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setUser(userRepository.findById(userId).orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND)));
        refreshToken.setExpiryDate(Instant.now().plusSeconds(refreshTokenDurationSecs));
        refreshToken.setToken(UUID.randomUUID().toString());

        // We could delete older tokens for user here if we want only 1 concurrent session
        refreshTokenRepository.deleteByUser(refreshToken.getUser());
        
        refreshToken = refreshTokenRepository.save(refreshToken);
        return refreshToken;
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }

        return token;
    }

    @Transactional
    public int deleteByUserId(Long userId) {
        if (userId == null) {
            return 0;
        }
        return refreshTokenRepository.deleteByUser(userRepository.findById(userId).get());
    }
}
