create table category
(
    id         bigint auto_increment
        primary key,
    parent_id  bigint       null,
    title      varchar(75)  not null,
    meta_title varchar(100) null,
    slug       varchar(100) not null,
    content    text         null,
    constraint fk_category_parent
        foreign key (parent_id) references category (id)
)
    collate = utf8mb4_unicode_ci;

create index idx_category_parent
    on category (parent_id);

create table permission
(
    id            bigint auto_increment
        primary key,
    created_at    datetime(6)  null,
    is_white_list int          null,
    method        varchar(10)  null,
    pattern       varchar(200) null,
    tag           varchar(120) not null,
    type          varchar(20)  null,
    updated_at    datetime(6)  null,
    name          varchar(100) not null,
    constraint UK2ojme20jpga3r4r79tdso17gi
        unique (name)
);

create table role
(
    id          bigint auto_increment
        primary key,
    created_at  datetime(6)  null,
    created_by  varchar(255) null,
    updated_at  datetime(6)  null,
    updated_by  varchar(255) null,
    description varchar(200) null,
    name        varchar(255) not null,
    constraint UK8sewwnpamngi6b1dwaa88askk
        unique (name)
);

create table role_permission
(
    id            bigint auto_increment
        primary key,
    created_at    datetime(6) null,
    updated_at    datetime(6) null,
    permission_id bigint      not null,
    role_id       bigint      not null,
    constraint FKa6jx8n8xkesmjmv6jqug6bg68
        foreign key (role_id) references role (id),
    constraint FKf8yllw1ecvwqy3ehyxawqa1qp
        foreign key (permission_id) references permission (id)
);

create table tag
(
    id         bigint auto_increment
        primary key,
    title      varchar(75)  not null,
    meta_title varchar(100) null,
    slug       varchar(100) not null,
    content    varchar(255) null
)
    collate = utf8mb4_unicode_ci;

create table user
(
    id            bigint auto_increment
        primary key,
    first_name    varchar(50)                                    null,
    middle_name   varchar(50)                                    null,
    last_name     varchar(50)                                    null,
    mobile        varchar(10)                                    null,
    email         varchar(50)                                    null,
    password      varchar(100)                                   null,
    registered_at datetime                                       null,
    last_login    datetime                                       null,
    intro         tinytext                                       null,
    profile       varchar(255)                                   null,
    created_at    datetime(6)                                    null,
    created_by    varchar(255)                                   null,
    updated_at    datetime(6)                                    null,
    updated_by    varchar(255)                                   null,
    image_url     varchar(255)                                   null,
    provider      enum ('facebook', 'github', 'google', 'local') not null,
    status        int                                            not null,
    username      varchar(100)                                   not null,
    full_name     varchar(100)                                   null,
    provider_id   varchar(255)                                   null,
    constraint uq_emai
        unique (email),
    constraint uq_mobile
        unique (mobile)
)
    collate = utf8mb4_unicode_ci;

create table post
(
    id           bigint auto_increment
        primary key,
    author_id    bigint       not null,
    parent_id    bigint       null,
    title        varchar(75)  not null,
    meta_title   varchar(100) null,
    slug         varchar(100) not null,
    summary      tinytext     null,
    published    bit          null,
    created_at   datetime     not null,
    updated_at   datetime     null,
    published_at datetime     null,
    content      text         null,
    view_count   bigint       not null,
    constraint uq_slug
        unique (slug),
    constraint fk_post_parent
        foreign key (parent_id) references post (id),
    constraint fk_post_user
        foreign key (author_id) references user (id)
)
    collate = utf8mb4_unicode_ci;

create index idx_post_parent
    on post (parent_id);

create index idx_post_user
    on post (author_id);

create table post_category
(
    id          bigint auto_increment
        primary key,
    category_id bigint not null,
    post_id     bigint not null,
    constraint FKqly0d5oc4npxdig2fjfoshhxg
        foreign key (category_id) references category (id),
    constraint FKqr4dx4cx1lh4jfjchabytcakl
        foreign key (post_id) references post (id)
);

