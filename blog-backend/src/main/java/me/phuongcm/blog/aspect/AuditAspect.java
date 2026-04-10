package me.phuongcm.blog.aspect;

import jakarta.servlet.http.HttpServletRequest;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.entity.AuditLog;
import me.phuongcm.blog.repository.AuditLogRepository;
import me.phuongcm.blog.security.SecurityUtil;
import me.phuongcm.blog.security.service.CustomUserDetails;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Around("@annotation(me.phuongcm.blog.annotation.Auditable)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();

        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Auditable auditable = signature.getMethod().getAnnotation(Auditable.class);

        Optional<CustomUserDetails> userOpt = SecurityUtil.getCurrentUser();
        Long userId = userOpt.map(CustomUserDetails::getId).orElse(null);
        String username = userOpt.map(CustomUserDetails::getUsername).orElse("anonymous");

        String ipAddress = resolveIp();
        String userAgent = resolveUserAgent();

        String status = "SUCCESS";
        String errorMessage = null;
        Object result = null;

        try {
            result = pjp.proceed();
        } catch (Throwable ex) {
            status = "FAIL";
            errorMessage = ex.getMessage();
            throw ex;
        } finally {
            int duration = (int) (System.currentTimeMillis() - start);
            String detail = auditable.detail().isBlank()
                    ? auditable.action() + " " + auditable.resource()
                    : auditable.detail();

            saveAsync(AuditLog.builder()
                    .userId(userId)
                    .username(username)
                    .action(auditable.action())
                    .resource(auditable.resource())
                    .detail(detail)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status(status)
                    .durationMs(duration)
                    .errorMessage(errorMessage)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        return result;
    }

    @Async
    public void saveAsync(AuditLog log) {
        auditLogRepository.save(log);
    }

    private String resolveIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }

    private String resolveUserAgent() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            return attrs.getRequest().getHeader("User-Agent");
        } catch (Exception e) {
            return null;
        }
    }
}
