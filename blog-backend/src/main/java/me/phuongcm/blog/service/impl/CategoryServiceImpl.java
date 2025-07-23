package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Category;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostCategory;
import me.phuongcm.blog.repository.CategoryRepository;
import me.phuongcm.blog.repository.PostCategoryRepository;
import me.phuongcm.blog.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    private final PostCategoryRepository postCategoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository, PostCategoryRepository postCategoryRepository) {
        this.categoryRepository = categoryRepository;
        this.postCategoryRepository = postCategoryRepository;
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public List<Category> getRootCategories() {

        return categoryRepository.findRootCategories();
    }

    @Override
    public Optional<Category> getCategoryById(Long id) {

        return categoryRepository.findById(id);
    }

    @Override
    public Optional<Category> getCategoryBySlug(String slug) {

        return categoryRepository.findBySlug(slug);
    }

    @Override
    public List<Category> getSubcategories(Long parentId) {
        return categoryRepository.findByParentId(parentId);
    }

    @Override
    public Category createCategory(String title, String content, Long parentId) {
        Category category = new Category();
        category.setTitle(title);
        category.setContent(content);
        category.setMetaTitle(title);
        category.setSlug(generateSlug(title));

        if(parentId != null) {
            Category parent = categoryRepository.findById(parentId).orElseThrow(() -> new RuntimeException("Parent category not found with id: " + parentId));
            category.setParent(parent);
        }
        return categoryRepository.save(category);
    }

    @Override
    public Category updateCategory(Long id, String title, String content, Long parentId) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        category.setTitle(title);
        category.setContent(content);
        category.setMetaTitle(title);
        category.setSlug(generateSlug(title));

        if(parentId != null) {
            Category parent = categoryRepository.findById(parentId).orElseThrow(() -> new RuntimeException("Parent category not found with id: " + parentId));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        return categoryRepository.save(category);
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Check if the category has subcategories
        List<Category> subcategories = categoryRepository.findByParentId(id);
        if (!subcategories.isEmpty()) {
            throw new RuntimeException("Cannot delete category with id: " + id + " because it has subcategories.");
        }

        categoryRepository.delete(category);
    }

    @Override
    public void addCategoriesToPost(Post post, List<String> categoryNames) {
        for (String categoryName : categoryNames) {
            Category category = categoryRepository.findBySlug(generateSlug(categoryName))
                    .orElse(createCategory(categoryName, "", null));

            PostCategory postCategory = new PostCategory();
            postCategory.setPost(post);
            postCategory.setCategory(category);

            postCategoryRepository.save(postCategory);
        }
    }

    private String generateSlug(String title) {
        // Implement slug generation logic here
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
