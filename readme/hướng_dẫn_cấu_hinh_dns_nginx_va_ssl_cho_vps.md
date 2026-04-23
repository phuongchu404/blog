# 🚀 Hướng dẫn đầy đủ: Cấu hình DNS, Nginx và SSL (Let’s Encrypt)

Tài liệu này hướng dẫn từ A → Z cách:
- Trỏ domain về VPS
- Cấu hình Nginx cho nhiều website
- Reverse proxy backend
- Cài SSL (HTTPS)

---

# 1. Tổng quan kiến trúc

Bạn sẽ có:

- phuongcm.com → frontend user
- admin.phuongcm.com → frontend admin
- api.phuongcm.com → backend API

Tất cả chạy chung:
- Port 80 (HTTP)
- Port 443 (HTTPS)

Nginx sẽ phân biệt bằng `server_name`

---

# 2. Cấu hình DNS

Tại trang quản lý domain, thêm:

```
@      A      103.149.86.208
www    A      103.149.86.208
admin  A      103.149.86.208
api    A      103.149.86.208
```

---

# 3. Cài đặt Nginx

```
sudo apt update
sudo apt install nginx -y
```

Khởi động:

```
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

# 4. Cấu hình Nginx

## 4.1 Frontend chính

File:
```
/etc/nginx/sites-available/phuongcm.com
```

```
server {
    listen 80;
    server_name phuongcm.com www.phuongcm.com;

    root /var/www/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4.2 Admin

```
server {
    listen 80;
    server_name admin.phuongcm.com;

    root /var/www/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4.3 Backend API

```
server {
    listen 80;
    server_name api.phuongcm.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

# 5. Enable config

```
sudo ln -s /etc/nginx/sites-available/phuongcm.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.phuongcm.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.phuongcm.com /etc/nginx/sites-enabled/
```

Kiểm tra:

```
sudo nginx -t
sudo systemctl reload nginx
```

---

# 6. Mở firewall

```
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload
```

---

# 7. Kiểm tra hoạt động

Trên máy local:

```
curl http://phuongcm.com
```

Nếu không ra HTML → lỗi firewall/nginx

---

# 8. Cài SSL (Let’s Encrypt)

## 8.1 Cài certbot

```
sudo apt install certbot python3-certbot-nginx -y
```

---

## 8.2 Cấp SSL

```
sudo certbot --nginx \
-d phuongcm.com \
-d www.phuongcm.com \
-d admin.phuongcm.com \
-d api.phuongcm.com
```

Chọn:
- Agree Terms → Y
- Redirect HTTP → HTTPS → YES

---

# 9. Kiểm tra SSL

```
sudo certbot certificates
```

Test:

```
https://phuongcm.com
```

---

# 10. Auto renew

```
sudo certbot renew --dry-run
```

---

# 11. Lỗi thường gặp

## ❌ Timeout khi cấp SSL

Nguyên nhân:
- Port 80 bị chặn

Fix:
```
sudo ufw allow 80
```

---

## ❌ DNS sai

Check:
```
ping phuongcm.com
```

---

## ❌ Nginx chưa chạy

```
sudo systemctl status nginx
```

---

# 12. Kiến trúc chuẩn production

- Public: 80 / 443
- Backend: chạy port nội bộ (8080, 3000...)
- Nginx reverse proxy

---

# 13. Checklist hoàn chỉnh

- [ ] DNS trỏ đúng IP
- [ ] Nginx chạy
- [ ] Port 80 mở
- [ ] Website truy cập HTTP OK
- [ ] Certbot chạy thành công
- [ ] HTTPS hoạt động

---

# 🎯 Kết luận

- 1 server có thể chạy nhiều website
- Không cần port khác nhau
- Dùng subdomain + nginx là chuẩn nhất

---

Nếu cần mở rộng thêm (Docker, CI/CD, deploy tự động), có thể nâng cấp kiến trúc sau.

