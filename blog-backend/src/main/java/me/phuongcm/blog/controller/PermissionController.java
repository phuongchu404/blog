package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.dto.PermissionDTO;
import me.phuongcm.blog.service.PermissionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('permission:read')")
    public ResponseEntity<ApiResponse<List<PermissionDTO>>> getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.ok(permissionService.getAllPermissions()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('permission:create')")
    public ResponseEntity<ApiResponse<PermissionDTO>> createPermission(@Valid @RequestBody PermissionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Permission created successfully", permissionService.createPermission(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('permission:update')")
    public ResponseEntity<ApiResponse<PermissionDTO>> updatePermission(@PathVariable Long id, @Valid @RequestBody PermissionDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Permission updated successfully", permissionService.updatePermission(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('permission:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.ok(ApiResponse.ok("Permission deleted successfully", null));
    }
}
