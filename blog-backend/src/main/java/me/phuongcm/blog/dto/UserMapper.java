package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "provider", expression = "java(user.getProvider() != null ? user.getProvider().name() : null)")
    UserDTO toDTO(User user);

    List<UserDTO> toDTOs(List<User> users);
}
