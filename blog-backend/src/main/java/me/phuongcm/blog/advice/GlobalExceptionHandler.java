package me.phuongcm.blog.advice;

import me.phuongcm.blog.common.exception.BadRequestException;
import me.phuongcm.blog.common.exception.OAuth2AuthenticationProcessingException;
import me.phuongcm.blog.common.exception.ServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ServiceException.class)
    public ResponseEntity<?> handleServiceException(ServiceException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", e.getMessage());
        return ResponseEntity.status(e.getError().getStatus()).body(error);
    }

    @ExceptionHandler(OAuth2AuthenticationProcessingException.class)
    public ResponseEntity<?> handleOAuth2AuthenticationProcessingException(OAuth2AuthenticationProcessingException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequestException(BadRequestException e) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
