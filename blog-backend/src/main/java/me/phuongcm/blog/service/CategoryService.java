package me.phuongcm.blog.service;

import me.phuongcm.blog.entity.Category;
import me.phuongcm.blog.entity.Post;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<Category> getAllCategories();

    List<Category> getRootCategories();

    Optional<Category> getCategoryById(Long id);

    Optional<Category> getCategoryBySlug(String slug);

    List<Category> getSubcategories(Long parentId);

    Category createCategory(String title, String content, Long parentId);

    Category updateCategory(Long id, String title, String content, Long parentId);

    void deleteCategory(Long id);

    void addCategoriesToPost(Post post, List<String> categoryNames);
}
