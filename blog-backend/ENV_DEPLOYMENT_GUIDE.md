# Huong dan cau hinh production bang file .env

Tai lieu nay mo ta cach dung file `.env` cho `blog-backend` khi deploy bang Docker Compose.

Muc tieu:

- Khong hardcode password, secret, URL quan trong truc tiep trong `docker-compose.yml`.
- Dung chung mot bo gia tri cho MySQL container va Spring Boot backend.
- Tach ro bien nao danh cho MySQL, bien nao danh cho Spring Boot.
- De doi cau hinh production chi bang cach sua file `.env`.

## 1. Nguyen ly hoat dong

Docker Compose tu dong doc file `.env` nam cung thu muc voi file compose duoc chay.

Vi du neu chay lenh trong thu muc:

```bash
cd /opt/blog/blog-backend
docker compose up -d
```

thi Docker Compose se tim file:

```text
/opt/blog/blog-backend/.env
```

Sau do cac bien trong `.env` co the duoc dung trong compose bang cu phap:

```yaml
MYSQL_DATABASE: ${MYSQL_DATABASE}
```

Luu y quan trong: file `.env` chi duoc Docker Compose dung de thay gia tri vao file compose. No khong tu dong dua tat ca bien vao moi container. Container nao can bien nao thi phai khai bao bien do trong `environment:` cua service do.

## 2. Phan biet MYSQL_* va SPRING_*

Trong he thong nay co 2 nhom bien lien quan database.

Nhom `MYSQL_*` danh cho container MySQL:

```text
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
MYSQL_ROOT_PASSWORD
```

Nhom nay duoc image `mysql:8.4` dung khi container khoi tao lan dau de tao database, user va password.

Nhom `SPRING_DATASOURCE_*` danh cho backend Spring Boot:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

Nhom nay duoc Spring Boot dung de map vao:

```yaml
spring:
  datasource:
    url: ...
    username: ...
    password: ...
```

Hai nhom nay nen lay cung gia tri tu `.env`, nhung van phai khai bao rieng cho tung service.

## 3. Tao file .env

Tao file `.env` trong thu muc deploy:

```bash
cd /opt/blog/blog-backend
nano .env
```

Noi dung mau:

```env
# MySQL
MYSQL_DATABASE=blog
MYSQL_USER=phuongchu
MYSQL_PASSWORD=change-this-db-password
MYSQL_ROOT_PASSWORD=change-this-root-password

# Spring profile
SPRING_PROFILES_ACTIVE=prod

# Spring datasource
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/blog?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Bangkok
SPRING_DATASOURCE_USERNAME=phuongchu
SPRING_DATASOURCE_PASSWORD=change-this-db-password

# Redis, Kafka, Elasticsearch
SPRING_DATA_REDIS_HOST=redis
SPRING_DATA_REDIS_PORT=6379
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200

# JWT
# Tao secret bang lenh: openssl rand -base64 32
APPLICATION_SECURITY_JWT_SECRET=change-this-base64-jwt-secret

# Mail
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-gmail-app-password

# App URL
APP_BASE_URL=https://api.phuongcm.com
APP_PUBLIC_URL=https://phuongcm.com

# MinIO
MINIO_ROOT_USER=change-this-minio-root-user
MINIO_ROOT_PASSWORD=change-this-minio-root-password
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_URL=https://media.phuongcm.com
MINIO_ACCESS_NAME=change-this-minio-root-user
MINIO_ACCESS_SECRET=change-this-minio-root-password
MINIO_BUCKET_PRIVATE=private-bucket
MINIO_BUCKET_PUBLIC=public-bucket
MINIO_BUCKET_PUBLIC_POLICY=public-policy.json
```

Luu y:

- `MYSQL_PASSWORD` va `SPRING_DATASOURCE_PASSWORD` nen giong nhau neu backend dang ket noi bang user `MYSQL_USER`.
- `MINIO_ROOT_USER` va `MINIO_ACCESS_NAME` nen giong nhau neu backend dung root credential cua MinIO.
- `MINIO_ROOT_PASSWORD` va `MINIO_ACCESS_SECRET` nen giong nhau trong truong hop tren.
- Khong commit file `.env` len Git.

## 4. Sua docker-compose.yml cho ha tang

File `docker-compose.yml` chay cac service ha tang nhu MySQL, Redis, Kafka, Elasticsearch, MinIO.

Neu MySQL da cai truc tiep tren VPS, khong can khai bao service `mysql` trong `docker-compose.yml`. Khi do bo qua phan MySQL ben duoi va xem muc 4.1.

### 4.1. Truong hop MySQL cai truc tiep tren VPS

Neu MySQL dang chay tren chinh VPS, `docker-compose.yml` chi can giu cac service con lai nhu Redis, Kafka, Elasticsearch, MinIO. Khong can service `mysql` va khong can volume `mysql_data`.

