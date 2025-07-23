package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);

    List<Category> findByParentId(Long parentId);

    @Query(value = "SELECT c FROM Category c WHERE c.parent IS NULL")
    List<Category> findRootCategories();
}
