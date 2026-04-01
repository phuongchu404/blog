package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.CategoryDTO;
import me.phuongcm.blog.entity.Category;
import me.phuongcm.blog.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /** GET /api/categories — PUBLIC: tất cả danh mục. */
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    /** GET /api/categories/root — PUBLIC: danh mục gốc. */
    @GetMapping("/root")
    public ResponseEntity<List<Category>> getRootCategories() {
        return ResponseEntity.ok(categoryService.getRootCategories());
    }

    /** GET /api/categories/{id} — PUBLIC. */
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return categoryService.getCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/categories/slug/{slug} — PUBLIC. */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<Category> getCategoryBySlug(@PathVariable String slug) {
        return categoryService.getCategoryBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/categories/{id}/subcategories — PUBLIC. */
    @GetMapping("/{id}/subcategories")
    public ResponseEntity<List<Category>> getSubcategories(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getSubcategories(id));
    }

    /**
     * POST /api/categories — Tạo danh mục mới.
     * Yêu cầu permission "category:create" (chỉ ROLE_ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('category:create')")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        Category created = categoryService.createCategory(
                categoryDTO.getTitle(), categoryDTO.getContent(), categoryDTO.getParentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/categories/{id} — Cập nhật danh mục.
     * Yêu cầu permission "category:update".
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category:update')")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryDTO categoryDTO) {
        Category updated = categoryService.updateCategory(
                id, categoryDTO.getTitle(), categoryDTO.getContent(), categoryDTO.getParentId());
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/categories/{id} — Xóa danh mục.
     * Yêu cầu permission "category:delete".
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category:delete')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
