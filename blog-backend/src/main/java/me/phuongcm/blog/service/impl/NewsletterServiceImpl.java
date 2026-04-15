package me.phuongcm.blog.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import me.phuongcm.blog.entity.NewsletterSubscriber;
import me.phuongcm.blog.repository.NewsletterSubscriberRepository;
import me.phuongcm.blog.service.NewsletterService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NewsletterServiceImpl implements NewsletterService {

    private final NewsletterSubscriberRepository repository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:8055}")
    private String baseUrl;

    @Value("${app.public-url:http://127.0.0.1:5500}")
    private String publicUrl;

    public NewsletterServiceImpl(NewsletterSubscriberRepository repository, JavaMailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }

    /* ── Subscribe ─────────────────────────────────────────── */

    @Override
    @Transactional
    public void subscribe(String email) {
        Optional<NewsletterSubscriber> existing = repository.findByEmail(email);

        NewsletterSubscriber subscriber;
        if (existing.isPresent()) {
            subscriber = existing.get();
            if (Boolean.TRUE.equals(subscriber.getActive())) {
                throw new RuntimeException("Email này đã đăng ký và được xác nhận.");
            }
            // Chưa xác nhận → tạo lại token và gửi lại email
            subscriber.setConfirmToken(UUID.randomUUID().toString());
            subscriber.setSubscribedAt(LocalDateTime.now());
        } else {
            subscriber = new NewsletterSubscriber();
            subscriber.setEmail(email);
            subscriber.setActive(false);
            subscriber.setConfirmToken(UUID.randomUUID().toString());
            subscriber.setSubscribedAt(LocalDateTime.now());
        }

        repository.save(subscriber);

        // Gửi email xác nhận (đồng bộ, lỗi mail không rollback DB)
        try {
            sendConfirmationEmail(subscriber.getEmail(), subscriber.getConfirmToken());
        } catch (Exception e) {
            // Log nhưng không throw — subscriber đã được lưu thành công
            System.err.println("[Newsletter] Lỗi gửi email xác nhận tới " + email + ": " + e.getMessage());
        }
    }

    /* ── Confirm ───────────────────────────────────────────── */

    @Override
    @Transactional
    public void confirm(String token) {
        NewsletterSubscriber subscriber = repository.findByConfirmToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc đã được sử dụng."));

        subscriber.setActive(true);
        subscriber.setConfirmedAt(LocalDateTime.now());
        // Tái tạo token để dùng làm unsubscribe token (bảo mật hơn)
        subscriber.setConfirmToken(UUID.randomUUID().toString());
        repository.save(subscriber);
    }

    /* ── Unsubscribe ───────────────────────────────────────── */

    @Override
    @Transactional
    public void unsubscribe(String token) {
        NewsletterSubscriber subscriber = repository.findByConfirmToken(token)
                .orElseThrow(() -> new RuntimeException("Link hủy đăng ký không hợp lệ."));

        subscriber.setActive(false);
        repository.save(subscriber);
    }

    /* ── Send new post notification (async) ────────────────── */

    @Override
    @Async
    public void sendNewPostNotification(String postTitle, String postSlug, String postSummary) {
        List<NewsletterSubscriber> subscribers = repository.findAllByActiveTrue();
        for (NewsletterSubscriber sub : subscribers) {
            try {
                String postUrl = publicUrl + "/post.html?slug=" + postSlug;
                String unsubUrl = baseUrl + "/api/newsletter/unsubscribe?token=" + sub.getConfirmToken();
                String html = buildNewPostEmailHtml(postTitle, postUrl, postSummary, unsubUrl);
                sendHtmlEmail(sub.getEmail(), "[MyBlog] Bài viết mới: " + postTitle, html);
            } catch (Exception e) {
                System.err.println("[Newsletter] Lỗi gửi thông báo tới " + sub.getEmail() + ": " + e.getMessage());
            }
        }
    }

    /* ── Internal helpers ──────────────────────────────────── */

    private void sendConfirmationEmail(String email, String token) throws MessagingException {
        String confirmUrl = baseUrl + "/api/newsletter/confirm?token=" + token;
        String html = buildConfirmationEmailHtml(email, confirmUrl);
        sendHtmlEmail(email, "[MyBlog] Xác nhận đăng ký nhận bài viết", html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    /* ── Email HTML templates ──────────────────────────────── */

    private String buildConfirmationEmailHtml(String email, String confirmUrl) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
                  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;
                              box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden">
                    <div style="background:#3b82f6;padding:28px 32px">
                      <h1 style="color:#fff;margin:0;font-size:1.5rem">
                        My<span style="color:#bfdbfe">Blog</span>
                      </h1>
                    </div>
                    <div style="padding:32px">
                      <h2 style="font-size:1.1rem;color:#1e293b;margin-top:0">
                        Xác nhận đăng ký nhận bài viết
                      </h2>
                      <p style="color:#475569;line-height:1.6">
                        Cảm ơn bạn đã đăng ký nhận bài viết từ <strong>MyBlog</strong>! 🎉
                      </p>
                      <p style="color:#475569;line-height:1.6">
                        Nhấn vào nút bên dưới để xác nhận email
                        <strong>%s</strong> và bắt đầu nhận thông báo bài viết mới.
                      </p>
                      <div style="text-align:center;margin:32px 0">
                        <a href="%s"
                           style="background:#3b82f6;color:#fff;text-decoration:none;
                                  padding:14px 32px;border-radius:8px;font-weight:600;
                                  font-size:.95rem;display:inline-block">
                          ✅ Xác nhận đăng ký
                        </a>
                      </div>
                      <p style="color:#94a3b8;font-size:.8rem;line-height:1.5">
                        Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
                      </p>
                    </div>
                    <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
                      <p style="color:#94a3b8;font-size:.75rem;margin:0">
                        © 2024 MyBlog · Blog về AI, Backend &amp; DevOps
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(email, confirmUrl);
    }

    private String buildNewPostEmailHtml(String postTitle, String postUrl,
                                         String summary, String unsubUrl) {
        String summaryBlock = (summary != null && !summary.isBlank())
                ? "<p style=\"color:#475569;line-height:1.6;margin:0 0 20px\">%s</p>".formatted(summary)
                : "";
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:0">
                  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;
                              box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden">
                    <div style="background:#3b82f6;padding:28px 32px">
                      <h1 style="color:#fff;margin:0;font-size:1.5rem">
                        My<span style="color:#bfdbfe">Blog</span>
                      </h1>
                    </div>
                    <div style="padding:32px">
                      <p style="color:#64748b;font-size:.875rem;margin:0 0 8px">
                        📢 Bài viết mới vừa được xuất bản
                      </p>
                      <h2 style="font-size:1.2rem;color:#1e293b;margin:0 0 16px">%s</h2>
                      %s
                      <div style="text-align:center;margin:28px 0">
                        <a href="%s"
                           style="background:#3b82f6;color:#fff;text-decoration:none;
                                  padding:14px 32px;border-radius:8px;font-weight:600;
                                  font-size:.95rem;display:inline-block">
                          Đọc bài viết →
                        </a>
                      </div>
                    </div>
                    <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
                      <p style="color:#94a3b8;font-size:.75rem;margin:0">
                        © 2024 MyBlog ·
                        <a href="%s" style="color:#94a3b8">Hủy đăng ký</a>
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(postTitle, summaryBlock, postUrl, unsubUrl);
    }
}
