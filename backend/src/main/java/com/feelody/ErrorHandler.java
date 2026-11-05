package com.feelody;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import java.util.Map;

@RestControllerAdvice
public class ErrorHandler {
    @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e) { return ResponseEntity.status(e.status).body(Map.of("message", e.getMessage())); }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, MissingServletRequestPartException.class}) ResponseEntity<?> input(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", "1~500자의 글 또는 음성 파일을 보내주세요."));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class) ResponseEntity<?> size(Exception e) { return ResponseEntity.status(413).body(Map.of("message", "10MB 이하의 음성을 보내주세요.")); }
    @ExceptionHandler(Exception.class) ResponseEntity<?> unknown(Exception e) { return ResponseEntity.status(500).body(Map.of("message", "처리 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.")); }
}
