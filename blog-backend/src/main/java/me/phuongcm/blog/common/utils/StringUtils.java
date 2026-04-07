package me.phuongcm.blog.common.utils;

public class StringUtils {
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

}
