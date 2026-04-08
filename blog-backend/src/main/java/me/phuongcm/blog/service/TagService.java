package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.TagDTO;
import me.phuongcm.blog.entity.Post;

import java.util.List;
import java.util.Optional;

public interface TagService {

    List<TagDTO> getAllTags();

    List<TagDTO> searchTags(String keyword);

    Optional<TagDTO> getTagById(long id);

    Optional<TagDTO> getTagBySlug(String slug);

    TagDTO createTag(TagDTO tagDTO);

    TagDTO updateTag(long id, TagDTO tagDTO);

    void deleteTag(long id);

    void addTagsToPost(Post post, List<Long> tagIds);

    void clearTagsFromPost(Post post);
}
