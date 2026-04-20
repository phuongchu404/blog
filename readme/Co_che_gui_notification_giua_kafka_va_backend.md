# Cơ chế gửi notification giữa Kafka và backend

Tài liệu này mô tả đúng theo implementation hiện tại trong `blog-backend`, tập trung vào luồng tạo thông báo khi có comment mới hoặc reply comment.

## 1. Mục tiêu của cơ chế

Hệ thống dùng Kafka để tách việc xử lý notification ra khỏi luồng request chính của API.

Nếu backend vừa lưu comment vừa xử lý toàn bộ notification ngay trong request:

- request tạo comment sẽ chậm hơn
- code business bị dính chặt với xử lý thông báo
- khó mở rộng thêm consumer khác trong tương lai

Với Kafka, backend chia luồng thành 2 bước:

1. API nhận request và lưu comment vào database.
2. Sau khi transaction commit thành công, backend phát một event lên Kafka để một consumer khác xử lý notification.

## 2. Thành phần chính trong hệ thống

### Hạ tầng

- Kafka broker chạy tại `localhost:9092`
- Zookeeper và Kafka được cấu hình trong [docker-compose.yml](E:/PhuongCM/Tutorial/blog/blog-backend/docker-compose.yml)
- Spring Kafka được cấu hình trong [application.yml](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/resources/application.yml)

### Các class tham gia

- Tạo comment: [CommentServiceImpl.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/impl/CommentServiceImpl.java)
- DTO event: [CommentEvent.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/dto/CommentEvent.java)
- Kafka producer: [KafkaProducerService.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/KafkaProducerService.java)
- Kafka consumer xử lý notification: [NotificationService.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/NotificationService.java)
- Entity lưu thông báo: [Notification.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/entity/Notification.java)
- Repository thao tác DB: [NotificationRepository.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/repository/NotificationRepository.java)
- API đọc notification: [NotificationController.java](E:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/controller/NotificationController.java)

## 3. Topic và cấu hình Kafka

Backend đang dùng topic comment:

- `blog.events.comment`

