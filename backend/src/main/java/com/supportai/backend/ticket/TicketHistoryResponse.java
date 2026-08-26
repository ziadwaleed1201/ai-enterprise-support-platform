package com.supportai.backend.ticket;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TicketHistoryResponse {

    private Long id;
    private String action;
    private String details;
    private String performedBy;
    private LocalDateTime createdAt;
}