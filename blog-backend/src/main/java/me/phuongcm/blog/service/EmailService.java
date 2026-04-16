package me.phuongcm.blog.service;

public interface EmailService {
    void sendTextEmail(String to, String subject, String text);
}