Producer và consumer đều dùng JSON serialization/deserialization:

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: blog-backend-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "*"
```

Ý nghĩa:

- backend publish event dạng object Java và Spring tự chuyển sang JSON
- consumer đọc JSON và map ngược lại thành `CommentEvent`
- `group-id = blog-backend-group` giúp consumer thuộc cùng một nhóm xử lý message

## 4. Dữ liệu event được gửi lên Kafka

Payload event hiện tại là `CommentEvent` với các trường chính:

```java
private Long commentId;
private Long postId;
private String postSlug;
private String postTitle;
private Long postAuthorId;
private Long commenterId;
private String commenterName;
private String content;
private Long parentCommentUserId;
```

Ý nghĩa nghiệp vụ:

- `postAuthorId`: xác định tác giả bài viết để tạo thông báo khi có comment mới
- `commenterId`, `commenterName`: xác định người vừa comment
- `parentCommentUserId`: dùng cho trường hợp reply comment
- `postSlug`, `postTitle`, `commentId`: giúp notification có đủ thông tin để điều hướng hoặc hiển thị ngoài UI

## 5. Luồng xử lý end-to-end

### Bước 1: User gửi comment lên backend

Khi người dùng gọi API tạo comment, backend vào `CommentServiceImpl.createComment(...)`.

Backend thực hiện:

- kiểm tra setting có cho phép comment hay không
- tìm `Post` và `User`
- tạo `PostComment`
- nếu là reply thì lấy `parentComment`
- lưu comment vào MySQL

### Bước 2: Chỉ phát event sau khi transaction commit thành công

Điểm quan trọng nhất của implementation là event Kafka không được bắn trước khi DB commit.

Code hiện tại dùng `TransactionSynchronizationManager.registerSynchronization(...)` và publish trong `afterCommit()`.

```java
TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
    @Override
    public void afterCommit() {
        kafkaProducerService.sendCommentNotificationEvent(event);
    }
});
```

Ý nghĩa:

- nếu lưu comment thất bại hoặc transaction rollback, Kafka event sẽ không được gửi
- tránh tình trạng consumer nhận event nhưng trong DB lại không tồn tại comment thật
- đảm bảo tính nhất quán giữa dữ liệu nghiệp vụ và message bất đồng bộ

### Bước 3: Producer gửi event lên topic Kafka

`KafkaProducerService.sendCommentNotificationEvent(...)` gửi event vào topic `blog.events.comment`.

Producer đang dùng key:

```java
String key = String.valueOf(event.getPostAuthorId());
kafkaTemplate.send(COMMENT_TOPIC, key, event);
```

Ý nghĩa của message key:

- các event cùng `postAuthorId` có xu hướng đi cùng partition
- giúp giữ thứ tự tương đối tốt hơn cho các thông báo liên quan cùng một tác giả bài viết

### Bước 4: Consumer nhận event và tạo notification

`NotificationService` lắng nghe Kafka bằng:

```java
@KafkaListener(topics = "blog.events.comment", groupId = "blog-backend-group")
public void handleCommentEvent(CommentEvent event) { ... }
```

Khi nhận event, consumer xử lý 2 trường hợp:

1. Thông báo cho tác giả bài viết nếu người comment không phải chính tác giả.
2. Thông báo cho chủ comment cha nếu đây là reply và người reply không phải chính họ.

Logic này giúp tránh tạo notification thừa khi user tự comment bài của mình hoặc tự reply comment của mình.

### Bước 5: Lưu notification vào database

Consumer không trả dữ liệu về request ban đầu. Nhiệm vụ của nó là tạo record trong bảng `notification`.

Entity `Notification` hiện lưu:

- `recipientId`: user nhận thông báo
- `type`: loại thông báo, ví dụ `NEW_COMMENT`, `REPLY_COMMENT`
- `message`: nội dung hiển thị
- `postId`, `postSlug`, `postTitle`: dữ liệu liên kết về bài viết
- `commentId`: comment liên quan
- `read`: trạng thái đã đọc hay chưa
- `createdAt`: thời điểm tạo

Ví dụ message được tạo:

- `A đã bình luận bài viết "B"`
- `A đã trả lời bình luận của bạn trong bài "B"`

## 6. Backend cung cấp API nào để lấy notification

Sau khi consumer lưu dữ liệu vào bảng `notification`, frontend hoặc client khác gọi API backend để lấy danh sách thông báo.

Các API hiện có trong `NotificationController`:

- `GET /api/notifications?page=0&size=20`: lấy danh sách notification của user hiện tại
- `GET /api/notifications/unread-count`: lấy số lượng chưa đọc
- `PUT /api/notifications/{id}/read`: đánh dấu một thông báo đã đọc
- `PUT /api/notifications/read-all`: đánh dấu tất cả đã đọc

Điều này có nghĩa là Kafka chỉ đóng vai trò trung gian vận chuyển event và kích hoạt xử lý bất đồng bộ. Dữ liệu thông báo cuối cùng vẫn được backend quản lý tập trung trong database và trả ra bằng REST API.

## 7. Cơ chế nhận notification trên frontend

Frontend hiện tại không nhận notification trực tiếp từ Kafka và cũng chưa dùng WebSocket hoặc SSE. Cả `blog-public` và `blog-admin` đều lấy notification bằng cách gọi REST API của backend.

### 7.1. Các file frontend đang xử lý notification

#### Blog public

- API client: [notification.service.js](E:/PhuongCM/Tutorial/blog/blog-public/js/notification.service.js)
- UI bell và dropdown: [ui.js](E:/PhuongCM/Tutorial/blog/blog-public/js/ui.js)

#### Blog admin

- API client: [notification.service.js](E:/PhuongCM/Tutorial/blog/blog-admin/js/services/notification.service.js)
- Logic bell admin: cũng nằm trong [notification.service.js](E:/PhuongCM/Tutorial/blog/blog-admin/js/services/notification.service.js)

### 7.2. Frontend nhận notification theo kiểu nào

Hiện tại frontend dùng 2 cách kết hợp:

1. Polling định kỳ để cập nhật badge số lượng chưa đọc.
2. On-demand loading để tải danh sách notification khi người dùng mở dropdown.

Nói rõ hơn:

- frontend không mở kết nối realtime tới Kafka
- frontend không subscribe topic Kafka
- frontend chỉ gọi backend qua HTTP
- backend là nơi duy nhất đọc dữ liệu từ bảng `notification`

### 7.3. Luồng nhận notification ở `blog-public`

Sau khi user đăng nhập và `UI.renderNav()` chạy:

- frontend render icon chuông thông báo
- gọi `UI._refreshNotifBadge()` ngay khi load trang
- sau đó chạy `setInterval(() => this._refreshNotifBadge(), 60000)`

Điều này có nghĩa:

- cứ mỗi 60 giây frontend gọi `GET /api/notifications/unread-count`
- nếu có thông báo mới, badge trên chuông sẽ đổi số
- nếu chưa mở dropdown thì frontend mới chỉ biết số lượng, chưa tải toàn bộ danh sách

Khi user bấm vào chuông:

- `UI._loadNotifications()` được gọi
- frontend gọi `GET /api/notifications?page=0&size=15`
- backend trả về danh sách notification mới nhất
- frontend render từng item trong dropdown

Khi user bấm một notification:

- frontend gọi `PUT /api/notifications/{id}/read`
- bỏ trạng thái `unread` trên item
- gọi lại `UI._refreshNotifBadge()`
- nếu có `postSlug`, frontend điều hướng sang:
  - `post.html?slug={postSlug}`
  - hoặc `post.html?slug={postSlug}#comment-{commentId}`

