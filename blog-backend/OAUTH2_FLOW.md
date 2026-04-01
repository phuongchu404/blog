# Luồng OAuth2 — Blog Backend

## Tổng Quan

Blog Backend sử dụng **OAuth2 Authorization Code Flow** kết hợp với **JWT** theo kiến trúc stateless. Khi người dùng đăng nhập qua Google/Facebook/GitHub, hệ thống sẽ tạo JWT token và redirect về frontend — không lưu session phía server.

---

## Sơ Đồ Luồng Tổng Quát

```
Browser/Frontend                  Backend                      OAuth Provider (Google...)
      │                               │                               │
      │  1. Bắt đầu login OAuth2      │                               │
      │──GET /oauth2/authorize/google─►│                               │
      │  (kèm ?redirect_uri=...)       │                               │
      │                               │                               │
      │                    2. Lưu state vào Cookie                    │
      │                    (oauth2_auth_request + redirect_uri)        │
      │                               │                               │
      │  3. Redirect tới Google        │                               │
      │◄──────────────────────────────│                               │
      │                               │                               │
      │  4. User đăng nhập Google      │                               │
      │──────────────────────────────────────────────────────────────►│
      │                               │                               │
      │  5. Google redirect về Backend │                               │
      │                               │◄──GET /login/oauth2/code/google│
      │                               │   (kèm authorization_code)    │
      │                               │                               │
      │                    6. Backend đổi code lấy access_token       │
      │                               │──────────────────────────────►│
      │                               │◄── access_token ──────────────│
      │                               │                               │
      │                    7. Lấy thông tin user từ Google             │
      │                               │──────────────────────────────►│
      │                               │◄── {email, name, picture} ────│
      │                               │                               │
      │                    8. Xử lý user trong DB                     │
      │                    (tạo mới hoặc cập nhật)                    │
      │                               │                               │
      │                    9. Tạo JWT token                           │
      │                               │                               │
      │  10. Redirect về Frontend      │                               │
      │◄──────────────────────────────│                               │
      │  (kèm ?token=<JWT>)            │                               │
      │                               │                               │
      │  11. Frontend lưu token,       │                               │
      │      gọi API với Bearer token  │                               │
      │──GET /auth/me (Authorization: Bearer <JWT>)──────────────────►│
```

---

## Các Bước Chi Tiết

### Bước 1 — Frontend khởi tạo OAuth2

Frontend gửi request đến backend:

```
GET /oauth2/authorize/google?redirect_uri=http://localhost:3000/oauth2/redirect
```

| Tham số | Mô tả |
|---------|-------|
| `google` | Registration ID của provider (cũng có thể là `facebook`, `github`) |
| `redirect_uri` | URL frontend nhận JWT sau khi đăng nhập thành công |

> ⚠️ `redirect_uri` này **phải nằm trong whitelist** cấu hình tại `application.yml`:
> ```yaml
> application.security.oauth2.authorizedRedirectUris:
>   - http://localhost:3000/oauth2/redirect
> ```

---

### Bước 2 — Lưu state vào Cookie

**Class:** `HttpCookieOAuth2AuthorizationRequestRepository`

Spring Security chuẩn bị `OAuth2AuthorizationRequest` (chứa state, code_challenge...) và backend lưu vào **2 cookies** thay vì HttpSession (vì stateless):

| Cookie | Nội dung | Thời hạn |
|--------|---------|---------|
| `oauth2_auth_request` | Serialized `OAuth2AuthorizationRequest` (Base64) | 3 phút |
| `redirect_uri` | URL frontend cần redirect sau khi xong | 3 phút |

```java
// HttpCookieOAuth2AuthorizationRequestRepository.saveAuthorizationRequest()
CookieUtils.addCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME,
        CookieUtils.serialize(authorizationRequest), 180);
CookieUtils.addCookie(response, REDIRECT_URI_PARAM_COOKIE_NAME,
        redirectUriAfterLogin, 180);
```

---

### Bước 3-4 — Redirect đến Provider & User Đăng Nhập

Backend redirect browser đến trang đăng nhập của Google/Facebook/GitHub.
User thực hiện đăng nhập tại đó.

**URL ví dụ (Google):**
```
https://accounts.google.com/o/oauth2/auth
  ?client_id=<CLIENT_ID>
  &redirect_uri=http://localhost:8080/login/oauth2/code/google
  &response_type=code
  &scope=email%20profile
  &state=<RANDOM_STATE>
```

---

### Bước 5 — Google Callback về Backend

Google redirect về:
```
GET /login/oauth2/code/google?code=<AUTH_CODE>&state=<STATE>
```

Backend khôi phục `OAuth2AuthorizationRequest` từ cookie `oauth2_auth_request` để verify state.

---

