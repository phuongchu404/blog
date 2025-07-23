package me.phuongcm.blog.common.utils;

public enum PublishedStatus {
    PUBLISHED(1),
    UNPUBLISHED(0);

    private Integer value;

    PublishedStatus(Integer value) {
        this.value = value;
    }

    public Integer getValue() {
        return value;
    }
}
