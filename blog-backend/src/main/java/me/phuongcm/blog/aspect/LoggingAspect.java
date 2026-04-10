package me.phuongcm.blog.aspect;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

/**
 * LoggingAspect — Ghi log tự động qua AOP.
 *
 * Phạm vi:
 *   - Tất cả method trong package controller  → log HTTP request + thời gian thực thi
 *   - Tất cả method trong package service.impl → log tên method + thời gian thực thi
 *
 * Lý do dùng AOP:
 *   - Tách biệt logic nghiệp vụ khỏi logic logging (Single Responsibility)
 *   - Không cần sửa từng class — thêm/xóa logging chỉ cần sửa 1 Aspect
 *   - Đảm bảo tính nhất quán: mọi method đều được log theo cùng format
 */
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // ── Pointcuts ────────────────────────────────────────────────

    @Pointcut("within(me.phuongcm.blog.controller..*)")
    public void controllerLayer() {}

    @Pointcut("within(me.phuongcm.blog.service.impl..*)")
    public void serviceLayer() {}

    // ── Controller Advice ────────────────────────────────────────

    /**
     * Log HTTP request: method, URI, client IP và thời gian thực thi.
     * Không log request body (tránh in ra thông tin nhạy cảm như password).
     */
    @Around("controllerLayer()")
    public Object logController(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        String methodName = sig.getDeclaringType().getSimpleName() + "." + sig.getName();

        HttpServletRequest request = null;
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            request = attrs.getRequest();
        } catch (IllegalStateException ignored) {
            // Không phải web request (e.g. Kafka listener) — bỏ qua
        }

        String httpInfo = request != null
                ? String.format("[%s %s] from %s", request.getMethod(), request.getRequestURI(), request.getRemoteAddr())
                : "[non-HTTP]";

        log.info("→ {} {}", httpInfo, methodName);
        long start = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.info("← {} {} — {}ms", httpInfo, methodName, elapsed);
            return result;
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("✗ {} {} — {}ms | ERROR: {}", httpInfo, methodName, elapsed, ex.getMessage());
            throw ex;
        }
    }

    // ── Service Advice ───────────────────────────────────────────

    /**
     * Log service method: tên method, arguments (sanitized), thời gian thực thi.
     * Argument có chứa "password" sẽ bị che để tránh lộ thông tin.
     */
    @Around("serviceLayer()")
    public Object logService(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        String methodName = sig.getDeclaringType().getSimpleName() + "." + sig.getName();
        String[] paramNames = sig.getParameterNames();
        Object[] args = pjp.getArgs();

        String argsStr = buildSafeArgsString(paramNames, args);
        log.debug("[Service] {} args={}", methodName, argsStr);

        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.debug("[Service] {} — {}ms OK", methodName, elapsed);
            return result;
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn("[Service] {} — {}ms FAILED: {}", methodName, elapsed, ex.getMessage());
            throw ex;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────

    private String buildSafeArgsString(String[] paramNames, Object[] args) {
        if (args == null || args.length == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            String name = (paramNames != null && i < paramNames.length) ? paramNames[i] : "arg" + i;
            if (name.toLowerCase().contains("password") || name.toLowerCase().contains("secret")) {
                sb.append(name).append("=***");
            } else {
                sb.append(name).append("=").append(truncate(args[i]));
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private String truncate(Object obj) {
        if (obj == null) return "null";
        String str = obj.toString();
        return str.length() > 100 ? str.substring(0, 100) + "..." : str;
    }
}