### Bước 6-7 — Đổi Code & Lấy User Info

Spring Security tự động:
1. Dùng `authorization_code` đổi lấy `access_token` từ Google
2. Dùng `access_token` gọi `userinfo` endpoint của Google → nhận `{email, name, picture, id}`

---

### Bước 8 — Xử Lý User trong DB

**Class:** `CustomOAuth2UserService.processOAuth2User()`

```
OAuth2UserInfo ← OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes)
      │
      ▼
email có tồn tại trong DB không?
      │
      ├── CÓ → kiểm tra provider có khớp không?
      │               │
      │               ├── KHỚP → cập nhật fullName, imageUrl → updateExistingUser()
      │               │
      │               └── KHÔNG KHỚP → throw OAuth2AuthenticationProcessingException
      │                   ("Bạn đã đăng ký với Google, hãy dùng Google để đăng nhập")
      │
      └── KHÔNG → tạo user mới → registerNewUser()
                  ● provider = google/facebook/github
                  ● username = {email prefix}_{random nếu trùng}
                  ● status = ACTIVE
                  ● password = random (không bao giờ dùng)
                  ● Gán role ROLE_USER
```

**Class mapping provider → UserInfo:**

| Provider | Class | Email field | Name field | Picture field |
|----------|-------|------------|-----------|--------------|
| Google | `GoogleOAuth2UserInfo` | `email` | `name` | `picture` |
| Facebook | `FacebookOAuth2UserInfo` | `email` | `name` | `picture.data.url` |
| GitHub | `GithubOAuth2UserInfo` | `email` | `name` | `avatar_url` |

**Load RBAC authorities:**
```java
// Sau khi xác định userId:
Set<String> roles       = userRoleRepository.findRoleByUserId(userId)      // "ROLE_USER"
Set<String> permissions = permissionRepository.findPermissionsByUserId(userId)  // "post:create", ...
Set<String> authorities = merge(roles, permissions)
```

---

### Bước 9 — Tạo JWT Token

**Class:** `OAuth2AuthenticationSuccessHandler.determineTargetUrl()`

```java
CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
String token = jwtUtil.createToken(userDetails.getUsername());
// → JWT chứa: subject=username, issuedAt, expiration, chữ ký HMAC-SHA
```

**Kiểm tra redirect URI:**
```java
// Lấy redirect_uri từ cookie
Optional<String> redirectUri = CookieUtils.getCookie(request, "redirect_uri");

// Nếu URI không nằm trong whitelist → từ chối (tránh open redirect attack)
if (redirectUri.isPresent() && !isAuthorizedRedirectUri(redirectUri.get())) {
    throw new BadRequestException("Unauthorized redirect URI");
}
```

---

### Bước 10 — Redirect về Frontend

```
HTTP 302 → http://localhost:3000/oauth2/redirect?token=eyJhbGciOiJIUzI1NiJ9...
```

Sau đó xóa cả 2 cookies (oauth2_auth_request, redirect_uri).

---

### Bước 11 — Frontend sử dụng token

Frontend:
1. Đọc `?token=` từ URL
2. Lưu vào `localStorage` hoặc memory
3. Gửi kèm vào header mọi API request:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ```
4. `AuthTokenFilter` trích xuất token → `JwtUtil.validateToken()` → load user → set SecurityContext

---

## Luồng Thất Bại

**Class:** `OAuth2AuthenticationFailureHandler`

Nếu xảy ra lỗi ở bất kỳ bước nào:
```
HTTP 302 → http://localhost:3000/oauth2/redirect?error=<error_message>
```

Frontend kiểm tra `?error=` để hiển thị thông báo.

---

## Cấu Hình Cần Thiết

### `application.yml`

```yaml
# Whitelist redirect URIs (phải khớp hoàn toàn host + port)
application:
  security:
    oauth2:
      authorizedRedirectUris:
        - http://localhost:3000/oauth2/redirect
        - http://localhost:8080/oauth2/redirect

# OAuth2 Provider credentials
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: <GOOGLE_CLIENT_ID>
            client-secret: <GOOGLE_CLIENT_SECRET>
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - email
              - profile
          github:
            client-id: <GITHUB_CLIENT_ID>
            client-secret: <GITHUB_CLIENT_SECRET>
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - user:email
              - read:user
```

### Google Cloud Console

1. Tạo project tại [console.cloud.google.com](https://console.cloud.google.com)
2. Bật **Google OAuth2 API**
3. Tạo **OAuth 2.0 Client ID** (loại Web application)
4. Thêm **Authorized redirect URIs**:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```

---

## Sơ Đồ Components

