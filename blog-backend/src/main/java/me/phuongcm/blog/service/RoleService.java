package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.RoleDTO;
import me.phuongcm.blog.entity.Role;
import java.util.List;

public interface RoleService {
    void initRole();
    
    List<Role> getAllRoles();
    
    Role createRole(RoleDTO dto);
    
    Role updateRole(Long id, RoleDTO dto);
    
    void deleteRole(Long id);
    
    void assignPermissionsToRole(Long roleId, List<Long> permissionIds);
}
