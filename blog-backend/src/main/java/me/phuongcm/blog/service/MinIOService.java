package me.phuongcm.blog.service;

import io.minio.ComposeSource;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.temporal.TemporalUnit;
import java.util.List;
import java.util.concurrent.TimeUnit;

public interface MinIOService {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    class UploadOption {

        private boolean isPublic;

        private long retentionCount;

        private TemporalUnit retentionUnit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    class DownloadOption {

        private boolean isPublic;

        private int expirationDuration = 0;

        private TimeUnit expirationUnit = TimeUnit.HOURS;
    }

    @SneakyThrows
    List<ComposeSource> buildComposeSources(List<String> fileNames, String dir, UploadOption option);

    void composeFiles(List<ComposeSource> composeSources, String fileName, String dir, UploadOption option);

    String uploadFile(InputStream content, String name, String dir, UploadOption option, boolean rename);

    String getFileUrl(String fileName, String directory, DownloadOption option);

    /** Trả về public URL đơn giản (không presigned) cho file trong public bucket.
     *  filePath là đường dẫn tương đối, ví dụ: blog/posts/image.jpg */
    String getPublicFileUrl(String filePath);

    boolean removeFile(String fileName, String directory, DownloadOption option);
}
