package com.supportai.backend.ticket;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TicketPageResponse {

    private List<TicketResponse> tickets;

    private int page;
    private int size;

    private long totalElements;
    private int totalPages;

    private boolean first;
    private boolean last;
}