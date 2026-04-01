package me.phuongcm.blog.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.exception.BadRequestException;
import me.phuongcm.blog.common.utils.CookieUtils;
import me.phuongcm.blog.entity.RefreshToken;
import me.phuongcm.blog.security.jwt.JwtUtil;
import me.phuongcm.blog.security.service.CustomUserDetails;
import me.phuongcm.blog.security.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Optional;

import static me.phuongcm.blog.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

@Component
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${application.security.oauth2.authorizedRedirectUris}")
    private List<String> authorizedRedirectUris;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        if (response.isCommitted()) {
            log.info("Response has already been committed. Unable to redirect to {}", targetUrl);
            return;
        }
        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) {
        Optional<String> redirectUri = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        // Fix: đảo điều kiện — phải throw khi URI KHÔNG nằm trong whitelist
        if (redirectUri.isPresent() && !isAuthorizedRedirectUri(redirectUri.get())) {
            throw new BadRequestException(
                    "Unauthorized redirect URI: " + redirectUri.get() +
                    ". Cannot proceed with the authentication.");
        }

        String targetUrl = redirectUri.orElse(getDefaultTargetUrl());
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtUtil.createToken(userDetails.getUsername());
        
        // Tạo Refresh Token cho người dùng
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

        // Phương án A: Trả Refresh Token qua URL cùng với Access Token
        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token)
                .queryParam("refreshToken", refreshToken.getToken())
                .build().toUriString();
    }

    private void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    /**
     * Kiểm tra xem redirectUri có nằm trong danh sách whitelist không.
     * So sánh host + port để tránh open-redirect attack.
     */
    private boolean isAuthorizedRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);
        return authorizedRedirectUris.stream().anyMatch(authorizedRedirectUri -> {
            URI authorizedUri = URI.create(authorizedRedirectUri.trim());
            return authorizedUri.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                    && authorizedUri.getPort() == clientRedirectUri.getPort();
        });
    }
}