Backend container can truy cap MySQL tren host VPS bang hostname `host.docker.internal`. Trong `docker-compose.backend.yml`, them:

```yaml
services:
  blog-backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Va cau hinh datasource:

```yaml
SPRING_DATASOURCE_URL: jdbc:mysql://host.docker.internal:3306/blog?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Bangkok
```

Neu dung `.env`, gia tri nen la:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/blog?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Bangkok
```

Luu y: MySQL tren VPS phai cho phep ket noi tu Docker bridge. Neu MySQL chi bind `127.0.0.1`, container co the khong ket noi duoc. Khi do can cau hinh MySQL bind vao dia chi phu hop, tao user co host hop le, va mo firewall noi bo neu can.

### 4.2. Truong hop MySQL chay bang Docker Compose

Chi dung phan nay neu muon chay MySQL bang Docker.

Phan MySQL nen doi thanh:

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: blog_mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    command:
      - --default-authentication-plugin=mysql_native_password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - blog-network
```

Phan MinIO nen doi thanh:

```yaml
services:
  minio:
    image: minio/minio
    container_name: blog_minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped
    networks:
      - blog-network
```

Redis, Kafka va Elasticsearch co the giu nguyen neu khong co secret rieng.

## 5. Sua docker-compose.backend.yml cho backend

File `docker-compose.backend.yml` chay Spring Boot backend.

Phan `environment:` nen cau hinh nhu sau:

```yaml
services:
  blog-backend:
    environment:
      JAVA_OPTS: "-Xms256m -Xmx512m"
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}

      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
      SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}

      SPRING_DATA_REDIS_HOST: ${SPRING_DATA_REDIS_HOST}
      SPRING_DATA_REDIS_PORT: ${SPRING_DATA_REDIS_PORT}
      SPRING_KAFKA_BOOTSTRAP_SERVERS: ${SPRING_KAFKA_BOOTSTRAP_SERVERS}
      SPRING_ELASTICSEARCH_URIS: ${SPRING_ELASTICSEARCH_URIS}

      APPLICATION_SECURITY_JWT_SECRET: ${APPLICATION_SECURITY_JWT_SECRET}

      SPRING_MAIL_HOST: ${SPRING_MAIL_HOST}
      SPRING_MAIL_PORT: ${SPRING_MAIL_PORT}
      SPRING_MAIL_USERNAME: ${SPRING_MAIL_USERNAME}
      SPRING_MAIL_PASSWORD: ${SPRING_MAIL_PASSWORD}

      APP_BASE_URL: ${APP_BASE_URL}
      APP_PUBLIC_URL: ${APP_PUBLIC_URL}

      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_PUBLIC_URL: ${MINIO_PUBLIC_URL}
      MINIO_ACCESS_NAME: ${MINIO_ACCESS_NAME}
      MINIO_ACCESS_SECRET: ${MINIO_ACCESS_SECRET}
      MINIO_BUCKET_PRIVATE: ${MINIO_BUCKET_PRIVATE}
      MINIO_BUCKET_PUBLIC: ${MINIO_BUCKET_PUBLIC}
      MINIO_BUCKET_PUBLIC_POLICY: ${MINIO_BUCKET_PUBLIC_POLICY}
```

Neu muon Docker Compose bao loi som khi thieu bien quan trong, co the dung cu phap:

```yaml
SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD:?SPRING_DATASOURCE_PASSWORD is required}
APPLICATION_SECURITY_JWT_SECRET: ${APPLICATION_SECURITY_JWT_SECRET:?APPLICATION_SECURITY_JWT_SECRET is required}
```

Cu phap nay rat nen dung cho password va secret tren production.

## 6. Cau hinh application-prod.yml

`application-prod.yml` nen doc tu environment variable va co default cho nhung gia tri khong nhay cam.

Vi du:

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: ${SPRING_DATASOURCE_URL:jdbc:mysql://mysql:3306/blog}
    username: ${SPRING_DATASOURCE_USERNAME:phuongchu}
    password: ${SPRING_DATASOURCE_PASSWORD}

  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST:redis}
      port: ${SPRING_DATA_REDIS_PORT:6379}

  kafka:
    bootstrap-servers: ${SPRING_KAFKA_BOOTSTRAP_SERVERS:kafka:29092}

  elasticsearch:
    uris: ${SPRING_ELASTICSEARCH_URIS:http://elasticsearch:9200}
```

JWT secret nen de bat buoc:

```yaml
application:
  security:
    jwt:
      secret: ${APPLICATION_SECURITY_JWT_SECRET}
```

MinIO:

