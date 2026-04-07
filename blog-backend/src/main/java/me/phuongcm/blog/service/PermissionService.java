package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.PermissionDTO;
import me.phuongcm.blog.entity.Permission;

import java.util.List;

public interface PermissionService {
    List<PermissionDTO> getAllPermissions();

    PermissionDTO createPermission(PermissionDTO dto);

    PermissionDTO updatePermission(Long id, PermissionDTO dto);

    void deletePermission(Long id);
}
