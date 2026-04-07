package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Tag;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TagMapper {

    TagDTO toDTO(Tag tag);

    List<TagDTO> toDTOs(List<Tag> tags);
}
