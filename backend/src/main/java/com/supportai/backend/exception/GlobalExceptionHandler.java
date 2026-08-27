package com.supportai.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(
            ForbiddenException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.FORBIDDEN,
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.FORBIDDEN,
                "You are not authorized to perform this action",
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(
            AuthenticationException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Authentication is required",
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
            BadRequestException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(
            ConflictException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {

        Map<String, String> validationErrors =
                new LinkedHashMap<>();

        for (FieldError error :
                exception.getBindingResult().getFieldErrors()) {

            validationErrors.put(
                    error.getField(),
                    error.getDefaultMessage()
            );
        }

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                request.getRequestURI(),
                validationErrors
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request.getRequestURI(),
                null
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            String path,
            Map<String, String> validationErrors
    ) {

        ApiErrorResponse response =
                ApiErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(status.value())
                        .error(status.getReasonPhrase())
                        .message(message)
                        .path(path)
                        .validationErrors(validationErrors)
                        .build();

        return ResponseEntity
                .status(status)
                .body(response);
    }
}