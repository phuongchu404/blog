package me.phuongcm.blog.common.utils;

import lombok.Getter;

@Getter
public enum Status {
    ACTIVE(1),
    INACTIVE(0),
    DELETED(-1);
    private final int value;
    Status(int value) {
        this.value = value;
    }
}
