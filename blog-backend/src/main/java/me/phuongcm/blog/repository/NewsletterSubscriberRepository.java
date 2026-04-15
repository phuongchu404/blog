package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {

    Optional<NewsletterSubscriber> findByEmail(String email);

    Optional<NewsletterSubscriber> findByConfirmToken(String confirmToken);

    List<NewsletterSubscriber> findAllByActiveTrue();
}
