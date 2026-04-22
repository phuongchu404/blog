# Backend Build And Run Guide

Tài liệu này tổng hợp cách build và chạy `blog-backend` theo 2 hướng:

- Chạy trực tiếp bằng file `.jar`
- Chạy bằng `Docker` hoặc `Docker Compose`

Tài liệu cũng phản ánh cấu hình hiện tại:

- Backend chạy bằng `docker-compose.backend.yml`
- Các service hạ tầng chạy bằng `docker-compose.yml`
- Hai file compose dùng chung Docker network `blog-network`
- Trong môi trường `prod`, backend gọi service bằng tên service Docker như `mysql`, `redis`, `kafka`, `elasticsearch`, `minio`

## 1. Cấu trúc thư mục deploy trên server

Thư mục deploy chuẩn:

```text
/opt/blog/blog-backend
├── app.jar hoặc <ten-file>.jar
├── Dockerfile
├── docker-compose.yml
├── docker-compose.backend.yml
├── config
│   ├── application.yml
│   ├── application-prod.yml
│   ├── application-uat.yml
│   └── public-policy.json
├── logs
└── uploads
```

Ghi chú:

- File `.jar` phải nằm trực tiếp trong `/opt/blog/blog-backend`
- Thư mục `config` chứa các file cấu hình Spring và `public-policy.json`
- Thư mục `logs` dùng để ghi log ra ngoài container
- Thư mục `uploads` dùng để lưu file upload nếu backend cần truy cập local filesystem
- `docker-compose.yml` dùng cho hạ tầng: `mysql`, `redis`, `zookeeper`, `kafka`, `elasticsearch`, `minio`
- `docker-compose.backend.yml` dùng cho service backend

## 2. Build file jar

Build từ source:

```bash
cd /duong-dan/toi/blog-backend
./mvnw clean package -DskipTests
```

Nếu build trên Windows:

```powershell
cd E:\PhuongCM\Tutorial\blog\blog-backend
.\mvnw.cmd clean package -DskipTests
```

Sau khi build xong, file jar thường nằm trong thư mục `target`.

Ví dụ copy lên server:

```bash
cp target/*.jar /opt/blog/blog-backend/
```

Nếu cần đổi tên cho dễ quản lý:

```bash
cp target/*.jar /opt/blog/blog-backend/app.jar
```

## 3. Chạy không dùng Docker

### 3.1. Chuẩn bị thư mục

```bash
mkdir -p /opt/blog/blog-backend/config
mkdir -p /opt/blog/blog-backend/logs
mkdir -p /opt/blog/blog-backend/uploads
```

### 3.2. Chạy trực tiếp bằng java

Chạy app với cấu hình đọc từ thư mục `config`, đưa `config` vào classpath để app đọc được `public-policy.json`, và ghi log vào thư mục `logs`.

Profile active sẽ lấy từ file `.yml` trong thư mục `config`, ví dụ `spring.profiles.active=dev` trong `application.yml`.

```bash
cd /opt/blog/blog-backend
java -Xms256m -Xmx512m \
  -Dloader.path=/opt/blog/blog-backend/config \
  -Dspring.config.additional-location=optional:file:/opt/blog/blog-backend/config/ \
  -Dlogging.file.path=/opt/blog/blog-backend/logs \
  -cp /opt/blog/blog-backend/app.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher
```

Nếu file jar không tên `app.jar`, thay bằng đúng tên file thực tế.

### 3.3. Chạy nền bằng `nohup`

```bash
cd /opt/blog/blog-backend
nohup java -Xms256m -Xmx512m \
  -Dloader.path=/opt/blog/blog-backend/config \
  -Dspring.config.additional-location=optional:file:/opt/blog/blog-backend/config/ \
  -Dlogging.file.path=/opt/blog/blog-backend/logs \
  -cp /opt/blog/blog-backend/app.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher \
  > /opt/blog/blog-backend/logs/console.log 2>&1 &
```

## 4. Chạy bằng Docker

### 4.1. Build image

Đứng trong thư mục deploy trên server:

```bash
cd /opt/blog/blog-backend
docker build -t blog-backend:latest .
```

Điều kiện:

- Trong thư mục hiện tại phải có đúng 1 file `.jar`, hoặc file jar bạn muốn dùng phải là file duy nhất khớp với `*.jar`
- `Dockerfile` hiện tại copy jar từ thư mục gốc build context

### 4.2. Run container

```bash
docker run -d \
  --name blog-backend \
  --restart unless-stopped \
  -p 8055:8055 \
  -e JAVA_OPTS="-Xms256m -Xmx512m" \
  -v /opt/blog/blog-backend/config:/app/config \
  -v /opt/blog/blog-backend/logs:/app/logs \
  -v /opt/blog/blog-backend/uploads:/app/uploads \
  blog-backend:latest
```

Ghi chú:

- Docker không truyền profile active
- App sẽ lấy `spring.profiles.active` từ file `.yml` trong thư mục `config`
- Nếu `application.yml` trong `config` để `spring.profiles.active=dev` thì container sẽ chạy với profile `dev`

