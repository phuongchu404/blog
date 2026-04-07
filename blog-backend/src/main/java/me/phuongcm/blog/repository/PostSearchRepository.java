package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, String> {
    
    List<PostDocument> findByTitleOrContentAndStatus(String title, String content, Integer status);
    
    // Default search for published posts
    default List<PostDocument> findPublishedByKeyword(String keyword) {
        return findByTitleOrContentAndStatus(keyword, keyword, 1);
    }
    
    void deleteByPostId(Long postId);
}
