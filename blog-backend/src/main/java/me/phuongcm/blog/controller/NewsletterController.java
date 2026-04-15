package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.dto.NewsletterSubscribeRequest;
import me.phuongcm.blog.service.NewsletterService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    private final NewsletterService newsletterService;

    @Value("${app.public-url:http://127.0.0.1:5500}")
    private String publicUrl;

    public NewsletterController(NewsletterService newsletterService) {
        this.newsletterService = newsletterService;
    }

    /**
     * POST /api/newsletter/subscribe
     * Public — không cần đăng nhập.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Void>> subscribe(
            @Valid @RequestBody NewsletterSubscribeRequest request) {
        newsletterService.subscribe(request.getEmail());
        return ResponseEntity.ok(
                ApiResponse.ok("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.", null));
    }

    /**
     * GET /api/newsletter/confirm?token=xxx
     * Public — user nhấn link trong email xác nhận.
     * Trả về HTML trực tiếp.
     */
    @GetMapping(value = "/confirm", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> confirm(@RequestParam String token) {
        try {
            newsletterService.confirm(token);
            return ResponseEntity.ok(buildHtmlPage(
                    "✅ Xác nhận thành công!",
                    "Bạn đã xác nhận đăng ký nhận bài viết từ <strong>MyBlog</strong>.",
                    "Từ bây giờ bạn sẽ nhận được thông báo khi có bài viết mới.",
                    true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(buildHtmlPage(
                    "❌ Xác nhận thất bại",
                    e.getMessage(),
                    "Link xác nhận có thể đã hết hạn hoặc không hợp lệ.",
                    false));
        }
    }

    /**
     * GET /api/newsletter/unsubscribe?token=xxx
     * Public — user nhấn link hủy đăng ký trong email.
     * Trả về HTML trực tiếp.
     */
    @GetMapping(value = "/unsubscribe", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> unsubscribe(@RequestParam String token) {
        try {
            newsletterService.unsubscribe(token);
            return ResponseEntity.ok(buildHtmlPage(
                    "👋 Đã hủy đăng ký",
                    "Bạn đã hủy đăng ký nhận bài viết từ <strong>MyBlog</strong>.",
                    "Bạn sẽ không nhận thêm email từ chúng tôi.",
                    false));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(buildHtmlPage(
                    "❌ Hủy đăng ký thất bại",
                    e.getMessage(),
                    "Link hủy đăng ký không hợp lệ.",
                    false));
        }
    }

    /**
     * POST /api/newsletter/notify
     * Dành cho Admin — gửi thông báo bài viết mới đến tất cả subscriber đã xác nhận.
     * Body: { "postTitle": "...", "postSlug": "...", "postSummary": "..." }
     */
    @PostMapping("/notify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> notifySubscribers(
            @RequestBody Map<String, String> body) {
        String postTitle   = body.get("postTitle");
        String postSlug    = body.get("postSlug");
        String postSummary = body.getOrDefault("postSummary", "");

        if (postTitle == null || postTitle.isBlank() || postSlug == null || postSlug.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("postTitle và postSlug không được để trống."));
        }

        newsletterService.sendNewPostNotification(postTitle, postSlug, postSummary);
        return ResponseEntity.ok(
                ApiResponse.ok("Đã kích hoạt gửi thông báo đến subscribers.", null));
    }

    /* ── HTML helper ─────────────────────────────────────────── */

    private String buildHtmlPage(String heading, String message, String subtext, boolean isSuccess) {
        String color = isSuccess ? "#3b82f6" : "#ef4444";
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <title>%s — MyBlog</title>
                  <style>
                    body { font-family: Inter, Arial, sans-serif; background: #f8fafc;
                           display: flex; align-items: center; justify-content: center;
                           min-height: 100vh; margin: 0; }
                    .card { background: #fff; border-radius: 16px; padding: 48px 40px;
                            box-shadow: 0 4px 24px rgba(0,0,0,.08); max-width: 480px;
                            width: 90%%; text-align: center; }
                    h2 { color: %s; font-size: 1.4rem; margin: 0 0 16px }
                    p  { color: #475569; line-height: 1.6; margin: 0 0 8px }
                    .sub { color: #94a3b8; font-size: .875rem }
                    .btn { display: inline-block; margin-top: 28px; background: #3b82f6;
                           color: #fff; text-decoration: none; padding: 12px 28px;
                           border-radius: 8px; font-weight: 600; font-size: .95rem }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h2>%s</h2>
                    <p>%s</p>
                    <p class="sub">%s</p>
                    <a href="%s" class="btn">Về trang chủ →</a>
                  </div>
                </body>
                </html>
                """.formatted(heading, color, heading, message, subtext, publicUrl + "/index.html");
    }
}
