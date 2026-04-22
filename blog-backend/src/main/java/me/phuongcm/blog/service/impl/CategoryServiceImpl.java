package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.CategoryDTO;
import me.phuongcm.blog.dto.CategoryMapper;
import me.phuongcm.blog.entity.Category;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostCategory;
import me.phuongcm.blog.entity.id.PostCategoryId;
import me.phuongcm.blog.repository.CategoryRepository;
import me.phuongcm.blog.repository.PostCategoryRepository;
import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.service.CategoryService;
import me.phuongcm.blog.service.MinIOService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    private final PostCategoryRepository postCategoryRepository;

    private final CategoryMapper categoryMapper;

    private final MinIOService minIOService;

    public CategoryServiceImpl(CategoryRepository categoryRepository, PostCategoryRepository postCategoryRepository, CategoryMapper categoryMapper, MinIOService minIOService) {
        this.categoryRepository = categoryRepository;
        this.postCategoryRepository = postCategoryRepository;
        this.categoryMapper = categoryMapper;
        this.minIOService = minIOService;
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return resolveUrls(categoryMapper.toDTOs(categoryRepository.findAll()));
    }

    @Override
    public List<CategoryDTO> searchCategories(String keyword) {
        return resolveUrls(categoryMapper.toDTOs(categoryRepository.findByTitleContainingIgnoreCase(keyword)));
    }

    @Override
    public List<CategoryDTO> getRootCategories() {
        return resolveUrls(categoryMapper.toDTOs(categoryRepository.findRootCategories()));
    }

    @Override
    public Optional<CategoryDTO> getCategoryById(Long id) {
        return categoryRepository.findById(id).map(categoryMapper::toDTO).map(this::resolveUrl);
    }

    @Override
    public Optional<CategoryDTO> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug).map(categoryMapper::toDTO).map(this::resolveUrl);
    }

    @Override
    public List<CategoryDTO> getSubcategories(Long parentId) {
        return resolveUrls(categoryMapper.toDTOs(categoryRepository.findByParentId(parentId)));
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setTitle(categoryDTO.getTitle());
        category.setContent(categoryDTO.getContent());
        category.setMetaTitle(categoryDTO.getTitle());
        category.setSlug(categoryDTO.getSlug() != null ? categoryDTO.getSlug() : generateSlug(categoryDTO.getTitle()));
        category.setImageUrl(categoryDTO.getImageUrl());

        if (categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + categoryDTO.getParentId()));
            category.setParent(parent);
        }
        return resolveUrl(categoryMapper.toDTO(categoryRepository.save(category)));
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        category.setTitle(categoryDTO.getTitle());
        category.setContent(categoryDTO.getContent());
        category.setMetaTitle(categoryDTO.getTitle());
        category.setSlug(categoryDTO.getSlug() != null ? categoryDTO.getSlug() : generateSlug(categoryDTO.getTitle()));
        category.setImageUrl(categoryDTO.getImageUrl());

        if (categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + categoryDTO.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        return resolveUrl(categoryMapper.toDTO(categoryRepository.save(category)));
    }

    @Override
    @Transactional
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
    @Transactional
    public void addCategoriesToPost(Post post, List<Long> categoryIds) {
        if (categoryIds == null) return;
        Set<Long> uniqueCategoryIds = new LinkedHashSet<>(categoryIds);
        for (Long categoryId : uniqueCategoryIds) {
            if (postCategoryRepository.existsByPostIdAndCategoryId(post.getId(), categoryId)) {
                continue;
            }
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

            PostCategory postCategory = new PostCategory();
            postCategory.setId(new PostCategoryId(post.getId(), categoryId));
            postCategory.setPost(post);
            postCategory.setCategory(category);

            postCategoryRepository.save(postCategory);
        }
    }

    @Override
    @Transactional
    public void clearCategoriesFromPost(Post post) {
        postCategoryRepository.deleteByPostId(post.getId());
    }

    /** Nếu imageUrl là path tương đối thì tạo full URL từ MinIO config */
    private CategoryDTO resolveUrl(CategoryDTO dto) {
        if (dto != null && dto.getImageUrl() != null && !dto.getImageUrl().startsWith("http")) {
            dto.setImageUrl(minIOService.getPublicFileUrl(dto.getImageUrl()));
        }
        return dto;
    }

    private List<CategoryDTO> resolveUrls(List<CategoryDTO> dtos) {
        dtos.forEach(this::resolveUrl);
        return dtos;
    }

    private String generateSlug(String title) {
        return SlugUtils.toSlug(title);
    }
}
