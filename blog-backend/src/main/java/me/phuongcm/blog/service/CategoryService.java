package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.CategoryDTO;
import me.phuongcm.blog.entity.Post;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<CategoryDTO> getAllCategories();

    List<CategoryDTO> getRootCategories();

    Optional<CategoryDTO> getCategoryById(Long id);

    Optional<CategoryDTO> getCategoryBySlug(String slug);

    List<CategoryDTO> getSubcategories(Long parentId);

    CategoryDTO createCategory(CategoryDTO categoryDTO);

    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);

    void deleteCategory(Long id);

    void addCategoriesToPost(Post post, List<Long> categoryIds);

    void clearCategoriesFromPost(Post post);
}
