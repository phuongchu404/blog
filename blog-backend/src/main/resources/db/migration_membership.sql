-- ============================================================
-- Migration: Membership Feature
-- ============================================================

-- 1. Thêm cột member_only vào bảng post
ALTER TABLE post
    ADD COLUMN IF NOT EXISTS member_only TINYINT(1) NOT NULL DEFAULT 0;

-- 2. Thêm cột membership vào bảng user
ALTER TABLE user
    ADD COLUMN IF NOT EXISTS membership_status INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS membership_expired_at DATETIME NULL;

-- 3. Thêm permission membership:manage
INSERT IGNORE INTO permission (name, tag)
VALUES ('membership:manage', 'membership');

-- 4. Gán permission membership:manage cho ROLE_ADMIN
INSERT IGNORE INTO role_permission (permission_id, role_id)
SELECT p.id, r.id
FROM permission p, role r
WHERE p.name = 'membership:manage'
  AND r.name = 'ROLE_ADMIN';
