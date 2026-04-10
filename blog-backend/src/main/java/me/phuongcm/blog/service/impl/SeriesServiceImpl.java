package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.dto.SeriesDTO;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.Series;
import me.phuongcm.blog.entity.SeriesPost;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.repository.SeriesPostRepository;
import me.phuongcm.blog.repository.SeriesRepository;
import me.phuongcm.blog.service.SeriesService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SeriesServiceImpl implements SeriesService {

    private final SeriesRepository seriesRepository;
    private final SeriesPostRepository seriesPostRepository;
    private final PostRepository postRepository;

    public SeriesServiceImpl(SeriesRepository seriesRepository,
                             SeriesPostRepository seriesPostRepository,
                             PostRepository postRepository) {
        this.seriesRepository = seriesRepository;
        this.seriesPostRepository = seriesPostRepository;
        this.postRepository = postRepository;
    }

    /* ── Mapping helpers ─────────────────────────────────────── */

    private SeriesDTO toDTO(Series series, boolean includePosts) {
        SeriesDTO dto = new SeriesDTO();
        dto.setId(series.getId());
        dto.setTitle(series.getTitle());
        dto.setSlug(series.getSlug());
        dto.setDescription(series.getDescription());
        dto.setImageUrl(series.getImageUrl());
        dto.setPublished(series.getPublished());
        dto.setCreatedAt(series.getCreatedAt());
        dto.setUpdatedAt(series.getUpdatedAt());

        List<SeriesPost> seriesPosts = seriesPostRepository
                .findBySeriesIdOrderByOrderIndexAsc(series.getId());

        dto.setPostCount(seriesPosts.size());

        if (includePosts) {
            dto.setPosts(seriesPosts.stream()
                    .map(sp -> {
                        Post p = sp.getPost();
                        return new SeriesDTO.PostSummary(
                                p.getId(),
                                p.getTitle(),
                                p.getSlug(),
                                p.getSummary(),
                                p.getImageUrl(),
                                sp.getOrderIndex()
                        );
                    })
                    .toList());
        }
        return dto;
    }

    /* ── Public queries ──────────────────────────────────────── */

    @Override
    public List<SeriesDTO> getAllPublished() {
        return seriesRepository.findByPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .map(s -> toDTO(s, false))
                .toList();
    }

    @Override
    public List<SeriesDTO> getAll() {
        return seriesRepository.findAll()
                .stream()
                .map(s -> toDTO(s, false))
                .toList();
    }

    @Override
    public Optional<SeriesDTO> getBySlug(String slug) {
        return seriesRepository.findBySlug(slug)
                .map(s -> toDTO(s, true));
    }

    @Override
    public Optional<SeriesDTO> getById(Long id) {
        return seriesRepository.findById(id)
                .map(s -> toDTO(s, true));
    }

    /* ── Mutations ───────────────────────────────────────────── */

    @Override
    public SeriesDTO create(SeriesDTO dto) {
        Series series = new Series();
        series.setTitle(dto.getTitle());
        series.setDescription(dto.getDescription());
        series.setImageUrl(dto.getImageUrl());
        series.setPublished(dto.getPublished() != null ? dto.getPublished() : false);

        String slug = dto.getSlug() != null && !dto.getSlug().isBlank()
                ? dto.getSlug()
                : SlugUtils.toSlug(dto.getTitle());
        // Ensure unique slug
        if (seriesRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        series.setSlug(slug);

        return toDTO(seriesRepository.save(series), false);
    }

    @Override
    public SeriesDTO update(Long id, SeriesDTO dto) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Series not found with id: " + id));

        series.setTitle(dto.getTitle());
        series.setDescription(dto.getDescription());
        series.setImageUrl(dto.getImageUrl());
        if (dto.getPublished() != null) series.setPublished(dto.getPublished());

        if (dto.getSlug() != null && !dto.getSlug().isBlank()) {
            series.setSlug(dto.getSlug());
        }

        return toDTO(seriesRepository.save(series), true);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Series not found with id: " + id));
        seriesPostRepository.deleteBySeriesId(id);
        seriesRepository.delete(series);
    }

    @Override
    public SeriesDTO addPost(Long seriesId, Long postId, Integer orderIndex) {
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new RuntimeException("Series not found: " + seriesId));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        if (seriesPostRepository.existsBySeriesIdAndPostId(seriesId, postId)) {
            throw new RuntimeException("Post already exists in this series");
        }

        SeriesPost sp = new SeriesPost();
        sp.setSeries(series);
        sp.setPost(post);
        sp.setOrderIndex(orderIndex != null ? orderIndex
                : seriesPostRepository.countBySeriesId(seriesId));
        seriesPostRepository.save(sp);

        return toDTO(series, true);
    }

    @Override
    @Transactional
    public SeriesDTO removePost(Long seriesId, Long postId) {
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new RuntimeException("Series not found: " + seriesId));

        SeriesPost sp = seriesPostRepository.findBySeriesIdOrderByOrderIndexAsc(seriesId)
                .stream()
                .filter(x -> x.getPost().getId().equals(postId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Post not found in series"));

        seriesPostRepository.delete(sp);
        return toDTO(series, true);
    }
}
