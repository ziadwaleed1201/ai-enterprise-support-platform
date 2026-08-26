package com.supportai.backend.ticket;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TicketCommentResponse {

    private Long id;
    private String message;
    private String authorEmail;
    private LocalDateTime createdAt;
}