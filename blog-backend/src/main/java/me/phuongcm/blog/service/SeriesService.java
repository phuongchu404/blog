package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.SeriesDTO;

import java.util.List;
import java.util.Optional;

public interface SeriesService {

    /** Lấy tất cả series đã publish (public). */
    List<SeriesDTO> getAllPublished();

    /** Lấy tất cả series (admin). */
    List<SeriesDTO> getAll();

    /** Lấy series theo slug kèm danh sách bài viết (public). */
    Optional<SeriesDTO> getBySlug(String slug);

    /** Lấy series theo ID (admin). */
    Optional<SeriesDTO> getById(Long id);

    /** Tạo series mới. */
    SeriesDTO create(SeriesDTO dto);

    /** Cập nhật series. */
    SeriesDTO update(Long id, SeriesDTO dto);

    /** Xóa series. */
    void delete(Long id);

    /** Thêm bài viết vào series. */
    SeriesDTO addPost(Long seriesId, Long postId, Integer orderIndex);

    /** Xóa bài viết khỏi series. */
    SeriesDTO removePost(Long seriesId, Long postId);
}
