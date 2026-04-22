package me.phuongcm.blog.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

@Configuration
@Slf4j
public class MinIOConfig {
    @Value("${minio.access.name:phuongchu404}")
    private String accessKey;

    @Value("${minio.access.secret:Phuong1590@}")
    private String accessSecret;

    @Value("${minio.endpoint:${minio.url:http://localhost:9000}}")
    private String minioEndpoint;

    @Value("${minio.bucket-private:private-bucket}")
    private String bucketPrivate;

    @Value("${minio.bucket-public:public-bucket}")
    private String bucketPublic;

    @Value("${minio.bucket-public-policy:public-policy.json}")
    private String bucketPublicPolicy;

    @Bean
    public MinioClient minioClient() {
        MinioClient minioClient = MinioClient.builder()
                .endpoint(minioEndpoint)
                .credentials(accessKey, accessSecret)
                .build();

        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketPrivate).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketPrivate).build());
            } else {
                log.info("Bucket {} already exists.", bucketPrivate);
            }

            found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketPublic).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketPublic).build());
                
                // Đọc policy từ file JSON và thay thế placeholder
                String policy = StreamUtils.copyToString(
                        new ClassPathResource(bucketPublicPolicy).getInputStream(), 
                        StandardCharsets.UTF_8
                );
                policy = policy.replace("${bucketName}", bucketPublic);
                
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(bucketPublic)
                        .config(policy)
                        .build());
            } else {
                log.info("Bucket {} already exists.", bucketPublic);
            }
        } catch (Exception e) {
            log.error("Error initializing MinIO client: ", e);
        }

        return minioClient;
    }
}
