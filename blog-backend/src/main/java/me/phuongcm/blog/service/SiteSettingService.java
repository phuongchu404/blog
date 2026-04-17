package me.phuongcm.blog.service;

import java.util.Map;

public interface SiteSettingService {

    /** Trả về toàn bộ settings, nhóm theo group: { "general": { "siteName": "..." }, ... } */
    Map<String, Map<String, String>> getAllSettings();

    /** Trả về settings của một group cụ thể */
    Map<String, String> getSettingsByGroup(String group);

    /** Cập nhật settings của một group, trả về map sau khi update */
    Map<String, String> updateGroupSettings(String group, Map<String, String> settings);

    /** Lấy giá trị theo key, trả về defaultValue nếu không tìm thấy */
    String getValue(String key, String defaultValue);
}
