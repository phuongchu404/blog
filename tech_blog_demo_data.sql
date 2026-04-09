-- Dữ liệu mẫu cho Blog Công nghệ
USE `blog`;

-- Thu gọn các bảng trước khi thêm để tránh trùng lặp dữ liệu quá trình test
-- (Bỏ comment các dòng TRUNCATE nếu muốn làm sạch dữ liệu trước khi chạy file này)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE post_comment;
-- TRUNCATE TABLE post_tag;
-- TRUNCATE TABLE post_category;
-- TRUNCATE TABLE tag;
-- TRUNCATE TABLE category;
-- TRUNCATE TABLE post;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Thêm Categories chuyên ngành Công Nghệ
INSERT INTO category (id, parent_id, title, meta_title, slug, content) VALUES
(1, NULL, 'Lập trình', 'Lập trình', 'lap-trinh', 'Kiến thức về lập trình, ngôn ngữ lập trình và thuật toán'),
(2, 1, 'Web Development', 'Phát triển Web', 'web-development', 'Kiến thức lập trình website: Frontend, Backend, Fullstack'),
(3, 1, 'Mobile Development', 'Phát triển Mobile', 'mobile-development', 'Lập trình ứng dụng di động: iOS, Android, Flutter, React Native'),
(4, NULL, 'Trí tuệ nhân tạo (AI)', 'AI & Machine Learning', 'ai-machine-learning', 'Tin tức và hướng dẫn về AI, Machine Learning, Deep Learning'),
(5, NULL, 'DevOps & Cloud', 'DevOps', 'devops', 'Hạ tầng, CI/CD, Docker, Kubernetes, AWS, Azure'),
(6, NULL, 'Bảo mật (Security)', 'Cyber Security', 'security', 'An toàn thông tin, bảo mật hệ thống mạng, hacking cơ bản');

-- Thêm Tags nổi bật về Công nghệ
INSERT INTO tag (id, title, meta_title, slug, content) VALUES
(1, 'Java', 'Java', 'java', 'Ngôn ngữ lập trình Java'),
(2, 'Python', 'Python', 'python', 'Ngôn ngữ lập trình Python nổi tiếng trong AI và Data Science'),
(3, 'JavaScript', 'JavaScript', 'javascript', 'Ngôn ngữ lập trình chính cho phát triển web frontend'),
(4, 'ReactJS', 'ReactJS', 'reactjs', 'Thư viện UI UI phổ biến của Facebook cho Frontend'),
(5, 'Docker', 'Docker', 'docker', 'Công cụ ảo hoá môi trường container cho DevOps'),
(6, 'ChatGPT', 'ChatGPT', 'chatgpt', 'Trí tuệ nhân tạo đình đám của OpenAI'),
(7, 'Node.js', 'Node.js', 'nodejs', 'Môi trường thực thi JavaScript ở phía máy chủ Backend');

-- Thêm Posts (Sử dụng author_id = 1 tương ứng với tài khoản 'admin' mặc định có từ file init)
INSERT INTO post (id, author_id, parent_id, title, meta_title, slug, summary, published, status, created_at, updated_at, published_at, content, view_count) VALUES
(1, 1, NULL, 'Hướng dẫn học ReactJS cho người mới bắt đầu', 'Học ReactJS cơ bản', 'huong-dan-hoc-reactjs-cho-nguoi-moi', 'Bài viết này sẽ hướng dẫn bạn từng bước để bắt đầu với thư viện ReactJS, cách khởi tạo dự án với Vite và viết component đầu tiên.', 1, 1, NOW(), NOW(), NOW(), '<p>ReactJS đang là thư viện frontend phổ biến nhất hiện nay. Để bắt đầu học ReactJS...</p>', 1500),
(2, 1, NULL, 'Tại sao Python là ngôn ngữ tốt nhất cho AI và Machine Learning?', 'Python trong AI', 'tai-sao-python-tot-nhat-cho-ai', 'Cùng tìm hiểu lý do tại sao Python thống trị trong lĩnh vực Trí tuệ nhân tạo so với Java hay C++.', 1, 1, NOW(), NOW(), NOW(), '<p>Trong những năm qua, hệ sinh thái AI phát triển mạnh mẽ và Python chính là tâm điểm với các thư viện như TensorFlow, PyTorch...</p>', 3200),
(3, 1, NULL, 'Docker hóa ứng dụng Web với Node.js', 'Docker Nodejs tutorial', 'docker-hoa-ung-dung-web-nodejs', 'Cách đóng gói (containerize) ứng dụng Node.js của bạn vào trong Docker container để dễ dàng deploy.', 1, 1, NOW(), NOW(), NOW(), '<p>Hôm nay chúng ta sẽ tìm hiểu cách xây dựng Dockerfile và docker-compose.yml cho ứng dụng Express Backend.</p>', 890);

-- Mapping Bài Viết & Thể Loại (Post_Category)
INSERT INTO post_category (category_id, post_id) VALUES
(2, 1), -- Hướng dẫn học ReactJS -> Web Development
(1, 1), -- Hướng dẫn học ReactJS -> Lập trình
(4, 2), -- Tại sao Python tốt nhất cho AI -> Trí tuệ nhân tạo (AI)
(1, 2), -- Tại sao Python tốt nhất cho AI -> Lập trình
(5, 3), -- Docker hóa app Nodejs -> DevOps & Cloud
(2, 3); -- Docker hóa app Nodejs -> Web Development

-- Mapping Bài Viết & Tag (Post_Tag)
INSERT INTO post_tag (post_id, tag_id) VALUES
(1, 3), -- Hướng dẫn học ReactJS -> JavaScript
(1, 4), -- Hướng dẫn học ReactJS -> ReactJS
(2, 2), -- Tại sao Python... -> Python
(2, 6), -- Tại sao Python... -> ChatGPT
(3, 5), -- Docker hóa... -> Docker
(3, 7), -- Docker hóa... -> Node.js
(3, 3); -- Docker hóa... -> JavaScript

-- Thêm Comments (Sử dụng user_id = 3 tương ứng user_test, user_id=1 là admin)
INSERT INTO post_comment (post_id, parent_id, title, published, created_at, published_at, content, user_id) VALUES
(1, NULL, 'Bài viết rất hay, thanks admin!', 1, NOW(), NOW(), 'Cảm ơn admin đã chia sẻ bài viết rất hữu ích và dễ hiểu đối với một người mới như mình.', 3), 
(1, 1, 'Cảm ơn bạn', 1, NOW(), NOW(), 'Rất vui vì bài viết đem lại giá trị cho bạn. Nhớ theo dõi các phần tiếp theo nhé!', 1), 
(2, NULL, 'Cho mình hỏi về thư viện Pandas', 1, NOW(), NOW(), 'Admin có thể viết thêm series hướng dẫn xử lý dữ liệu với Pandas không ạ?', 3);
