# Nginx Sample For MinIO Public Domain

Mẫu cấu hình này dùng để public MinIO qua domain HTTPS `media.phuongcm.com`.

Mục tiêu:

- Backend vẫn có thể gọi MinIO bằng endpoint nội bộ
- Frontend nhận URL ảnh và presigned URL qua domain public HTTPS
- Tránh lỗi mixed content khi site chính chạy HTTPS

## DNS

Tạo bản ghi DNS:

```text
media.phuongcm.com -> IP server chạy Nginx
```

## Nginx

Nếu MinIO đang lắng nghe ở `127.0.0.1:9000` trên cùng server, có thể dùng:

```nginx
server {
    server_name media.phuongcm.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/phuongcm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/phuongcm.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name media.phuongcm.com;
    return 301 https://$host$request_uri;
}
```

Nếu MinIO chạy bằng Docker trên cùng network với Nginx container hoặc có hostname riêng, thay `proxy_pass` bằng endpoint phù hợp, ví dụ:

```nginx
proxy_pass http://minio:9000;
```

## Backend config

Trong `application-prod.yml`:

```yaml
minio:
  endpoint: http://localhost:9000
  public-url: https://media.phuongcm.com
```

Ý nghĩa:

- `endpoint`: backend dùng để kết nối MinIO nội bộ
- `public-url`: backend dùng để trả ảnh/public URL/presigned URL cho frontend

## Lưu ý

- Nếu backend chạy trong container riêng, `endpoint: http://localhost:9000` chỉ đúng khi MinIO cũng nằm cùng network namespace. Nếu không, hãy đổi sang hostname nội bộ thực tế như `http://minio:9000`
- Với cấu hình backend hiện tại, `public-url` sẽ được dùng để sinh URL ảnh public và rewrite presigned URL ra domain public
