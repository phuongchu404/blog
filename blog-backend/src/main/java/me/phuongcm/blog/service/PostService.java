package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.entity.Post;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;

public interface PostService {
    List<PostDTO> getAllPosts();

    List<PostDTO> getPublishedPosts();

    Page<PostDTO> getPublishedPosts(int page, int size, String sort);

    Optional<PostDTO> getPostById(Long id);

    Optional<PostDTO> getPostBySlug(String slug);

    List<PostDTO> getPostsByAuthor(Long authorId);

    List<PostDTO> getPublishedPostsByAuthor(Long authorId);

    List<PostDTO> getPostsByCategorySlug(String categorySlug);

    List<PostDTO> getPostsByTagSlug(String tagSlug);

    PostDTO createPost(PostDTO postDTO);

    PostDTO updatePost(Long id, PostDTO postDTO);

    void deletePost(Long id);

    List<PostDTO> searchPosts(String keyword);

    PostDTO publishPost(Long id);

    PostDTO unpublishPost(Long id);
}

