package me.phuongcm.blog.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(indexName = "posts")
public class PostDocument {
    @Id
    private String id;
    
    @Field(type = FieldType.Long)
    private Long postId;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;
    
    @Field(type = FieldType.Keyword)
    private String slug;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String summary;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String content;
    
    @Field(type = FieldType.Keyword)
    private String authorName;
    
    @Field(type = FieldType.Boolean)
    private Boolean published;
}
