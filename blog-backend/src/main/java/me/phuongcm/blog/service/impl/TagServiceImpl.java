package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.TagDTO;
import me.phuongcm.blog.dto.TagMapper;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostTag;
import me.phuongcm.blog.entity.Tag;
import me.phuongcm.blog.repository.PostTagRepository;
import me.phuongcm.blog.repository.TagRepository;
import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.service.TagService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    private final PostTagRepository postTagRepository;

    private final TagMapper tagMapper;

    public TagServiceImpl(TagRepository tagRepository, PostTagRepository postTagRepository, TagMapper tagMapper) {
        this.tagRepository = tagRepository;
        this.postTagRepository = postTagRepository;
        this.tagMapper = tagMapper;
    }

    @Override
    public List<TagDTO> getAllTags() {
        return tagMapper.toDTOs(tagRepository.findAll());
    }

    @Override
    public Optional<TagDTO> getTagById(long id) {
        return tagRepository.findById(id).map(tagMapper::toDTO);
    }

    @Override
    public Optional<TagDTO> getTagBySlug(String slug) {
        return tagRepository.findBySlug(slug).map(tagMapper::toDTO);
    }

    @Override
    public TagDTO createTag(TagDTO tagDTO) {
        Tag tag = new Tag();
        tag.setTitle(tagDTO.getTitle());
        tag.setContent(tagDTO.getContent());
        tag.setSlug(tagDTO.getSlug() != null && !tagDTO.getSlug().isBlank() ? tagDTO.getSlug() : generateSlug(tag.getTitle()));
        tag.setMetaTitle(tagDTO.getTitle());
        return tagMapper.toDTO(tagRepository.save(tag));
    }

    @Override
    public TagDTO updateTag(long id, TagDTO tagDTO) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tag.setTitle(tagDTO.getTitle());
        tag.setContent(tagDTO.getContent());
        tag.setSlug(tagDTO.getSlug() != null && !tagDTO.getSlug().isBlank() ? tagDTO.getSlug() : generateSlug(tag.getTitle()));
        tag.setMetaTitle(tagDTO.getTitle());
        return tagMapper.toDTO(tagRepository.save(tag));
    }

    @Override
    public void deleteTag(long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tagRepository.delete(tag);
    }

    @Override
    public void addTagsToPost(Post post, List<Long> tagIds) {
        if (tagIds == null) return;
        for(Long tagId : tagIds){
            Tag tag = tagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found with id: " + tagId));
            PostTag postTag = new PostTag();
            postTag.setPost(post);
            postTag.setTag(tag);
            postTagRepository.save(postTag);
        }
    }

    @Override
    public void clearTagsFromPost(Post post) {
        postTagRepository.deleteByPostId(post.getId());
    }

    private String generateSlug(String title) {
        return SlugUtils.toSlug(title);
    }
}
