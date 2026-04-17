package me.phuongcm.blog.service;

import me.phuongcm.blog.entity.PostMeta;

import java.util.Optional;

public interface PostMetaService {

    Optional<PostMeta> getMetaByPost(Long postId);

    PostMeta createOrUpdateMeta(Long postId, String metaTitle, String metaDescription, String metaKeywords);

    void deleteMeta(Long postId);
}