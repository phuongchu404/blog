package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.RoleDTO;
import me.phuongcm.blog.dto.RoleResponseDTO;
import jakarta.validation.Valid;
import java.util.List;

public interface RoleService {
    void initRole();
    
    List<RoleResponseDTO> getAllRoles();
    
    RoleResponseDTO createRole(@Valid RoleDTO dto);
    
    RoleResponseDTO updateRole(Long id, @Valid RoleDTO dto);
    
    void deleteRole(Long id);
    
    void assignPermissionsToRole(Long roleId, List<Long> permissionIds);
}
