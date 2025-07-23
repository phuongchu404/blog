package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostTag;
import me.phuongcm.blog.entity.Tag;
import me.phuongcm.blog.repository.PostTagRepository;
import me.phuongcm.blog.repository.TagRepository;
import me.phuongcm.blog.service.TagService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    private final PostTagRepository postTagRepository;

    public TagServiceImpl(TagRepository tagRepository, PostTagRepository postTagRepository) {
        this.tagRepository = tagRepository;
        this.postTagRepository = postTagRepository;
    }

    @Override
    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    @Override
    public Optional<Tag> getTagById(long id) {
        return tagRepository.findById(id);
    }

    @Override
    public Optional<Tag> getTagBySlug(String slug) {
        return tagRepository.findBySlug(slug);
    }

    @Override
    public Tag createTag(String title, String content) {
        Tag tag = new Tag();
        tag.setTitle(title);
        tag.setContent(content);
        tag.setSlug(generateSlug(tag.getTitle()));
        tag.setMetaTitle(title);
        return tagRepository.save(tag);
    }

    @Override
    public Tag updateTag(long id, String title, String content) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tag.setTitle(title);
        tag.setContent(content);
        tag.setSlug(generateSlug(tag.getTitle()));
        tag.setMetaTitle(title);
        return tagRepository.save(tag);
    }

    @Override
    public void deleteTag(long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tagRepository.delete(tag);
    }

    @Override
    public void addTagsToPost(Post post, List<String> tagNames) {
        for(String tagName : tagNames){
            Tag tag = tagRepository.findBySlug(generateSlug(tagName)).orElse(createTag(tagName, ""));
            PostTag postTag = new PostTag();
            postTag.setPost(post);
            postTag.setTag(tag);
            postTagRepository.save(postTag);
        }
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
