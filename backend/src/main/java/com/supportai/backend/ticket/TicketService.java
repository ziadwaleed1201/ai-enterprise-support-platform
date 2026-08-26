package com.supportai.backend.ticket;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketHistoryRepository ticketHistoryRepository;

    public TicketResponse createTicket(
            CreateTicketRequest request,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Department department = departmentRepository
                .findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getDepartment().getId().equals(department.getId())) {
            throw new RuntimeException(
                    "Category does not belong to the selected department"
            );
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .department(department)
                .category(category)
                .createdBy(user)
                .priority(
                        request.getPriority() != null
                                ? request.getPriority()
                                : TicketPriority.MEDIUM
                )
                .status(TicketStatus.NEW)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        recordHistory(
                savedTicket,
                user,
                "TICKET_CREATED",
                "Ticket created by " + user.getEmail()
        );

        return mapToResponse(savedTicket);
    }

    public List<TicketResponse> getMyTickets(String userEmail) {

        return ticketRepository.findByCreatedByEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TicketResponse getTicketById(
            Long id,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner =
                ticket.getCreatedBy().getEmail().equals(userEmail);

        boolean isAssignedAgent =
                ticket.getAssignedAgent() != null
                        && ticket.getAssignedAgent()
                        .getEmail()
                        .equals(userEmail);

        boolean isAdmin =
                user.getRole() == Role.ADMIN;

        if (!isOwner && !isAssignedAgent && !isAdmin) {
            throw new RuntimeException(
                    "You are not allowed to view this ticket"
            );
        }

        return mapToResponse(ticket);
    }

    public TicketResponse assignTicket(
            Long ticketId,
            Long agentId
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if (agent.getRole() != Role.SUPPORT_AGENT
                && agent.getRole() != Role.ADMIN) {

            throw new RuntimeException(
                    "Selected user is not a support agent"
            );
        }

        User previousAgent = ticket.getAssignedAgent();

        ticket.setAssignedAgent(agent);

        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.OPEN);
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        String details;

        if (previousAgent == null) {
            details = "Ticket assigned to " + agent.getEmail();
        } else {
            details =
                    "Ticket reassigned from "
                            + previousAgent.getEmail()
                            + " to "
                            + agent.getEmail();
        }

        recordHistory(
                savedTicket,
                agent,
                "TICKET_ASSIGNED",
                details
        );

        return mapToResponse(savedTicket);
    }

    public TicketResponse updateStatus(
        Long ticketId,
        TicketStatus status,
        String userEmail
) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

    TicketStatus previousStatus = ticket.getStatus();

    ticket.setStatus(status);

    if (status == TicketStatus.RESOLVED) {
        ticket.setResolvedAt(LocalDateTime.now());
    } else {
        ticket.setResolvedAt(null);
    }

    Ticket savedTicket = ticketRepository.save(ticket);

    recordHistory(
            savedTicket,
            user,
            "STATUS_CHANGED",
            "Status changed from "
                    + previousStatus
                    + " to "
                    + status
    );

    return mapToResponse(savedTicket);
}

    public List<TicketResponse> getAssignedTickets(
            String agentEmail
    ) {

        return ticketRepository.findByAssignedAgentEmail(agentEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TicketCommentResponse addComment(
            Long ticketId,
            AddCommentRequest request,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner =
                ticket.getCreatedBy().getEmail().equals(userEmail);

        boolean isAssignedAgent =
                ticket.getAssignedAgent() != null
                        && ticket.getAssignedAgent()
                        .getEmail()
                        .equals(userEmail);

        boolean isAdmin =
                user.getRole() == Role.ADMIN;

        if (!isOwner && !isAssignedAgent && !isAdmin) {
            throw new RuntimeException(
                    "You are not allowed to comment on this ticket"
            );
        }

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(user)
                .message(request.getMessage())
                .build();

        TicketComment savedComment =
                ticketCommentRepository.save(comment);

        recordHistory(
                ticket,
                user,
                "COMMENT_ADDED",
                "Comment added by " + user.getEmail()
        );

        return mapCommentToResponse(savedComment);
    }

    public List<TicketCommentResponse> getComments(
            Long ticketId,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner =
                ticket.getCreatedBy().getEmail().equals(userEmail);

        boolean isAssignedAgent =
                ticket.getAssignedAgent() != null
                        && ticket.getAssignedAgent()
                        .getEmail()
                        .equals(userEmail);

        boolean isAdmin =
                user.getRole() == Role.ADMIN;

        if (!isOwner && !isAssignedAgent && !isAdmin) {
            throw new RuntimeException(
                    "You are not allowed to view these comments"
            );
        }

        return ticketCommentRepository
                .findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapCommentToResponse)
                .toList();
    }

    public List<TicketHistoryResponse> getHistory(
            Long ticketId,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner =
                ticket.getCreatedBy().getEmail().equals(userEmail);

        boolean isAssignedAgent =
                ticket.getAssignedAgent() != null
                        && ticket.getAssignedAgent()
                        .getEmail()
                        .equals(userEmail);

        boolean isAdmin =
                user.getRole() == Role.ADMIN;

        if (!isOwner && !isAssignedAgent && !isAdmin) {
            throw new RuntimeException(
                    "You are not allowed to view this ticket history"
            );
        }

        return ticketHistoryRepository
                .findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(history ->
                        TicketHistoryResponse.builder()
                                .id(history.getId())
                                .action(history.getAction())
                                .details(history.getDetails())
                                .performedBy(
                                        history.getPerformedBy() != null
                                                ? history.getPerformedBy().getEmail()
                                                : null
                                )
                                .createdAt(history.getCreatedAt())
                                .build()
                )
                .toList();
    }

    private TicketResponse mapToResponse(
            Ticket ticket
    ) {

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .departmentId(ticket.getDepartment().getId())
                .departmentName(ticket.getDepartment().getName())
                .categoryId(ticket.getCategory().getId())
                .categoryName(ticket.getCategory().getName())
                .createdBy(ticket.getCreatedBy().getEmail())
                .assignedAgent(
                        ticket.getAssignedAgent() != null
                                ? ticket.getAssignedAgent().getEmail()
                                : null
                )
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private TicketCommentResponse mapCommentToResponse(
            TicketComment comment
    ) {

        return TicketCommentResponse.builder()
                .id(comment.getId())
                .message(comment.getMessage())
                .authorEmail(comment.getAuthor().getEmail())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private void recordHistory(
            Ticket ticket,
            User performedBy,
            String action,
            String details
    ) {

        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .performedBy(performedBy)
                .action(action)
                .details(details)
                .build();

        ticketHistoryRepository.save(history);
    }
}