```yaml
minio:
  endpoint: ${MINIO_ENDPOINT:http://minio:9000}
  public-url: ${MINIO_PUBLIC_URL:https://media.phuongcm.com}
  access:
    name: ${MINIO_ACCESS_NAME}
    secret: ${MINIO_ACCESS_SECRET}
  bucket-private: ${MINIO_BUCKET_PRIVATE:private-bucket}
  bucket-public: ${MINIO_BUCKET_PUBLIC:public-bucket}
  bucket-public-policy: ${MINIO_BUCKET_PUBLIC_POLICY:public-policy.json}
```

## 7. Thu tu deploy

Chay ha tang truoc:

```bash
cd /opt/blog/blog-backend
docker compose up -d
```

Kiem tra MySQL, Redis, Kafka, Elasticsearch, MinIO:

```bash
docker ps
docker compose logs -f
```

Sau do chay backend:

```bash
cd /opt/blog/blog-backend
docker compose -f docker-compose.backend.yml up -d --build
```

Kiem tra log backend:

```bash
docker compose -f docker-compose.backend.yml logs -f
```

Kiem tra health endpoint:

```bash
curl http://localhost:8055/actuator/health
```

## 8. Kiem tra bien da duoc noi suy dung chua

Truoc khi chay container, nen kiem tra compose config:

```bash
docker compose config
```

Va backend compose:

```bash
docker compose -f docker-compose.backend.yml config
```

Lenh nay se hien thi file compose sau khi Docker Compose da thay `${...}` bang gia tri tu `.env`.

Neu thay gia tri rong o cac bien quan trong nhu `SPRING_DATASOURCE_PASSWORD`, `APPLICATION_SECURITY_JWT_SECRET`, `MINIO_ACCESS_SECRET`, thi `.env` dang thieu hoac ten bien bi sai.

## 9. Loi thuong gap

### Backend khong ket noi duoc MySQL

Kiem tra cac gia tri sau:

```text
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

Neu MySQL volume da ton tai tu truoc, thay doi `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` trong `.env` se khong tu dong tao lai user/database. Cac bien `MYSQL_*` chi co tac dung khi MySQL khoi tao data directory lan dau.

Trong truong hop do can:

- Tao/sua user truc tiep trong MySQL.
- Hoac xoa volume MySQL neu chap nhan mat data va muon khoi tao lai tu dau.

Khong xoa volume production neu chua backup database.

### Backend khong dung profile prod

Kiem tra:

```env
SPRING_PROFILES_ACTIVE=prod
```

Va trong `docker-compose.backend.yml` phai co:

```yaml
SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE}
```

### Spring Boot khong doc duoc bien

Kiem tra ten bien theo relaxed binding cua Spring Boot.

Vi du:

```text
SPRING_DATASOURCE_URL -> spring.datasource.url
SPRING_DATA_REDIS_HOST -> spring.data.redis.host
SPRING_KAFKA_BOOTSTRAP_SERVERS -> spring.kafka.bootstrap-servers
APPLICATION_SECURITY_JWT_SECRET -> application.security.jwt.secret
MINIO_ACCESS_SECRET -> minio.access.secret
APP_BASE_URL -> app.base-url
```

### Doi password MySQL nhung backend van loi

Neu MySQL da khoi tao volume cu, `MYSQL_PASSWORD` moi trong `.env` khong doi password user hien co. Can vao MySQL doi password:

```bash
docker exec -it blog_mysql mysql -uroot -p
```

Sau do chay SQL tuong ung:

```sql
ALTER USER 'phuongchu'@'%' IDENTIFIED BY 'new-password';
FLUSH PRIVILEGES;
```

Dong thoi cap nhat:

```env
MYSQL_PASSWORD=new-password
SPRING_DATASOURCE_PASSWORD=new-password
```

## 10. Bao mat file .env

File `.env` chua password va secret, nen:

- Khong commit len Git.
- Chi de tren server deploy.
- Phan quyen doc ghi han che.

Tren Linux co the chay:

```bash
chmod 600 /opt/blog/blog-backend/.env
```

Neu repo chua ignore `.env`, them vao `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Nen tao `.env.example` chi chua ten bien va gia tri mau, khong chua secret that.

## 11. Tom tat cau hinh khuyen nghi

`.env` la noi luu gia tri that.

`docker-compose.yml` dung `${MYSQL_*}` va `${MINIO_ROOT_*}` cho cac container ha tang.

`docker-compose.backend.yml` dung `${SPRING_*}`, `${APPLICATION_*}`, `${APP_*}`, `${MINIO_*}` cho backend.

`application-prod.yml` doc tu environment variable bang `${...}` va chi giu default cho gia tri khong nhay cam.

Khi deploy, chay:

```bash
docker compose config
docker compose up -d
docker compose -f docker-compose.backend.yml config
docker compose -f docker-compose.backend.yml up -d --build
```