Khi user bấm "đánh dấu tất cả đã đọc":

- frontend gọi `PUT /api/notifications/read-all`
- tải lại unread count
- tải lại danh sách dropdown

### 7.4. Luồng nhận notification ở `blog-admin`

`blog-admin` cũng dùng đúng REST API backend, nhưng cách gắn UI hơi khác do dùng dropdown kiểu admin panel.

Khi admin init notification:

- gọi `refreshBadge()` ngay lúc khởi tạo
- polling mỗi 60 giây để gọi `GET /api/notifications/unread-count`

Khi dropdown notification mở ra:

- event `show.bs.dropdown` được bắt
- `loadList()` được gọi
- frontend gọi `GET /api/notifications?page=0&size=10`
- kết quả được render thành các item trong menu dropdown

Khi admin click một item:

- frontend gọi `PUT /api/notifications/{id}/read`
- refresh badge
- nếu notification có `postSlug` thì chuyển sang trang public của bài viết, có thể kèm anchor comment

### 7.5. Bản chất của "nhận notification" ở frontend

Về mặt kỹ thuật, frontend hiện không "receive push" theo nghĩa realtime server đẩy xuống trình duyệt.

Thay vào đó, frontend đang:

1. hỏi backend định kỳ xem có bao nhiêu notification chưa đọc
2. hỏi backend khi người dùng mở danh sách thông báo
3. cập nhật UI dựa trên dữ liệu backend trả về

Nói cách khác:

- Kafka xử lý bất đồng bộ ở phía backend
- database `notification` là nơi lưu trạng thái cuối cùng
- REST API là cầu nối để frontend lấy notification
- polling 60 giây là cơ chế giúp frontend "nhận biết" có thông báo mới

### 7.6. Sơ đồ luồng frontend

```text
Kafka Consumer
  -> lưu notification vào MySQL
  -> frontend chưa biết ngay lập tức

Frontend
  -> mỗi 60 giây gọi /api/notifications/unread-count
  -> badge đổi số nếu có notification mới
  -> khi user mở dropdown, gọi /api/notifications
  -> render danh sách thông báo
  -> khi user click item, gọi /api/notifications/{id}/read
```

### 7.7. Ưu và nhược điểm của cơ chế frontend hiện tại

#### Ưu điểm

- đơn giản, dễ triển khai
- không cần websocket server riêng
- dễ debug vì toàn bộ dữ liệu đi qua REST API
- phù hợp với quy mô dự án hiện tại

#### Nhược điểm

- không realtime tuyệt đối vì phụ thuộc polling 60 giây
- nếu user không mở dropdown thì chỉ thấy badge, chưa thấy nội dung chi tiết
- số request tăng theo chu kỳ polling nếu nhiều người dùng online cùng lúc

