package me.phuongcm.blog.common.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * SlugUtils.java — Utility class to generate URL-friendly slugs.
 * Specifically handles Vietnamese characters.
 */
public class SlugUtils {

    /**
     * Converts a string to a slug.
     * @param title The input string (e.g., post title).
     * @return A URL-friendly slug (e.g., "khoa-hoc-cong-nghe").
     */
    public static String toSlug(String title) {
        if (title == null || title.isEmpty()) {
            return "";
        }

        // Convert to lowercase
        String slug = title.toLowerCase();

        // 1. Manual replacements for specific Vietnamese characters
        slug = slug.replaceAll("[áàảạãăắằẳặẵâấầẩậẫ]", "a");
        slug = slug.replaceAll("[éèẻẹẽêếềểệễ]", "e");
        slug = slug.replaceAll("[íìỉịĩ]", "i");
        slug = slug.replaceAll("[óòỏọõôốồổộỗơớờởợỡ]", "o");
        slug = slug.replaceAll("[úùủụũưứừửựữ]", "u");
        slug = slug.replaceAll("[ýỳỷỵỹ]", "y");
        slug = slug.replaceAll("đ", "d");

        // 2. Normalizer to decompose remaining marks
        String normalized = Normalizer.normalize(slug, Normalizer.normalize(slug, Normalizer.Form.NFD).length() > 0 ? Normalizer.Form.NFD : Normalizer.Form.NFKD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        slug = pattern.matcher(normalized).replaceAll("");

        // 3. Final cleanup: remove non-alphanumeric, spaces to dashes
        return slug.replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
