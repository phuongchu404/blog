package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostMeta;
import me.phuongcm.blog.repository.PostMetaRepository;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.service.PostMetaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class PostMetaServiceImpl implements PostMetaService {
    private final PostMetaRepository postMetaRepository;

    private final PostRepository postRepository;

    public PostMetaServiceImpl(PostMetaRepository postMetaRepository, PostRepository postRepository) {
        this.postMetaRepository = postMetaRepository;
        this.postRepository = postRepository;
    }

    @Override
    public Optional<PostMeta> getMetaByPost(Long postId) {
        return postMetaRepository.findByPostId(postId);
    }

    @Override
    @Transactional
    public PostMeta createOrUpdateMeta(Long postId, String metaTitle, String metaDescription, String metaKeywords) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        Optional<PostMeta> existingMeta = postMetaRepository.findByPostId(postId);

        PostMeta postMeta;
        if (existingMeta.isPresent()) {
            postMeta = existingMeta.get();
        } else {
            postMeta = new PostMeta();
            postMeta.setPost(post);
        }
        postMeta.setMetaTitle(metaTitle);
        postMeta.setMetaDescription(metaDescription);
        postMeta.setMetaKeywords(metaKeywords);
        return postMetaRepository.save(postMeta);
    }

    @Override
    @Transactional
    public void deleteMeta(Long postId) {
        PostMeta postMeta = postMetaRepository.findByPostId(postId)
                .orElseThrow(() -> new RuntimeException("PostMeta not found for postId: " + postId));
        postMetaRepository.delete(postMeta);
    }
}