create table post_comment
(
    id           bigint auto_increment
        primary key,
    post_id      bigint       not null,
    parent_id    bigint       null,
    title        varchar(100) not null,
    published    bit          null,
    created_at   datetime     not null,
    published_at datetime     null,
    content      text         null,
    user_id      bigint       not null,
    constraint FKtc1fl97yq74q7j8i08ds731s1
        foreign key (user_id) references user (id),
    constraint fk_comment_parent
        foreign key (parent_id) references post_comment (id),
    constraint fk_comment_post
        foreign key (post_id) references post (id)
)
    collate = utf8mb4_unicode_ci;

create index idx_comment_parent
    on post_comment (parent_id);

create index idx_comment_post
    on post_comment (post_id);

create table post_meta
(
    id      bigint auto_increment
        primary key,
    post_id bigint      not null,
    `key`   varchar(50) not null,
    content text        null,
    constraint uq_post_meta
        unique (post_id, `key`),
    constraint fk_meta_post
        foreign key (post_id) references post (id)
)
    collate = utf8mb4_unicode_ci;

create index idx_meta_post
    on post_meta (post_id);

create table post_tag
(
    id      bigint auto_increment
        primary key,
    post_id bigint not null,
    tag_id  bigint not null,
    constraint FKac1wdchd2pnur3fl225obmlg0
        foreign key (tag_id) references tag (id),
    constraint FKc2auetuvsec0k566l0eyvr9cs
        foreign key (post_id) references post (id)
);

create table refresh_tokens
(
    id          bigint auto_increment
        primary key,
    expiry_date datetime(6)  not null,
    token       varchar(255) not null,
    user_id     bigint       null,
    constraint UK7tdcd6ab5wsgoudnvj7xf1b7l
        unique (user_id),
    constraint UKghpmfn23vmxfu3spu3lfg4r2d
        unique (token),
    constraint FKjwc9veyjcjfkej6rnnbsijfvh
        foreign key (user_id) references user (id)
);

create table user_role
(
    id         bigint auto_increment
        primary key,
    created_at datetime(6) null,
    updated_at datetime(6) null,
    role_id    bigint      not null,
    user_id    bigint      not null,
    constraint FK859n2jvi8ivhui0rl0esws6o
        foreign key (user_id) references user (id),
    constraint FKa68196081fvovjhkek5m97n3y
        foreign key (role_id) references role (id)
);

INSERT INTO blog.user (id, first_name, middle_name, last_name, mobile, email, password, registered_at, last_login, intro, profile, created_at, created_by, updated_at, updated_by, image_url, provider, status, username, full_name, provider_id) VALUES (1, null, null, null, null, 'admin@example.com', '$2a$10$9qEiXYQVN2n2C1bcXFQDrO1nLOTsghg7c4oj.p.mStp6wZ/vRxPGO', null, null, null, null, '2026-04-06 09:34:10.000000', null, '2026-04-06 10:01:01.535101', null, null, 'local', 1, 'admin', null, null);
INSERT INTO blog.user (id, first_name, middle_name, last_name, mobile, email, password, registered_at, last_login, intro, profile, created_at, created_by, updated_at, updated_by, image_url, provider, status, username, full_name, provider_id) VALUES (2, null, null, null, null, 'editor@example.com', '$2a$10$5LMwtxCuaZN/0jOczB.xKOwLxi6e7r19dk3RO1rO8FC9JG9e1EM6m', null, null, null, null, '2026-04-06 09:34:10.000000', null, '2026-04-06 13:56:14.607056', null, null, 'local', 1, 'editor', null, null);
INSERT INTO blog.user (id, first_name, middle_name, last_name, mobile, email, password, registered_at, last_login, intro, profile, created_at, created_by, updated_at, updated_by, image_url, provider, status, username, full_name, provider_id) VALUES (3, null, null, null, null, 'user@example.com', '$2a$12$R.S91B33PzGE92MvV9v5CewT862QWc8sDccAEYp17F5B/YpEofzha', null, null, null, null, '2026-04-06 09:34:10.000000', null, '2026-04-06 09:34:10.000000', null, null, 'local', 1, 'user_test', null, null);



