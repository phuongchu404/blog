package me.phuongcm.blog.advice;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(Integer status, String error, String message, List<FieldErrorResponse> fieldErrors, String path, Instant  timestamp) {
}
