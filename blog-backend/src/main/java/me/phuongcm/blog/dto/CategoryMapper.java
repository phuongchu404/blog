package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parentId", source = "parent.id")
    CategoryDTO toDTO(Category category);

    List<CategoryDTO> toDTOs(List<Category> categories);
}
