package com.supportai.backend.dashboard;

import com.supportai.backend.ticket.Ticket;
import com.supportai.backend.ticket.TicketPriority;
import com.supportai.backend.ticket.TicketRepository;
import com.supportai.backend.ticket.TicketStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final TicketRepository ticketRepository;

    public DashboardResponse getDashboard() {

        List<Ticket> tickets = ticketRepository.findAll();

        long totalTickets = tickets.size();

        long newTickets = countByStatus(
                tickets,
                TicketStatus.NEW
        );

        long openTickets = countByStatus(
                tickets,
                TicketStatus.OPEN
        );

        long inProgressTickets = countByStatus(
                tickets,
                TicketStatus.IN_PROGRESS
        );

        long resolvedTickets = countByStatus(
                tickets,
                TicketStatus.RESOLVED
        );

        long closedTickets = countByStatus(
                tickets,
                TicketStatus.CLOSED
        );

        long overdueResponses = tickets.stream()
                .filter(this::isResponseOverdue)
                .count();

        long overdueResolutions = tickets.stream()
                .filter(this::isResolutionOverdue)
                .count();

        Map<String, Long> ticketsByPriority =
                buildPriorityBreakdown(tickets);

        Map<String, Long> ticketsByDepartment =
                tickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket ->
                                                ticket.getDepartment()
                                                        .getName(),
                                        LinkedHashMap::new,
                                        Collectors.counting()
                                )
                        );

        Map<String, Long> agentWorkload =
                tickets.stream()
                        .filter(
                                ticket ->
                                        ticket.getAssignedAgent() != null
                        )
                        .filter(
                                ticket ->
                                        ticket.getStatus()
                                                != TicketStatus.RESOLVED
                                                && ticket.getStatus()
                                                != TicketStatus.CLOSED
                                                && ticket.getStatus()
                                                != TicketStatus.CANCELLED
                        )
                        .collect(
                                Collectors.groupingBy(
                                        ticket ->
                                                ticket.getAssignedAgent()
                                                        .getEmail(),
                                        LinkedHashMap::new,
                                        Collectors.counting()
                                )
                        );

        return DashboardResponse.builder()
                .totalTickets(totalTickets)
                .newTickets(newTickets)
                .openTickets(openTickets)
                .inProgressTickets(inProgressTickets)
                .resolvedTickets(resolvedTickets)
                .closedTickets(closedTickets)
                .overdueResponses(overdueResponses)
                .overdueResolutions(overdueResolutions)
                .ticketsByPriority(ticketsByPriority)
                .ticketsByDepartment(ticketsByDepartment)
                .agentWorkload(agentWorkload)
                .build();
    }

    private long countByStatus(
            List<Ticket> tickets,
            TicketStatus status
    ) {

        return tickets.stream()
                .filter(ticket -> ticket.getStatus() == status)
                .count();
    }

    private Map<String, Long> buildPriorityBreakdown(
            List<Ticket> tickets
    ) {

        Map<String, Long> result =
                new LinkedHashMap<>();

        for (TicketPriority priority :
                TicketPriority.values()) {

            long count =
                    tickets.stream()
                            .filter(
                                    ticket ->
                                            ticket.getPriority()
                                                    == priority
                            )
                            .count();

            result.put(
                    priority.name(),
                    count
            );
        }

        return result;
    }

    private boolean isResponseOverdue(
            Ticket ticket
    ) {

        if (ticket.getResponseDueAt() == null) {
            return false;
        }

        if (ticket.getFirstRespondedAt() != null) {
            return ticket.getFirstRespondedAt()
                    .isAfter(
                            ticket.getResponseDueAt()
                    );
        }

        return LocalDateTime.now()
                .isAfter(
                        ticket.getResponseDueAt()
                );
    }

    private boolean isResolutionOverdue(
            Ticket ticket
    ) {

        if (ticket.getResolutionDueAt() == null) {
            return false;
        }

        if (ticket.getResolvedAt() != null) {
            return ticket.getResolvedAt()
                    .isAfter(
                            ticket.getResolutionDueAt()
                    );
        }

        if (ticket.getStatus() == TicketStatus.CLOSED
                || ticket.getStatus() == TicketStatus.CANCELLED) {

            return false;
        }

        return LocalDateTime.now()
                .isAfter(
                        ticket.getResolutionDueAt()
                );
    }
}