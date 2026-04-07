package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Permission;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PermissionMapper {

    PermissionDTO toDTO(Permission permission);

    List<PermissionDTO> toDTOs(List<Permission> permissions);
}
