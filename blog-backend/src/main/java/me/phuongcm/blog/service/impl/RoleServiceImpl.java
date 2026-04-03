package me.phuongcm.blog.service.impl;

import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.ERole;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.dto.RoleDTO;
import me.phuongcm.blog.entity.Permission;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.RolePermission;
import me.phuongcm.blog.repository.PermissionRepository;
import me.phuongcm.blog.repository.RolePermissionRepository;
import me.phuongcm.blog.repository.RoleRepository;
import me.phuongcm.blog.service.RoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void initRole() {
        Arrays.stream(ERole.values()).forEach(role -> {
            if(!roleRepository.existsByName(role.getValue())) {
                Role roleEntity = new Role();
                roleEntity.setName(role.getValue());
                roleRepository.save(roleEntity);
            }
        });
    }

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    @Transactional
    public Role createRole(RoleDTO dto) {
        if (roleRepository.existsByName(dto.getName())) {
            throw new ServiceException(Error.ROLE_ALREADY_EXIST);
        }
        Role r = new Role();
        r.setName(dto.getName());
        r.setDescription(dto.getDescription());
        return roleRepository.save(r);
    }

    @Override
    @Transactional
    public Role updateRole(Long id, RoleDTO dto) {
        Role r = roleRepository.findById(id)
                .orElseThrow(() -> new ServiceException(Error.ROLE_NOT_FOUND));
        
        if (dto.getName() != null && !dto.getName().equals(r.getName())) {
            if (roleRepository.existsByName(dto.getName())) {
                throw new ServiceException(Error.ROLE_ALREADY_EXIST);
            }
            r.setName(dto.getName());
        }
        
        r.setDescription(dto.getDescription());
        return roleRepository.save(r);
    }

    @Override
    @Transactional
    public void deleteRole(Long id) {
        Role r = roleRepository.findById(id)
                .orElseThrow(() -> new ServiceException(Error.ROLE_NOT_FOUND));
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.delete(r);
    }

    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ServiceException(Error.ROLE_NOT_FOUND));

        rolePermissionRepository.deleteByRoleId(roleId);

        if (permissionIds != null && !permissionIds.isEmpty()) {
            List<Permission> permissions = permissionRepository.findAllById(permissionIds);
            List<RolePermission> rps = permissions.stream().map(p -> {
                RolePermission rp = new RolePermission();
                rp.setRole(role);
                rp.setPermission(p);
                return rp;
            }).collect(Collectors.toList());

            rolePermissionRepository.saveAll(rps);
        }
    }
}
