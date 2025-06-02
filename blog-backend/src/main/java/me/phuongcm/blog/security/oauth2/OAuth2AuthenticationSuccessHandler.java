package me.phuongcm.blog.security.oauth2;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.exception.BadRequestException;
import me.phuongcm.blog.common.utils.CookieUtils;
import me.phuongcm.blog.security.jwt.JwtUtil;
import me.phuongcm.blog.security.service.CustomUserDetails;
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
    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        if (response.isCommitted()) {
            log.info("Response has already been committed. Unable to redirect to {}", targetUrl);
            return;
        }
        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication){
        Optional<String> redirectUri = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME).map(Cookie::getValue);
        if(redirectUri.isPresent() && isAuthenticationRedirectUri(redirectUri.get())){
            throw new BadRequestException("Sorry! We've got an Unauthorized Redirect URI and can't proceed with the authentication");
        }
        String targerUrl = redirectUri.orElse(getDefaultTargetUrl());
        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtUtil.createToken(customUserDetails.getUsername());
        return UriComponentsBuilder.fromUriString(targerUrl).queryParam("token", token).build().toUriString();
    }

    private void  clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    private boolean isAuthenticationRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);
        return authorizedRedirectUris.stream().anyMatch(authorizedRedirectUri ->{
            URI authorizedUri = URI.create(authorizedRedirectUri);
            if(authorizedUri.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                    && authorizedUri.getPort() == clientRedirectUri.getPort()){
                return true;
            }
            return false;
        });
    }


}
