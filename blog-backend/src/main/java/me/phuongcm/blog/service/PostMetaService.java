package me.phuongcm.blog.service;

import me.phuongcm.blog.entity.PostMeta;

import java.util.List;
import java.util.Optional;

public interface PostMetaService {

    List<PostMeta> getMetaByPost(Long postId);

    Optional<PostMeta> getMetaByPostAndKey(Long postId, String key);

    PostMeta CreateOrUpdateMeta(Long postId, String key, String content);

    void deleteMeta(Long postId, String key);

    void deleteAllMetaForPost(Long postId);
}
