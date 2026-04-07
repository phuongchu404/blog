package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    @Mapping(target = "permissions", ignore = true)
    @Mapping(target = "permissionCount", ignore = true)
    @Mapping(target = "userCount", ignore = true)
    RoleResponseDTO toResponseDTO(Role role);
}
