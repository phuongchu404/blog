package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.dto.PermissionDTO;
import me.phuongcm.blog.entity.Permission;
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
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('permission:create')")
    public ResponseEntity<Permission> createPermission(@Valid @RequestBody PermissionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permissionService.createPermission(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('permission:update')")
    public ResponseEntity<Permission> updatePermission(@PathVariable Long id, @Valid @RequestBody PermissionDTO dto) {
        return ResponseEntity.ok(permissionService.updatePermission(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('permission:delete')")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }
}