### 7.8. Nếu muốn realtime hơn sau này

Có thể giữ nguyên Kafka ở backend và mở rộng thêm một tầng push ra frontend:

- Kafka Consumer tạo notification
- sau đó backend phát tiếp qua WebSocket hoặc SSE
- frontend subscribe channel người dùng đang đăng nhập

Khi đó luồng sẽ là:

- Kafka dùng cho backend async processing
- WebSocket hoặc SSE dùng cho browser realtime delivery

## 8. Sơ đồ luồng xử lý

```text
User
  -> POST /api/comments
  -> CommentServiceImpl
  -> save PostComment vào MySQL
  -> transaction commit
  -> KafkaProducerService
  -> topic blog.events.comment
  -> NotificationService (@KafkaListener)
  -> save Notification vào bảng notification
  -> frontend gọi /api/notifications để đọc thông báo
```

## 9. Vì sao cách làm này hợp lý

### Ưu điểm

- Request tạo comment phản hồi nhanh hơn vì không phải xử lý notification đồng bộ.
- Tách biệt rõ business create comment và business create notification.
- Có thể mở rộng thêm consumer khác từ cùng một event, ví dụ:
  - gửi email
  - đẩy WebSocket
  - ghi audit log
  - analytics
- Dễ retry ở tầng message broker hơn là gắn cứng toàn bộ xử lý trong request.

### Giá phải chấp nhận

- Notification không xuất hiện tức thời tuyệt đối, mà là near real-time
- hệ thống phức tạp hơn do có thêm Kafka, consumer, monitoring
- cần chú ý duplicate event hoặc xử lý lại message nếu muốn bảo đảm cao hơn

## 10. Một số điểm kỹ thuật cần lưu ý

### 10.1. Đây là async processing, không phải gửi trực tiếp cho frontend

Kafka không gửi notification trực tiếp đến trình duyệt. Kafka chỉ chuyển event giữa các thành phần backend.

Muốn frontend thấy thông báo, hiện tại flow là:

1. Kafka consumer lưu record vào DB.
2. Frontend gọi REST API để lấy danh sách notification.

Nếu sau này cần real-time hơn, có thể bổ sung WebSocket hoặc SSE sau bước consumer.

### 10.2. Tính nhất quán hiện tại khá tốt ở thời điểm publish

Việc publish trong `afterCommit()` là điểm đúng về mặt kiến trúc. Nó giúp:

- DB thành công rồi mới phát event
- giảm nguy cơ event mồ côi

Tuy nhiên, đây chưa phải mô hình outbox pattern hoàn chỉnh. Nếu application commit DB xong nhưng crash trước khi gửi Kafka thì event vẫn có thể bị mất.

### 10.3. Consumer hiện đang ghi trực tiếp vào DB

`NotificationService` hiện là consumer kiêm nơi viết notification xuống DB. Đây là cách đơn giản, dễ hiểu, phù hợp với dự án hiện tại.

Khi hệ thống lớn hơn, có thể tách thành:

- `CommentEventConsumer`
- `NotificationApplicationService`
- `NotificationPublisher` cho WebSocket/email/mobile push

## 11. Tóm tắt ngắn

Cơ chế hiện tại hoạt động như sau:

1. Backend nhận request tạo comment.
2. Comment được lưu vào MySQL.
3. Sau khi transaction commit thành công, backend phát `CommentEvent` lên Kafka topic `blog.events.comment`.
4. `NotificationService` lắng nghe topic này và quyết định ai cần nhận thông báo.
5. Consumer lưu notification vào bảng `notification`.
6. Frontend polling `/api/notifications/unread-count` để cập nhật badge và gọi `/api/notifications` khi cần tải danh sách.
7. Client đánh dấu đã đọc bằng các API `read` hoặc `read-all`.

Nói ngắn gọn: Kafka là lớp trung gian bất đồng bộ giữa hành động comment và việc tạo notification trong backend, còn frontend hiện nhận notification qua REST API theo cơ chế polling và tải danh sách theo nhu cầu.
