-- ============================================================
-- Fix: Thay đổi cấu trúc bảng post_meta
-- Từ EAV (post_id + meta_key + content) → OneToOne (post_id + meta_title + meta_description + meta_keywords)
-- ============================================================

USE blog;

-- 1. Xoá unique constraint cũ (nếu tồn tại)
ALTER TABLE post_meta DROP INDEX IF EXISTS uq_post_meta;

-- 2. Xoá các cột cũ (nếu tồn tại)
ALTER TABLE post_meta DROP COLUMN IF EXISTS meta_key;
ALTER TABLE post_meta DROP COLUMN IF EXISTS content;

-- 3. Thêm 3 cột meta mới
ALTER TABLE post_meta ADD COLUMN IF NOT EXISTS meta_title VARCHAR(100) DEFAULT NULL;
ALTER TABLE post_meta ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT NULL;
ALTER TABLE post_meta ADD COLUMN IF NOT EXISTS meta_keywords TEXT DEFAULT NULL;

-- 4. Thêm unique constraint mới (chỉ post_id, đảm bảo 1 post chỉ có 1 row meta)
ALTER TABLE post_meta ADD CONSTRAINT uq_post_meta UNIQUE (post_id);

-- 5. (Tuỳ chọn) Migrate dữ liệu cũ nếu có
-- Nếu bảng cũ dùng EAV, chạy các lệnh sau để migrate:
-- UPDATE post_meta pm
--   INNER JOIN (SELECT post_id, content FROM post_meta WHERE meta_key = 'metaTitle') t
--   ON t.post_id = pm.post_id
--   SET pm.meta_title = t.content;
-- (Tương tự cho metaDescription, metaKeywords)

-- 6. Xoá dữ liệu EAV cũ đã dùng cho 3 key này
-- DELETE FROM post_meta WHERE meta_key IN ('metaTitle', 'metaDescription', 'metaKeywords');