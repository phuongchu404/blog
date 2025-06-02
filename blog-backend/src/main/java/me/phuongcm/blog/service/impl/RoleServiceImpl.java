package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.common.utils.ERole;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.repository.RoleRepository;
import me.phuongcm.blog.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

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
}
