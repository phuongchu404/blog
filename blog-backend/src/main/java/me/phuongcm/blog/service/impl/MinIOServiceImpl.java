package me.phuongcm.blog.service.impl;

import com.github.f4b6a3.ulid.UlidCreator;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.utils.AppConstants;
import me.phuongcm.blog.common.utils.StringUtils;
import me.phuongcm.blog.service.MinIOService;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class MinIOServiceImpl implements MinIOService {
    private static final String UPLOAD_SUCCESS = "upload thành công";

    private static final String UPLOAD_FAIL = "lỗi upload minio";

    private final MinioClient minioClient;

    @Value("${minio.public-url:${minio.url:http://localhost:9000}}")
    private String minioPublicUrl;

    @Value("${minio.bucket-private}")
    private String bucketPrivate;

    @Value("${minio.bucket-public}")
    private String bucketPublic;

    @Override
    @SneakyThrows
    public List<ComposeSource> buildComposeSources(List<String> fileNames, String dir, me.phuongcm.blog.service.MinIOService.UploadOption option){
        List<ComposeSource> composeSources = new ArrayList<>();
        try {
            fileNames.forEach(fileName -> {
                String filePath = StringUtils.isBlank(dir) ? fileName : dir.concat(AppConstants.FORWARD_SLASH).concat(fileName);
                composeSources.add(ComposeSource.builder()
                        .bucket(option.isPublic() ? bucketPublic : bucketPrivate)
                        .object(filePath)
                        .build());
            });
        } catch (Exception e) {
            log.info("build compose sources error");
            log.error(e.getMessage(), e);

        }
        return composeSources;
    }

    @Override
    @SneakyThrows
    public void composeFiles(List<ComposeSource> composeSources, String fileName, String dir, UploadOption option){
        try{
            composeSources.forEach(source -> log.info("Source object: " + source.object()));

            String filePath = StringUtils.isBlank(dir) ? fileName : dir.concat(AppConstants.FORWARD_SLASH).concat(fileName);
            minioClient.composeObject(ComposeObjectArgs.builder()
                    .bucket(option.isPublic() ? bucketPublic : bucketPrivate)
                    .object(filePath)
                    .sources(composeSources)
                    .build());
        } catch (Exception e) {
            log.info("ghép file thất bại");
            log.error(e.getMessage(), e);
        }
    }

    @Override
    public String uploadFile(InputStream content, String name, String dir, UploadOption option, boolean rename) {
        if (rename) name = renameFile(name);
        return uploadFile(content, name, dir, option);
    }

    @Override
    public String getFileUrl(String fileName, String directory, DownloadOption option) {
        try {
            String filePath = StringUtils.isBlank(directory) ? fileName : directory.concat("/").concat(fileName);

            GetPresignedObjectUrlArgs.Builder getPresignedObjectUrlArgs = GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(option.isPublic() ? bucketPublic : bucketPrivate)
                    .object(filePath);
            if (option.getExpirationDuration() > 0) {
                getPresignedObjectUrlArgs.expiry(option.getExpirationDuration(), option.getExpirationUnit());
            }
            String presignedUrl = minioClient.getPresignedObjectUrl(getPresignedObjectUrlArgs.build());
            return rewriteToPublicUrl(presignedUrl);
        } catch (ErrorResponseException | InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException | XmlParserException |
                 ServerException e) {
            log.info("Lỗi get image path");
            log.error(e.getMessage(), e);
        }
        return null;
    }

    @Override
    public String getPublicFileUrl(String filePath) {
        if (filePath == null || filePath.isBlank()) return null;
        return joinUrl(minioPublicUrl, bucketPublic + "/" + trimLeadingSlash(filePath));
    }

    @Override
    public boolean removeFile(String fileName, String directory, DownloadOption option) {
        return false;
    }

    private String uploadFile(InputStream content, String fileName, String dir, UploadOption option) {
        try {
            String filePath = StringUtils.isBlank(dir) ? fileName : dir.concat(AppConstants.FORWARD_SLASH).concat(fileName);
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(option.isPublic() ? bucketPublic : bucketPrivate)
                    .object(filePath)
                    .stream(content, content.available(), 0L)
                    .build());
            log.info(UPLOAD_SUCCESS);
            return fileName;
        } catch (Exception e) {
            log.info(UPLOAD_FAIL);
            log.error(e.getMessage(), e);
            return null;
        }
    }

    private String renameFile(String name) {
        return FilenameUtils.removeExtension(name) + "_" + UlidCreator.getMonotonicUlid(System.currentTimeMillis()) + "." + FilenameUtils.getExtension(name);
    }

    private String rewriteToPublicUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank() || minioPublicUrl == null || minioPublicUrl.isBlank()) {
            return rawUrl;
        }

        try {
            URI original = URI.create(rawUrl);
            URI publicBase = URI.create(minioPublicUrl);
            String rewrittenPath = joinPath(publicBase.getPath(), original.getPath());

            return new URI(
                    publicBase.getScheme(),
                    null,
                    publicBase.getHost(),
                    publicBase.getPort(),
                    rewrittenPath,
                    original.getQuery(),
                    original.getFragment()
            ).toString();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid MinIO public URL '{}', using raw URL instead", minioPublicUrl, e);
            return rawUrl;
        } catch (URISyntaxException e) {
            log.warn("Unable to rewrite presigned MinIO URL to public URL", e);
            return rawUrl;
        }
    }

    private String joinUrl(String base, String path) {
        return base.replaceAll("/+$", "") + "/" + trimLeadingSlash(path);
    }

    private String joinPath(String basePath, String path) {
        String normalizedBase = basePath == null ? "" : basePath.replaceAll("/+$", "");
        String normalizedPath = trimLeadingSlash(path);
        if (normalizedBase.isBlank()) {
            return "/" + normalizedPath;
        }
        return normalizedBase + "/" + normalizedPath;
    }

    private String trimLeadingSlash(String value) {
        return value == null ? "" : value.replaceFirst("^/+", "");
    }
}
