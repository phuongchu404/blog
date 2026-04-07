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
            return minioClient.getPresignedObjectUrl(getPresignedObjectUrlArgs.build());
        } catch (ErrorResponseException | InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException | XmlParserException |
                 ServerException e) {
            log.info("Lỗi get image path");
            log.error(e.getMessage(), e);
        }
        return null;
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
}