INSERT INTO blog.role (id, created_at, created_by, updated_at, updated_by, description, name) VALUES (1, '2026-04-06 09:34:10.000000', null, '2026-04-06 09:34:10.000000', null, 'Administrator with full access', 'ROLE_ADMIN');
INSERT INTO blog.role (id, created_at, created_by, updated_at, updated_by, description, name) VALUES (2, '2026-04-06 09:34:10.000000', null, '2026-04-06 09:34:10.000000', null, 'Editor can manage posts and content', 'ROLE_EDITOR');
INSERT INTO blog.role (id, created_at, created_by, updated_at, updated_by, description, name) VALUES (3, '2026-04-06 09:34:10.000000', null, '2026-04-06 09:34:10.000000', null, 'Normal user', 'ROLE_USER');
INSERT INTO blog.role (id, created_at, created_by, updated_at, updated_by, description, name) VALUES (22, '2026-04-06 09:51:07.561963', null, '2026-04-06 09:51:07.561963', null, 'Kiểm duyệt viên — duyệt nội dung', 'ROLE_MODERATOR');


INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (1, '2026-04-06 09:34:10.000000', 0, null, '/admin/dashboard', 'menu:dashboard', 'MENU', '2026-04-06 09:34:10.000000', 'Dashboard');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (2, '2026-04-06 09:34:10.000000', 0, null, '/admin/users', 'menu:users', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý người dùng');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (3, '2026-04-06 09:34:10.000000', 0, null, '/admin/roles', 'menu:roles', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý Role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (4, '2026-04-06 09:34:10.000000', 0, null, '/admin/permissions', 'menu:permissions', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý Permission');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (5, '2026-04-06 09:34:10.000000', 0, null, '/admin/posts', 'menu:posts', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (6, '2026-04-06 09:34:10.000000', 0, null, '/admin/categories', 'menu:categories', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý danh mục');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (7, '2026-04-06 09:34:10.000000', 0, null, '/admin/tags', 'menu:tags', 'MENU', '2026-04-06 09:34:10.000000', 'Quản lý tag');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (8, '2026-04-06 09:34:10.000000', 1, 'GET', '/api/posts/**', 'post:read', 'API', '2026-04-06 09:34:10.000000', 'Xem bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (9, '2026-04-06 09:34:10.000000', 0, 'POST', '/api/posts', 'post:create', 'API', '2026-04-06 09:34:10.000000', 'Tạo bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (10, '2026-04-06 09:34:10.000000', 0, 'PUT', '/api/posts/**', 'post:update', 'API', '2026-04-06 09:34:10.000000', 'Cập nhật bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (11, '2026-04-06 09:34:10.000000', 0, 'DELETE', '/api/posts/**', 'post:delete', 'API', '2026-04-06 09:34:10.000000', 'Xóa bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (12, '2026-04-06 09:34:10.000000', 0, 'GET', '/api/users/**', 'user:read', 'API', '2026-04-06 09:34:10.000000', 'Xem user');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (13, '2026-04-06 09:34:10.000000', 0, 'POST', '/api/users', 'user:create', 'API', '2026-04-06 09:34:10.000000', 'Tạo user');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (14, '2026-04-06 09:34:10.000000', 0, 'PUT', '/api/users/**', 'user:update', 'API', '2026-04-06 09:34:10.000000', 'Cập nhật user');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (15, '2026-04-06 09:34:10.000000', 0, 'DELETE', '/api/users/**', 'user:delete', 'API', '2026-04-06 09:34:10.000000', 'Xóa user');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (16, '2026-04-06 09:34:10.000000', 0, 'GET', '/api/roles/**', 'role:read', 'API', '2026-04-06 09:34:10.000000', 'Xem role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (17, '2026-04-06 09:34:10.000000', 0, '*', '/api/roles/**', 'role:manage', 'API', '2026-04-06 09:34:10.000000', 'Quản lý role (Create/Update/Delete)');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (18, '2026-04-06 09:34:10.000000', 0, 'GET', '/api/permissions/**', 'permission:read', 'API', '2026-04-06 09:34:10.000000', 'Xem permission');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (19, '2026-04-06 09:34:10.000000', 0, '*', '/api/permissions/**', 'permission:manage', 'API', '2026-04-06 09:34:10.000000', 'Quản lý permission (Create/Update/Delete)');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (21, '2026-04-06 09:51:07.641065', null, null, null, 'post:read:all', 'API', '2026-04-06 09:51:07.641065', 'Xem tất cả bài viết (kể cả chưa đăng)');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (22, '2026-04-06 09:51:07.678755', null, null, null, 'post:update:any', 'API', '2026-04-06 09:51:07.678755', 'Cập nhật bất kỳ bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (23, '2026-04-06 09:51:07.702614', null, null, null, 'post:delete:any', 'API', '2026-04-06 09:51:07.702614', 'Xóa bất kỳ bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (24, '2026-04-06 09:51:07.722133', null, null, null, 'post:publish', 'API', '2026-04-06 09:51:07.722133', 'Xuất bản/hủy xuất bản bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (25, '2026-04-06 09:51:07.737953', null, null, null, 'post:meta:manage', 'API', '2026-04-06 09:51:07.737953', 'Quản lý metadata bài viết');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (26, '2026-04-06 09:51:07.762755', null, null, null, 'category:create', 'API', '2026-04-06 09:51:07.762755', 'Tạo danh mục mới');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (27, '2026-04-06 09:51:07.774082', null, null, null, 'category:update', 'API', '2026-04-06 09:51:07.774082', 'Cập nhật danh mục');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (28, '2026-04-06 09:51:07.782081', null, null, null, 'category:delete', 'API', '2026-04-06 09:51:07.782081', 'Xóa danh mục');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (29, '2026-04-06 09:51:07.790617', null, null, null, 'tag:create', 'API', '2026-04-06 09:51:07.790617', 'Tạo tag mới');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (30, '2026-04-06 09:51:07.798617', null, null, null, 'tag:update', 'API', '2026-04-06 09:51:07.798617', 'Cập nhật tag');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (31, '2026-04-06 09:51:07.808590', null, null, null, 'tag:delete', 'API', '2026-04-06 09:51:07.808590', 'Xóa tag');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (32, '2026-04-06 09:51:07.823071', null, null, null, 'comment:create', 'API', '2026-04-06 09:51:07.823071', 'Tạo bình luận');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (33, '2026-04-06 09:51:07.830957', null, null, null, 'comment:update:any', 'API', '2026-04-06 09:51:07.830957', 'Cập nhật bất kỳ bình luận');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (34, '2026-04-06 09:51:07.837956', null, null, null, 'comment:delete:any', 'API', '2026-04-06 09:51:07.837956', 'Xóa bất kỳ bình luận');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (35, '2026-04-06 09:51:07.846962', null, null, null, 'comment:moderate', 'API', '2026-04-06 09:51:07.846962', 'Duyệt/từ chối bình luận');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (36, '2026-04-06 09:51:07.855954', null, null, null, 'comment:read:all', 'API', '2026-04-06 09:51:07.855954', 'Xem tất cả bình luận (kể cả chờ duyệt)');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (37, '2026-04-06 09:51:07.863956', null, null, null, 'user:read:all', 'API', '2026-04-06 09:51:07.863956', 'Xem danh sách tất cả người dùng');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (38, '2026-04-06 09:51:07.871063', null, null, null, 'user:update:any', 'API', '2026-04-06 09:51:07.871063', 'Cập nhật bất kỳ tài khoản');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (39, '2026-04-06 14:28:46.000000', 0, null, '/admin/comments', 'menu:comment', 'MENU', '2026-04-06 14:28:46.000000', 'Comment');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (40, '2026-04-16 00:00:00.000000', 0, 'POST', '/api/roles', 'role:create', 'API', '2026-04-16 00:00:00.000000', 'Create role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (41, '2026-04-16 00:00:00.000000', 0, 'PUT', '/api/roles/**', 'role:update', 'API', '2026-04-16 00:00:00.000000', 'Update role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (42, '2026-04-16 00:00:00.000000', 0, 'DELETE', '/api/roles/**', 'role:delete', 'API', '2026-04-16 00:00:00.000000', 'Delete role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (43, '2026-04-16 00:00:00.000000', 0, 'POST', '/api/roles/*/permissions', 'role:assign', 'API', '2026-04-16 00:00:00.000000', 'Assign permissions to role');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (44, '2026-04-16 00:00:00.000000', 0, 'POST', '/api/permissions', 'permission:create', 'API', '2026-04-16 00:00:00.000000', 'Create permission');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (45, '2026-04-16 00:00:00.000000', 0, 'PUT', '/api/permissions/**', 'permission:update', 'API', '2026-04-16 00:00:00.000000', 'Update permission');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (46, '2026-04-16 00:00:00.000000', 0, 'DELETE', '/api/permissions/**', 'permission:delete', 'API', '2026-04-16 00:00:00.000000', 'Delete permission');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (47, '2026-04-16 00:00:00.000000', 0, '*', '/api/users/*/membership', 'membership:manage', 'API', '2026-04-16 00:00:00.000000', 'Manage membership');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (48, '2026-04-16 00:00:00.000000', 0, 'POST', '/api/users/*/roles', 'user:assign-role', 'API', '2026-04-16 00:00:00.000000', 'Assign roles to user');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (49, '2026-04-16 00:00:00.000000', 0, null, '/admin/audit-logs', 'menu:audit-logs', 'MENU', '2026-04-16 00:00:00.000000', 'Audit Logs');
INSERT INTO blog.permission (id, created_at, is_white_list, method, pattern, tag, type, updated_at, name) VALUES (50, '2026-04-16 00:00:00.000000', 0, null, '/admin/settings', 'menu:settings', 'MENU', '2026-04-16 00:00:00.000000', 'Settings');


INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (32, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 6, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (33, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 1, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (34, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 4, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (35, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 5, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (36, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 3, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (37, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 7, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (38, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 2, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (39, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 19, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (40, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 18, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (41, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 9, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (42, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 11, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (43, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 8, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (44, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 10, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (45, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 17, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (46, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 16, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (47, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 13, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (48, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 15, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (49, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 12, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (50, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 14, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (63, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 1, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (64, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 5, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (65, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 6, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (66, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 7, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (67, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 8, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (68, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 9, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (69, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 10, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (70, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 11, 2);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (71, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 8, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (72, null, null, 21, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (73, null, null, 22, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (74, null, null, 23, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (75, null, null, 24, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (76, null, null, 25, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (77, null, null, 26, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (78, null, null, 27, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (79, null, null, 28, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (80, null, null, 29, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (81, null, null, 30, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (82, null, null, 31, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (83, null, null, 32, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (84, null, null, 33, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (85, null, null, 34, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (86, null, null, 35, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (87, null, null, 36, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (88, null, null, 37, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (89, null, null, 38, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (90, null, null, 9, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (91, null, null, 22, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (92, null, null, 23, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (93, null, null, 25, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (94, null, null, 32, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (95, null, null, 33, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (96, null, null, 34, 3);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (97, null, null, 35, 22);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (98, null, null, 36, 22);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (99, null, null, 32, 22);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (100, null, null, 34, 22);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (132, '2026-04-06 14:50:51.000000', '2026-04-06 14:50:51.000000', 39, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (133, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 40, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (134, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 41, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (135, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 42, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (136, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 43, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (137, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 44, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (138, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 45, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (139, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 46, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (140, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 47, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (141, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 48, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (142, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 49, 1);
INSERT INTO blog.role_permission (id, created_at, updated_at, permission_id, role_id) VALUES (143, '2026-04-16 00:00:00.000000', '2026-04-16 00:00:00.000000', 50, 1);


INSERT INTO blog.user_role (id, created_at, updated_at, role_id, user_id) VALUES (3, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 1, 1);
INSERT INTO blog.user_role (id, created_at, updated_at, role_id, user_id) VALUES (4, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 2, 2);
INSERT INTO blog.user_role (id, created_at, updated_at, role_id, user_id) VALUES (5, '2026-04-06 09:34:10.000000', '2026-04-06 09:34:10.000000', 3, 3);
