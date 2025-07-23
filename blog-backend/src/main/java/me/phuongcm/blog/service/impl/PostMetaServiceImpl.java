package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostMeta;
import me.phuongcm.blog.repository.PostMetaRepository;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.service.PostMetaService;
import org.springframework.stereotype.Service;

import java.util.List;
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
    public List<PostMeta> getMetaByPost(Long postId) {
        return postMetaRepository.findByPostId(postId);
    }

    @Override
    public Optional<PostMeta> getMetaByPostAndKey(Long postId, String key) {
        return postMetaRepository.findByPostIdAndKey(postId, key);
    }

    @Override
    public PostMeta CreateOrUpdateMeta(Long postId, String key, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        Optional<PostMeta> existingMeta = postMetaRepository.findByPostIdAndKey(postId, key);

        PostMeta postMeta;
        if (existingMeta.isPresent()) {
            postMeta = existingMeta.get();
            postMeta.setContent(content);
        } else {
            postMeta = new PostMeta();
            postMeta.setPost(post);
            postMeta.setKey(key);
            postMeta.setContent(content);
        }
        return postMetaRepository.save(postMeta);
    }

    @Override
    public void deleteMeta(Long postId, String key) {
        PostMeta postMeta = postMetaRepository.findByPostIdAndKey(postId, key)
                .orElseThrow(() -> new RuntimeException("PostMeta not found for postId: " + postId + " and key: " + key));
        postMetaRepository.delete(postMeta);
    }

    @Override
    public void deleteAllMetaForPost(Long postId) {
        List<PostMeta> metaList = postMetaRepository.findByPostId(postId);
        postMetaRepository.deleteAll(metaList);
    }
}
