package me.phuongcm.blog.service.impl;

import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.dto.PermissionDTO;
import me.phuongcm.blog.dto.PermissionMapper;
import me.phuongcm.blog.entity.Permission;
import me.phuongcm.blog.repository.PermissionRepository;
import me.phuongcm.blog.service.PermissionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    @Override
    public List<PermissionDTO> getAllPermissions() {
        return permissionMapper.toDTOs(permissionRepository.findAll());
    }

    @Override
    @Transactional
    public PermissionDTO createPermission(PermissionDTO dto) {
        if (permissionRepository.existsByName(dto.getName())) {
            throw new ServiceException(Error.PERMISSION_ALREADY_EXIST);
        }
        Permission p = new Permission();
        p.setName(dto.getName());
        p.setTag(dto.getTag());
        p.setType(dto.getType());
        p.setMethod(dto.getMethod());
        p.setPattern(dto.getPattern());
        p.setIsWhiteList(dto.getIsWhiteList());
        return permissionMapper.toDTO(permissionRepository.save(p));
    }

    @Override
    @Transactional
    public PermissionDTO updatePermission(Long id, PermissionDTO dto) {
        Permission p = permissionRepository.findById(id)
                .orElseThrow(() -> new ServiceException(Error.PERMISSION_NOT_FOUND));
        
        // Cập nhật trường dữ liệu
        if (dto.getName() != null && !dto.getName().equals(p.getName())) {
            if (permissionRepository.existsByName(dto.getName())) {
                throw new ServiceException(Error.PERMISSION_ALREADY_EXIST);
            }
            p.setName(dto.getName());
        }
        
        p.setTag(dto.getTag());
        p.setType(dto.getType());
        p.setMethod(dto.getMethod());
        p.setPattern(dto.getPattern());
        p.setIsWhiteList(dto.getIsWhiteList());
        
        return permissionMapper.toDTO(permissionRepository.save(p));
    }

    @Override
    @Transactional
    public void deletePermission(Long id) {
        Permission p = permissionRepository.findById(id)
                .orElseThrow(() -> new ServiceException(Error.PERMISSION_NOT_FOUND));
        permissionRepository.delete(p);
    }
}
