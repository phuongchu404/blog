package me.phuongcm.blog.controller;

import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.service.SiteSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    public SiteSettingController(SiteSettingService siteSettingService) {
        this.siteSettingService = siteSettingService;
    }

    /**
     * GET /api/settings/public — Trả về các settings an toàn cho blog-public.
     * Không yêu cầu đăng nhập.
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicSettings() {
        List<String> publicKeys = List.of(
            "siteName", "siteTagline", "siteUrl",
            "showAuthor", "showReadTime",
            "enableComments", "requireLogin",
            "googleAnalyticsId", "metaTitle", "metaDescription",
            "postsPerPage"
        );
        Map<String, String> result = new LinkedHashMap<>();
        for (String key : publicKeys) {
            result.put(key, siteSettingService.getValue(key, ""));
        }
        return ResponseEntity.ok(result);
    }

    /** GET /api/settings — Lấy toàn bộ settings, nhóm theo group. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Map<String, String>>> getAllSettings() {
        return ResponseEntity.ok(siteSettingService.getAllSettings());
    }

    /** GET /api/settings/{group} — Lấy settings của một group. */
    @GetMapping("/{group}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> getSettingsByGroup(@PathVariable String group) {
        return ResponseEntity.ok(siteSettingService.getSettingsByGroup(group));
    }

    /** PUT /api/settings/{group} — Cập nhật settings của một group. */
    @Auditable(action = "UPDATE", resource = "SETTINGS")
    @PutMapping("/{group}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateGroupSettings(
            @PathVariable String group,
            @RequestBody Map<String, String> settings) {
        return ResponseEntity.ok(siteSettingService.updateGroupSettings(group, settings));
    }
}
