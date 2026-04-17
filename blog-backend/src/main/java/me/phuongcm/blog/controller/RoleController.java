package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.AssignPermissionsRequestDTO;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.dto.RoleDTO;
import me.phuongcm.blog.dto.RoleResponseDTO;
import me.phuongcm.blog.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping("/init")
    @PreAuthorize("hasAuthority('role:create')")
    public ResponseEntity<ApiResponse<Void>> initRoles() {
        roleService.initRole();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Roles initialized", null));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('role:read')")
    public ResponseEntity<ApiResponse<List<RoleResponseDTO>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.ok(roleService.getAllRoles()));
    }

    @Auditable(action = "CREATE", resource = "ROLE")
    @PostMapping
    @PreAuthorize("hasAuthority('role:create')")
    public ResponseEntity<ApiResponse<RoleResponseDTO>> createRole(@Valid @RequestBody RoleDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Role created", roleService.createRole(dto)));
    }

    @Auditable(action = "UPDATE", resource = "ROLE")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('role:update')")
    public ResponseEntity<ApiResponse<RoleResponseDTO>> updateRole(@PathVariable Long id, @Valid @RequestBody RoleDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok("Role updated", roleService.updateRole(id, dto)));
    }

    @Auditable(action = "DELETE", resource = "ROLE")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('role:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.ok("Role deleted", null));
    }

    @PostMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('role:assign')")
    public ResponseEntity<ApiResponse<Void>> assignPermissions(@PathVariable Long id, @RequestBody AssignPermissionsRequestDTO request) {
        roleService.assignPermissionsToRole(id, request != null ? request.getPermissionIds() : null);
        return ResponseEntity.ok(ApiResponse.ok("Permissions assigned successfully", null));
    }
}