Ý nghĩa mount:

- `/opt/blog/blog-backend/config:/app/config`: nạp `application*.yml` và `public-policy.json`
- `/opt/blog/blog-backend/logs:/app/logs`: xuất log ra ngoài host
- `/opt/blog/blog-backend/uploads:/app/uploads`: lưu dữ liệu upload bền vững

## 5. Chạy bằng Docker Compose

Hệ thống được tách thành 2 file compose:

- `docker-compose.yml`: chạy các service hạ tầng
- `docker-compose.backend.yml`: chạy backend

Hai file này dùng chung network Docker tên `blog-network`.

### 5.1. Chạy hạ tầng trước

Chạy:

```bash
cd /opt/blog/blog-backend
docker compose up -d
```

Lệnh này sẽ tạo và chạy các service:

- `mysql`
- `redis`
- `zookeeper`
- `kafka`
- `kafka-ui`
- `elasticsearch`
- `dejavu`
- `minio`

Nó cũng tạo Docker network dùng chung:

- `blog-network`

### 5.2. Chạy backend

Sau khi hạ tầng đã chạy:

```bash
cd /opt/blog/blog-backend
docker compose -f docker-compose.backend.yml up -d --build
```

### 5.3. Dừng backend

```bash
cd /opt/blog/blog-backend
docker compose -f docker-compose.backend.yml down
```

### 5.4. Dừng hạ tầng

```bash
cd /opt/blog/blog-backend
docker compose down
```

### 5.5. Xem log backend

```bash
cd /opt/blog/blog-backend
docker compose -f docker-compose.backend.yml logs -f
```

### 5.6. Xem log hạ tầng

```bash
cd /opt/blog/blog-backend
docker compose logs -f
```

## 6. Nội dung Compose Và Network

`docker-compose.backend.yml` hiện tại mount trực tiếp vào đúng các thư mục sau trên server:

- `/opt/blog/blog-backend/config`
- `/opt/blog/blog-backend/logs`
- `/opt/blog/blog-backend/uploads`

Nó hiện chỉ truyền:

- `JAVA_OPTS=-Xms256m -Xmx512m`

Backend được nối vào external Docker network:

- `blog-network`

`docker-compose.yml` tạo và dùng chính network đó cho toàn bộ service hạ tầng.

Vì vậy trong `application-prod.yml`, backend có thể gọi service bằng hostname nội bộ Docker:

- MySQL: `mysql:3306`
- Redis: `redis:6379`
- Kafka: `kafka:29092`
- Elasticsearch: `http://elasticsearch:9200`
- MinIO: `http://minio:9000`

## 7. Cách cập nhật phiên bản mới

Quy trình cập nhật đề xuất:

1. Build jar mới từ source
2. Copy jar mới lên `/opt/blog/blog-backend`
3. Xóa jar cũ nếu không còn dùng
4. Chạy lại backend compose

Ví dụ:

```bash
cd /opt/blog/blog-backend
docker compose -f docker-compose.backend.yml down
docker compose -f docker-compose.backend.yml up -d --build
```

Nếu có thay đổi ở hạ tầng như MySQL, Kafka, Redis, MinIO hoặc network, chạy lại file compose hạ tầng:

```bash
cd /opt/blog/blog-backend
docker compose down
docker compose up -d
```

## 8. Kiểm tra sau khi chạy

Kiểm tra container:

```bash
docker ps
```

Kiểm tra log:

```bash
docker logs -f blog-backend
```

Hoặc:

```bash
tail -f /opt/blog/blog-backend/logs/*.log
```

Kiểm tra health endpoint:

```bash
curl http://localhost:8055/actuator/health
```

## 9. Lưu ý cấu hình

- Profile active được lấy từ file `.yml` trong thư mục `config`, không bị Docker ghi đè
- `application-prod.yml`, `application-dev.yml`, `application-uat.yml` có thể dùng tùy theo `spring.profiles.active`
- Trong profile `prod`, backend hiện đang dùng hostname service Docker thay vì IP
- Không nên hard-code secret production trong source code
- Nếu dùng `public-policy.json`, file này phải tồn tại trong thư mục `config`
- `docker-compose.backend.yml` yêu cầu network `blog-network` đã tồn tại, nên cần chạy `docker compose up -d` cho file hạ tầng trước
- Nếu đổi tên hoặc vị trí thư mục deploy, cần sửa lại volume trong `docker-compose.backend.yml`

## 10. File liên quan

- [Dockerfile](E:\PhuongCM\Tutorial\blog\blog-backend\Dockerfile)
- [docker-compose.yml](E:\PhuongCM\Tutorial\blog\blog-backend\docker-compose.yml)
- [docker-compose.backend.yml](E:\PhuongCM\Tutorial\blog\blog-backend\docker-compose.backend.yml)
- [.dockerignore](E:\PhuongCM\Tutorial\blog\blog-backend\.dockerignore)
- [NGINX_MEDIA_SAMPLE.md](E:\PhuongCM\Tutorial\blog\blog-backend\NGINX_MEDIA_SAMPLE.md)
