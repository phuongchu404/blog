package me.phuongcm.blog.config;

import me.phuongcm.blog.security.jwt.AuthEntryPointJwt;
import me.phuongcm.blog.security.jwt.AuthTokenFilter;
import me.phuongcm.blog.security.oauth2.CustomAuthorizationRequestResolver;
import me.phuongcm.blog.security.oauth2.CustomOAuth2UserService;
import me.phuongcm.blog.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import me.phuongcm.blog.security.oauth2.OAuth2AuthenticationFailureHandler;
import me.phuongcm.blog.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration — Chiến lược 2 lớp:
 *
 * Lớp 1 (HttpSecurity): chỉ phân biệt PUBLIC vs AUTHENTICATED.
 * - Public: auth, oauth2, GET public APIs
 * - Authenticated: tất cả còn lại cần JWT / session OAuth2
 *
 * Lớp 2 (@PreAuthorize trên method): kiểm tra permission cụ thể (RBAC).
 * - hasAuthority("post:publish") → có permission "post:publish"
 * - hasRole("ADMIN") → có role ROLE_ADMIN
 * - isAuthenticated() → đã đăng nhập (bất kỳ role)
 *
 * Cách tiếp cận này linh hoạt hơn hardcode hasRole() cho từng endpoint.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Kích hoạt @PreAuthorize / @PostAuthorize / @Secured trên method
public class WebSecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Autowired
    private OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Autowired
    private HttpCookieOAuth2AuthorizationRequestRepository cookieOAuth2AuthorizationRequestRepository;

    @Autowired
    private CustomAuthorizationRequestResolver customAuthorizationRequestResolver;

    @Bean
    public AuthEntryPointJwt authEntryPointJwt() {
        return new AuthEntryPointJwt();
    }

    @Bean
    public AuthTokenFilter authTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authEntryPointJwt()))

                // ===== Lớp 1: PUBLIC vs AUTHENTICATED =====
                // Phân quyền chi tiết (RBAC) xử lý ở @PreAuthorize trên từng controller method
                .authorizeHttpRequests(auth -> auth

                        // ----- Không cần đăng nhập -----
                        .requestMatchers("/auth/login", "/auth/register", "/auth/change-password").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // GET public content
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/published").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/slug/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/author/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/category/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/tag/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/series").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/series/slug/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/post/*/published").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/*/replies").permitAll()

                        // Settings public — site info cho blog-public (không cần đăng nhập)
                        .requestMatchers(HttpMethod.GET, "/api/settings/public").permitAll()

                        // Newsletter — subscribe/confirm/unsubscribe không cần đăng nhập
                        .requestMatchers(HttpMethod.POST, "/api/newsletter/subscribe").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/newsletter/confirm").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/newsletter/unsubscribe").permitAll()

                        // ----- Mọi request còn lại cần đăng nhập -----
                        // (chi tiết quyền hạn kiểm tra bằng @PreAuthorize)
                        .anyRequest().authenticated())

                // ===== OAuth2 Login =====
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(endpoint -> endpoint
                                .baseUri("/oauth2/authorize")
                                .authorizationRequestRepository(cookieOAuth2AuthorizationRequestRepository)
                                .authorizationRequestResolver(customAuthorizationRequestResolver))
                        .redirectionEndpoint(endpoint -> endpoint
                                .baseUri("/login/oauth2/code/*"))
                        .userInfoEndpoint(endpoint -> endpoint
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler));

        http.addFilterBefore(authTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
