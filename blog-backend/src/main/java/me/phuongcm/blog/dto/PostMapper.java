package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostCategory;
import me.phuongcm.blog.entity.PostTag;
import me.phuongcm.blog.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {TagMapper.class, CategoryMapper.class})
public interface PostMapper {

    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", source = "author.username")
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "tags", source = "postTags", qualifiedByName = "mapPostTags")
    @Mapping(target = "categories", source = "postCategories", qualifiedByName = "mapPostCategories")
    @Mapping(target = "categoryName", source = "postCategories", qualifiedByName = "mapCategoryName")
    @Mapping(target = "author", source = "author", qualifiedByName = "mapAuthorInfo")
    @Mapping(target = "viewCount", source = "viewCount")
    @Mapping(target = "tagIds", ignore = true)
    @Mapping(target = "categoryIds", ignore = true)
    @Mapping(target = "metaTitle", ignore = true)
    @Mapping(target = "metaDescription", ignore = true)
    @Mapping(target = "metaKeywords", ignore = true)
    PostDTO toDTO(Post post);

    List<PostDTO> toDTOs(List<Post> posts);

    @Named("mapPostTags")
    default List<TagDTO> mapPostTags(List<PostTag> postTags) {
        if (postTags == null || postTags.isEmpty()) return Collections.emptyList();
        return postTags.stream()
                .map(pt -> {
                    TagDTO dto = new TagDTO();
                    dto.setId(pt.getTag().getId());
                    dto.setTitle(pt.getTag().getTitle());
                    dto.setSlug(pt.getTag().getSlug());
                    dto.setImageUrl(pt.getTag().getImageUrl());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Named("mapPostCategories")
    default List<CategoryDTO> mapPostCategories(List<PostCategory> postCategories) {
        if (postCategories == null || postCategories.isEmpty()) return Collections.emptyList();
        return postCategories.stream()
                .map(pc -> {
                    CategoryDTO dto = new CategoryDTO();
                    dto.setId(pc.getCategory().getId());
                    dto.setTitle(pc.getCategory().getTitle());
                    dto.setSlug(pc.getCategory().getSlug());
                    dto.setImageUrl(pc.getCategory().getImageUrl());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Named("mapCategoryName")
    default String mapCategoryName(List<PostCategory> postCategories) {
        if (postCategories == null || postCategories.isEmpty()) return null;
        return postCategories.get(0).getCategory().getTitle();
    }

    @Named("mapAuthorInfo")
    default PostDTO.AuthorInfo mapAuthorInfo(User user) {
        if (user == null) return null;
        PostDTO.AuthorInfo info = new PostDTO.AuthorInfo();
        info.setId(user.getId());
        info.setUsername(user.getUsername());
        info.setFullName(user.getFullName());
        info.setImageUrl(user.getImageUrl());
        return info;
    }
}
