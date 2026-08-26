package com.supportai.backend.ticket;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;

    private Long departmentId;
    private String departmentName;

    private Long categoryId;
    private String categoryName;

    private String createdBy;
    private String assignedAgent;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}