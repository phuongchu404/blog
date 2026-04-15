package me.phuongcm.blog.service;

public interface NewsletterService {

    /** Đăng ký nhận bài viết — lưu DB và gửi email xác nhận */
    void subscribe(String email);

    /** Xác nhận đăng ký qua token trong email */
    void confirm(String token);

    /** Hủy đăng ký qua token trong email */
    void unsubscribe(String token);

    /**
     * Gửi thông báo bài viết mới đến tất cả subscriber đã xác nhận.
     * Chạy bất đồng bộ (@Async) để không block luồng chính.
     */
    void sendNewPostNotification(String postTitle, String postSlug, String postSummary);
}
