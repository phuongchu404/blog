package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.TagDTO;
import me.phuongcm.blog.dto.TagMapper;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostTag;
import me.phuongcm.blog.entity.Tag;
import me.phuongcm.blog.repository.PostTagRepository;
import me.phuongcm.blog.repository.TagRepository;
import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.service.MinIOService;
import me.phuongcm.blog.service.TagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    private final PostTagRepository postTagRepository;

    private final TagMapper tagMapper;

    private final MinIOService minIOService;

    public TagServiceImpl(TagRepository tagRepository, PostTagRepository postTagRepository, TagMapper tagMapper, MinIOService minIOService) {
        this.tagRepository = tagRepository;
        this.postTagRepository = postTagRepository;
        this.tagMapper = tagMapper;
        this.minIOService = minIOService;
    }

    @Override
    public List<TagDTO> getAllTags() {
        return resolveUrls(tagMapper.toDTOs(tagRepository.findAll()));
    }

    @Override
    public List<TagDTO> searchTags(String keyword) {
        return resolveUrls(tagMapper.toDTOs(tagRepository.findByTitleContaining(keyword)));
    }

    @Override
    public Optional<TagDTO> getTagById(long id) {
        return tagRepository.findById(id).map(tagMapper::toDTO).map(this::resolveUrl);
    }

    @Override
    public Optional<TagDTO> getTagBySlug(String slug) {
        return tagRepository.findBySlug(slug).map(tagMapper::toDTO).map(this::resolveUrl);
    }

    @Override
    @Transactional
    public TagDTO createTag(TagDTO tagDTO) {
        Tag tag = new Tag();
        tag.setTitle(tagDTO.getTitle());
        tag.setContent(tagDTO.getContent());
        tag.setSlug(tagDTO.getSlug() != null && !tagDTO.getSlug().isBlank() ? tagDTO.getSlug() : generateSlug(tag.getTitle()));
        tag.setMetaTitle(tagDTO.getTitle());
        tag.setImageUrl(tagDTO.getImageUrl());
        return resolveUrl(tagMapper.toDTO(tagRepository.save(tag)));
    }

    @Override
    @Transactional
    public TagDTO updateTag(long id, TagDTO tagDTO) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tag.setTitle(tagDTO.getTitle());
        tag.setContent(tagDTO.getContent());
        tag.setSlug(tagDTO.getSlug() != null && !tagDTO.getSlug().isBlank() ? tagDTO.getSlug() : generateSlug(tag.getTitle()));
        tag.setMetaTitle(tagDTO.getTitle());
        tag.setImageUrl(tagDTO.getImageUrl());
        return resolveUrl(tagMapper.toDTO(tagRepository.save(tag)));
    }

    @Override
    @Transactional
    public void deleteTag(long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tagRepository.delete(tag);
    }

    @Override
    @Transactional
    public void addTagsToPost(Post post, List<Long> tagIds) {
        if (tagIds == null) return;
        for (Long tagId : tagIds) {
            Tag tag = tagRepository.findById(tagId)
                    .orElseThrow(() -> new RuntimeException("Tag not found with id: " + tagId));
            PostTag postTag = new PostTag();
            postTag.setPost(post);
            postTag.setTag(tag);
            postTagRepository.save(postTag);
        }
    }

    @Override
    @Transactional
    public void clearTagsFromPost(Post post) {
        postTagRepository.deleteByPostId(post.getId());
    }

    /** Nếu imageUrl là path tương đối (không phải http) thì tạo full URL từ MinIO config */
    private TagDTO resolveUrl(TagDTO dto) {
        if (dto != null && dto.getImageUrl() != null && !dto.getImageUrl().startsWith("http")) {
            dto.setImageUrl(minIOService.getPublicFileUrl(dto.getImageUrl()));
        }
        return dto;
    }

    private List<TagDTO> resolveUrls(List<TagDTO> dtos) {
        dtos.forEach(this::resolveUrl);
        return dtos;
    }

    private String generateSlug(String title) {
        return SlugUtils.toSlug(title);
    }
}
