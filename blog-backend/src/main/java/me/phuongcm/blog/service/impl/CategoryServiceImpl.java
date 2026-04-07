package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.CategoryDTO;
import me.phuongcm.blog.dto.CategoryMapper;
import me.phuongcm.blog.entity.Category;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostCategory;
import me.phuongcm.blog.repository.CategoryRepository;
import me.phuongcm.blog.repository.PostCategoryRepository;
import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    private final PostCategoryRepository postCategoryRepository;

    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, PostCategoryRepository postCategoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.postCategoryRepository = postCategoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryMapper.toDTOs(categoryRepository.findAll());
    }

    @Override
    public List<CategoryDTO> getRootCategories() {

        return categoryMapper.toDTOs(categoryRepository.findRootCategories());
    }

    @Override
    public Optional<CategoryDTO> getCategoryById(Long id) {

        return categoryRepository.findById(id).map(categoryMapper::toDTO);
    }

    @Override
    public Optional<CategoryDTO> getCategoryBySlug(String slug) {

        return categoryRepository.findBySlug(slug).map(categoryMapper::toDTO);
    }

    @Override
    public List<CategoryDTO> getSubcategories(Long parentId) {
        return categoryMapper.toDTOs(categoryRepository.findByParentId(parentId));
    }

    @Override
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setTitle(categoryDTO.getTitle());
        category.setContent(categoryDTO.getContent());
        category.setMetaTitle(categoryDTO.getTitle());
        category.setSlug(categoryDTO.getSlug() != null ? categoryDTO.getSlug() : generateSlug(categoryDTO.getTitle()));

        if(categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId()).orElseThrow(() -> new RuntimeException("Parent category not found with id: " + categoryDTO.getParentId()));
            category.setParent(parent);
        }
        return categoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        category.setTitle(categoryDTO.getTitle());
        category.setContent(categoryDTO.getContent());
        category.setMetaTitle(categoryDTO.getTitle());
        category.setSlug(categoryDTO.getSlug() != null ? categoryDTO.getSlug() : generateSlug(categoryDTO.getTitle()));

        if(categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId()).orElseThrow(() -> new RuntimeException("Parent category not found with id: " + categoryDTO.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        return categoryMapper.toDTO(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Check if the category has subcategories
        List<Category> subcategories = categoryRepository.findByParentId(id);
        if (!subcategories.isEmpty()) {
            throw new RuntimeException("Cannot delete category with subcategories. Please remove subcategories first.");
        }

        categoryRepository.delete(category);
    }

    @Override
    public void addCategoriesToPost(Post post, List<Long> categoryIds) {
        if (categoryIds == null) return;
        for (Long categoryId : categoryIds) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
            
            PostCategory postCategory = new PostCategory();
            postCategory.setPost(post);
            postCategory.setCategory(category);

            postCategoryRepository.save(postCategory);
        }
    }

    @Override
    public void clearCategoriesFromPost(Post post) {
        postCategoryRepository.deleteByPostId(post.getId());
    }

    private String generateSlug(String title) {
        return SlugUtils.toSlug(title);
    }
}