```
WebSecurityConfig
    └── oauth2Login()
            ├── authorizationEndpoint: /oauth2/authorize
            │       └── HttpCookieOAuth2AuthorizationRequestRepository (lưu/đọc cookie)
            │
            ├── redirectionEndpoint: /login/oauth2/code/*
            │
            ├── userInfoEndpoint
            │       └── CustomOAuth2UserService
            │               ├── OAuth2UserInfoFactory
            │               │       ├── GoogleOAuth2UserInfo
            │               │       ├── FacebookOAuth2UserInfo
            │               │       └── GithubOAuth2UserInfo
            │               ├── UserRepository (findByEmail / save)
            │               ├── UserRoleRepository (gán ROLE_USER)
            │               └── PermissionRepository (load RBAC authorities)
            │
            ├── successHandler: OAuth2AuthenticationSuccessHandler
            │       ├── Verify redirect_uri không bị giả mạo
            │       ├── JwtUtil.createToken(username)
            │       └── Redirect → {frontend_url}?token={JWT}
            │
            └── failureHandler: OAuth2AuthenticationFailureHandler
                    └── Redirect → {frontend_url}?error={message}
```

---

## So Sánh OAuth2 vs JWT Thông Thường

| | JWT Login (`/auth/login`) | OAuth2 |
|--|--------------------------|--------|
| **Xác thực bởi** | Backend (DB password) | Google/Facebook/GitHub |
| **Password** | Cần nhập | Không cần |
| **Token trả về** | JSON body `{ accessToken }` | URL query `?token=` |
| **User tạo bởi** | `AuthServiceImpl.register()` | `CustomOAuth2UserService.registerNewUser()` |
| **RBAC authorities** | `CustomUserDetailsService` load từ DB | `CustomOAuth2UserService.buildAuthorities()` |
| **Session** | Stateless (JWT) | Stateless (JWT sau OAuth2) |
| **Provider field** | `AuthProvider.local` | `AuthProvider.google` / `.facebook` / `.github` |

---

## Bảo Mật

| Biện pháp | Mô tả |
|----------|-------|
| **State verification** | Spring Security tự kiểm tra `state` param chống CSRF |
| **Redirect URI whitelist** | `isAuthorizedRedirectUri()` chống Open Redirect Attack |
| **Cookie-based state** | Không dùng session — stateless, phù hợp SPA/mobile |
| **Provider mismatch check** | User đăng ký Google không thể login bằng Facebook |
| **Short-lived cookie** | Cookie state chỉ tồn tại 3 phút |
| **JWT signing** | HMAC-SHA256+ với secret key Base64 (256-bit) |

---

## Phụ Lục: Hướng Dẫn Refactor sang Option B (HttpOnly Cookie cho Refresh Token)

Trong tương lai để gia tăng bảo mật, ngăn chặn XSS tấn công đánh cắp Refresh Token lưu ở `localStorage`, bạn có thể chuyển sang sử dụng thiết lập `HttpOnly Cookie`.

### Bước 1: Thay đổi ở Backend (`OAuth2AuthenticationSuccessHandler`)
Bạn sẽ không đính kèm `refreshToken` vào URL nữa, thay vào đó tạo HTTP Cookie:

```java
// OAuth2AuthenticationSuccessHandler.java

// ... tạo refresh token ...
RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

// Tạo cookie chứa Refresh Token
ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken.getToken())
        .httpOnly(true)
        .secure(true) // Set true khi chạy HTTPS, false cho localhost HTTP
        .path("/auth/refresh") // Cookie chỉ gửi lên server khi gọi endpoint /auth/refresh
        .maxAge(7 * 24 * 3600) // 7 days
        .sameSite("Strict")
        .build();
response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

// URL chỉ trả về Token (hoặc thậm chí bạn có thể giấu token vào Cookie luôn - tương lai C)
return UriComponentsBuilder.fromUriString(targetUrl)
        .queryParam("token", token)
        .build().toUriString();
```

### Bước 2: Thay đổi Controller Refesh Token
Trong `AuthController`, Endpoint lấy access token dựa vào `Cookie` thay vì `RequestBody`.

```java
@PostMapping("/refresh")
public ResponseEntity<?> refreshtoken(HttpServletRequest request) {
    String refreshToken = null;
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            if ("refresh_token".equals(cookie.getName())) {
                refreshToken = cookie.getValue();
            }
        }
    }
    // Xử lý tạo Access Token như cũ nếu refreshToken hợp lệ...
}
```

### Bước 3: Áp dụng ở Frontend
Ở Frontend khi Fetch hoặc gọi Axios /auth/refresh, bạn cần bật cờ `credentials` để trình duyệt chịu khó đính Cookie từ domain backend lên:

```javascript
axios.defaults.withCredentials = true; // Cho toàn bộ instance

// Hoặc cho 1 request cụ thể:
axios.post('http://localhost:8080/auth/refresh', {}, { withCredentials: true })
```
