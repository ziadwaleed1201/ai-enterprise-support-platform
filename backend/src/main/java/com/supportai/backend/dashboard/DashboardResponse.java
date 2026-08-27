package com.supportai.backend.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class DashboardResponse {

    private long totalTickets;
    private long newTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long closedTickets;

    private long overdueResponses;
    private long overdueResolutions;

    private Map<String, Long> ticketsByPriority;
    private Map<String, Long> ticketsByDepartment;
    private Map<String, Long> agentWorkload;
}