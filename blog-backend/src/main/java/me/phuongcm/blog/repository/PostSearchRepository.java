package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, String> {
    
    List<PostDocument> findByTitleOrContentAndPublishedTrue(String title, String content);
    
    void deleteByPostId(Long postId);
}
