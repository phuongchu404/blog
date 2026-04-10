package me.phuongcm.blog.controller;

import jakarta.servlet.http.HttpServletResponse;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.entity.AuditLog;
import me.phuongcm.blog.repository.AuditLogRepository;
import me.phuongcm.blog.spec.AuditLogSpec;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * GET /api/admin/audit-logs
     * Query params: username, action, resource, status, dateFrom, dateTo, page, size
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result = auditLogRepository.findAll(
                AuditLogSpec.filter(username, action, resource, status, dateFrom, dateTo),
                pageable
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/admin/audit-logs/export
     * Xuất CSV với cùng bộ filter.
     */
    @GetMapping("/export")
    public void exportCsv(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            HttpServletResponse response
    ) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"audit-logs.csv\"");
        // BOM for Excel UTF-8 recognition
        response.getOutputStream().write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

        List<AuditLog> logs = auditLogRepository.findAll(
                AuditLogSpec.filter(username, action, resource, status, dateFrom, dateTo),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        PrintWriter writer = response.getWriter();
        writer.println("ID,Time,User ID,Username,Action,Resource,Resource ID,Detail,IP Address,Status,Duration(ms),Error");
        for (AuditLog log : logs) {
            writer.println(String.join(",",
                    safe(log.getId()),
                    safe(log.getCreatedAt() != null ? log.getCreatedAt().format(FMT) : ""),
                    safe(log.getUserId()),
                    safe(log.getUsername()),
                    safe(log.getAction()),
                    safe(log.getResource()),
                    safe(log.getResourceId()),
                    csvEscape(log.getDetail()),
                    safe(log.getIpAddress()),
                    safe(log.getStatus()),
                    safe(log.getDurationMs()),
                    csvEscape(log.getErrorMessage())
            ));
        }
        writer.flush();
    }

    private String safe(Object val) {
        return val == null ? "" : val.toString();
    }

    private String csvEscape(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
