package me.phuongcm.blog.service.impl;

import jakarta.annotation.PostConstruct;
import me.phuongcm.blog.entity.SiteSetting;
import me.phuongcm.blog.repository.SiteSettingRepository;
import me.phuongcm.blog.service.SiteSettingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SiteSettingServiceImpl implements SiteSettingService {

    private final SiteSettingRepository repo;

    public SiteSettingServiceImpl(SiteSettingRepository repo) {
        this.repo = repo;
    }

    // ── Default values ────────────────────────────────────────────────────────
    private static final List<String[]> DEFAULTS = Arrays.asList(
        // group, key, value
        new String[]{"general", "siteName",         "My Tech Blog"},
        new String[]{"general", "siteTagline",      "Sharing knowledge, one post at a time"},
        new String[]{"general", "siteUrl",          "https://myblog.example.com"},
        new String[]{"general", "adminEmail",       "admin@myblog.example.com"},
        new String[]{"general", "timezone",         "Asia/Ho_Chi_Minh"},
        new String[]{"general", "language",         "English"},

        new String[]{"content", "postsPerPage",     "10"},
        new String[]{"content", "defaultPostStatus","draft"},
        new String[]{"content", "allowGuestRead",   "true"},
        new String[]{"content", "showAuthor",       "true"},
        new String[]{"content", "showReadTime",     "true"},

        new String[]{"comments", "enableComments",  "true"},
        new String[]{"comments", "requireApproval", "true"},
        new String[]{"comments", "requireLogin",    "false"},
        new String[]{"comments", "allowNested",     "true"},
        new String[]{"comments", "maxNestDepth",    "3"},

        new String[]{"seo", "metaTitle",            "My Tech Blog — Sharing Knowledge"},
        new String[]{"seo", "metaDescription",      "A blog about Java, Spring Boot, DevOps, and modern web development."},
        new String[]{"seo", "enableSitemap",        "true"},
        new String[]{"seo", "enableRobots",         "true"},
        new String[]{"seo", "googleAnalyticsId",    ""}
    );

    @PostConstruct
    @Transactional
    public void seedDefaults() {
        for (String[] def : DEFAULTS) {
            String group = def[0];
            String key   = def[1];
            String value = def[2];
            if (!repo.existsByKey(key)) {
                repo.save(new SiteSetting(null, key, value, group));
            }
        }
    }

    // ── Service methods ───────────────────────────────────────────────────────

    @Override
    public Map<String, Map<String, String>> getAllSettings() {
        List<SiteSetting> all = repo.findAll();
        Map<String, Map<String, String>> result = new LinkedHashMap<>();
        for (SiteSetting s : all) {
            result.computeIfAbsent(s.getGroup(), k -> new LinkedHashMap<>())
                  .put(s.getKey(), s.getValue() != null ? s.getValue() : "");
        }
        return result;
    }

    @Override
    public Map<String, String> getSettingsByGroup(String group) {
        return repo.findByGroup(group).stream()
                .collect(Collectors.toMap(
                        SiteSetting::getKey,
                        s -> s.getValue() != null ? s.getValue() : "",
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    @Override
    @Transactional
    public Map<String, String> updateGroupSettings(String group, Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key   = entry.getKey();
            String value = entry.getValue() != null ? entry.getValue() : "";

            SiteSetting setting = repo.findByKey(key).orElseGet(() -> {
                SiteSetting s = new SiteSetting();
                s.setKey(key);
                s.setGroup(group);
                return s;
            });
            setting.setValue(value);
            repo.save(setting);
        }
        return getSettingsByGroup(group);
    }

    @Override
    public String getValue(String key, String defaultValue) {
        return repo.findByKey(key)
                .map(SiteSetting::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(defaultValue);
    }
}
