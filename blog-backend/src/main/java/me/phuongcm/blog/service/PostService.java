package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.entity.Post;

import java.util.List;
import java.util.Optional;

public interface PostService {
    List<Post> getAllPosts();

    List<Post> getPublishedPosts();

    Optional<Post> getPostById(Long id);

    Optional<Post> getPostBySlug(String slug);

    List<Post> getPostsByAuthor(Long authorId);

    Post createPost(PostDTO postDTO);

    Post updatePost(Long id, PostDTO postDTO);

    void deletePost(Long id);

    List<Post> searchPosts(String keyword);

    Post publishPost(Long id);

    Post unpublishPost(Long id);
}
