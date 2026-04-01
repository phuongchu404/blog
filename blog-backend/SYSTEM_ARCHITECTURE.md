# Kiến Trúc Hệ Thống Nâng Cao (Redis, Kafka, Elasticsearch)

Tài liệu này mô tả chi tiết cách hệ thống Blog Backend hoạt động với kiến trúc hướng sự kiện (Event-Driven) và bộ đệm tốc độ cao (High-Performance Caching).

---

## 1. Hạ tầng (Docker Compose)
Toàn bộ các dịch vụ phụ trợ được cấu hình trong `docker-compose.yml`. Môi trường bao gồm:
- **Redis (Port: 6379):** Hệ thống In-Memory Cache và quản lý bộ đếm (View Counter).
- **Zookeeper & Kafka (Port: 2181, 9092):** Message Broker xử lý thông báo bất đồng bộ.
- **Elasticsearch (Port: 9200):** Search Engine mạnh mẽ hỗ trợ Full-Text Search.

Lệnh khởi chạy: `docker-compose up -d`

---

## 2. Hệ thống Cache & Bộ Đếm (Redis - Phase 1)

### 2.1. Caching API Công Khai (Public API)
Để giảm tải cho cơ sở dữ liệu MySQL (vốn chậm hơn khi đọc trên đĩa), hệ thống tự động lưu trữ kết quả của các bài viết được xuất bản vào RAM (thông qua Redis).
- **Cấu hình Cache:** `RedisConfig.java` (Sử dụng chuẩn Json cho Value, và String cho Key, TTL 1 giờ).
- **Cơ chế hoạt động:**
  - Lần truy cập đầu tiên vào `/api/posts/slug/{slug}`, hệ thống query MySQL và lưu vào Redis.
  - Từ lần 2 trở đi, dữ liệu bốc thẳng từ Redis (`@Cacheable`), đáp ứng trong vài mili-giây.
  - Khi quản trị viên Tạo, Cập nhật, Xuá Bản hoặc Xóa một bài viết, Redis lập tức xóa cache cũ (`@CacheEvict`) để đảm bảo tính nhất quán (Data Consistency).

### 2.2. Tracking Lượt Xem Bất Đồng Bộ (Asynchronous View Counter)
Thao tác đếm lượt xem (`UPDATE posts SET view_count = view_count + 1`) nếu đánh thẳng vào MySQL tại mỗi lượt truy cập sẽ gây ra rủi ro khóa bảng (Table Lock) khi có nhiều truy cập cùng lúc.
- **Giải pháp:** 
  - Tại API lấy chi tiết bài viết, dùng lệnh `redisTemplate.opsForValue().increment("post:view:{id}")`. Bản thân Redis là Single-threaded nên đếm rất chính xác và siêu lệch.
  - Một Worker chạy ngầm có tên là `ViewCountSyncScheduler.java` cứ mỗi **5 phút** sẽ thức dậy một lần. Nhiệm vụ của nó là đọc toàn bộ số lượt xem mới trong Redis để cộng dồn xuống MySQL, rồi sau đó xóa data trong Redis đi.

---

## 3. Kiến Trúc Hướng Sự Kiện (Kafka - Phase 2)

Hệ thống tích hợp Kafka để bóc tách các tác vụ tốn thời gian ra khỏi luồng xử lý chính của người dùng (API Response Flow).

### 3.1. Tính Năng Gửi Thông Báo (Notification)
- **Tình huống:** Khi User A bình luận (Comment) vào bài viết của User B. Hệ thống cần gửi một email báo cho User B.
- **Vấn đề cũ:** Gửi email là tác vụ I/O, thường tốn 1 đến 3 giây. Nếu bắt User A đợi thì trải nghiệm cực kì tệ.
- **Kiến trúc Kafka:**
  1. User A gọi API thêm Comment (`POST /api/comments`).
  2. `CommentServiceImpl` lưu nội dung Comment vào cơ sở dữ liệu cực nhanh.
  3. `KafkaProducerService` bắn một thông điệp (`CommentEvent`) vào Topic tên là `blog.events.comment`.
  4. API ngay lập tức phản hồi cho User A mã thành công `200 OK`. (Tổng thời gian < 100ms).
  5. Chạy ngầm phía sau, `NotificationService` (Là một Kafka Consumer) nhận được Event này và nhàn nhã thực hiện thao tác gửi Email cho tác giả.

---

## 4. Công Cụ Tìm Kiếm Chuyên Sâu (Elasticsearch - Phase 3)

Elasticsearch giải quyết triệt để sự yếu kém và rủi ro chậm chạp của truy vấn `LIKE %keyword%` từ MySQL khi dữ liệu Blogs phình to.

### 4.1. Cơ Chế Đồng Bộ Data Tự Động (CDC - Change Data Capture)
Sự kết hợp giữa Spring Data, Kafka và Elasticsearch:
1. Khi có tạo mới, sửa chữa, hoặc xóa bài viết trên trang Admin (thông qua `PostServiceImpl`).
2. Server tạo ra một thông điệp `PostEvent` (kèm cờ CREATED, UPDATED, DELETED) và đẩy vào Kafka Topic tên là `blog.events.post`.
3. Phía dưới Background, Consumer Listener có tên `ElasticsearchSyncService` đọc Event này, sau đó map nội dung và chỉ dẫn sang cho kho của Elasticsearch bằng `PostSearchRepository`.
4. Cơ sở dữ liệu của Elasticsearch sẽ tự động Index toàn văn (Full-Text Indexing) theo thời gian thực (Real-time).

### 4.2. API Tìm Kiếm Tuyệt Đối
Truy cập `/api/posts/search?keyword=...` 
- Hệ thống đẩy truy vấn về Elasticsearch để phân tích cụm từ (Standard Analyzer) và sắp xếp mức độ tương quan (Relevance Score) siêu việt so với MySQL. 
- Sau khi có danh sách ID ưu việt nhất từ Elastic, mới gọi MySQL thông qua `findAllById()` để trả về thực thể `Post` hoàn chỉnh.
- **Fail-safe mechanism:** Trong trường hợp máy chủ Elasticsearch gặp sự cố hoặc quá trình Sync đôi khi xui rủi bị delay, Service sẽ tự fallback (dự phòng) bằng cách gọi thẳng query cũ của MySQL để người dùng web không bao giờ gặp lỗi trắng trang.
