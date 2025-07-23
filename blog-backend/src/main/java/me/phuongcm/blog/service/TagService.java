package me.phuongcm.blog.service;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.Tag;

import java.util.List;
import java.util.Optional;

public interface TagService {

    List<Tag> getAllTags();

    Optional<Tag> getTagById(long id);

    Optional<Tag> getTagBySlug(String slug);

    Tag createTag(String title, String content);

    Tag updateTag(long id, String title, String content);

    void deleteTag(long id);

    void addTagsToPost(Post post, List<String> tagNames);

}
