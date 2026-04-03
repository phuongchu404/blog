package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.PermissionDTO;
import me.phuongcm.blog.entity.Permission;

import java.util.List;

public interface PermissionService {
    List<Permission> getAllPermissions();

    Permission createPermission(PermissionDTO dto);

    Permission updatePermission(Long id, PermissionDTO dto);

    void deletePermission(Long id);
}
