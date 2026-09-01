package com.supportai.backend.ticket;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import com.supportai.backend.exception.BadRequestException;
import com.supportai.backend.exception.ForbiddenException;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.notification.NotificationService;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final NotificationService notificationService;

@Transactional
    public TicketResponse createTicket(
            CreateTicketRequest request,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Department department = departmentRepository
                .findById(request.getDepartmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department not found"));

        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Category not found"));

        if (!category.getDepartment()
                .getId()
                .equals(department.getId())) {

            throw new BadRequestException(
                    "Category does not belong to the selected department"
            );
        }

        TicketPriority priority =
                request.getPriority() != null
                        ? request.getPriority()
                        : TicketPriority.MEDIUM;

        LocalDateTime now = LocalDateTime.now();

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .department(department)
                .category(category)
                .createdBy(user)
                .priority(priority)
                .status(TicketStatus.NEW)
                .responseDueAt(
                        now.plusHours(
                                getResponseSlaHours(priority)
                        )
                )
                .resolutionDueAt(
                        now.plusHours(
                                getResolutionSlaHours(priority)
                        )
                )
                .build();

        Ticket savedTicket =
                ticketRepository.save(ticket);

        recordHistory(
                savedTicket,
                user,
                "TICKET_CREATED",
                "Ticket created by " + user.getEmail()
        );

        notificationService.createNotification(
                user,
                "Ticket Created",
                "Your ticket \"" + savedTicket.getTitle()
                        + "\" was created successfully.",
                savedTicket.getId()
        );

        return mapToResponse(savedTicket);
    }

    public List<TicketResponse> getMyTickets(
            String userEmail
    ) {

        return ticketRepository
                .findByCreatedByEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TicketResponse getTicketById(
            Long id,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        validateTicketAccess(ticket, user);

        return mapToResponse(ticket);
    }
@Transactional
    public TicketResponse assignTicket(
            Long ticketId,
            Long agentId
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User agent = userRepository.findById(agentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Agent not found"));

        if (agent.getRole() != Role.SUPPORT_AGENT
                && agent.getRole() != Role.ADMIN) {

            throw new BadRequestException(
                    "Selected user is not a support agent"
            );
        }

        if (!agent.isEnabled()) {
            throw new BadRequestException(
                    "Selected support agent is disabled"
            );
        }

        User previousAgent =
                ticket.getAssignedAgent();

        ticket.setAssignedAgent(agent);

        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.OPEN);
        }

        Ticket savedTicket =
                ticketRepository.save(ticket);

        String details;

        if (previousAgent == null) {

            details =
                    "Ticket assigned to "
                            + agent.getEmail();

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

        notificationService.createNotification(
                agent,
                "Ticket Assigned",
                "Ticket #" + savedTicket.getId()
                        + " has been assigned to you.",
                savedTicket.getId()
        );

        return mapToResponse(savedTicket);
    }
@Transactional
    public TicketResponse updateStatus(
            Long ticketId,
            TicketStatus status,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        TicketStatus previousStatus =
                ticket.getStatus();

        if (previousStatus == status) {
            throw new BadRequestException(
                    "Ticket is already in status " + status
            );
        }

        ticket.setStatus(status);

        if (ticket.getFirstRespondedAt() == null
                && (user.getRole() == Role.SUPPORT_AGENT
                || user.getRole() == Role.ADMIN)
                && status != TicketStatus.NEW) {

            ticket.setFirstRespondedAt(
                    LocalDateTime.now()
            );
        }

        if (status == TicketStatus.RESOLVED) {

            ticket.setResolvedAt(
                    LocalDateTime.now()
            );

        } else if (status != TicketStatus.CLOSED) {

            ticket.setResolvedAt(null);
        }

        Ticket savedTicket =
                ticketRepository.save(ticket);

        recordHistory(
                savedTicket,
                user,
                "STATUS_CHANGED",
                "Status changed from "
                        + previousStatus
                        + " to "
                        + status
        );

        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Ticket Status Updated",
                "Ticket #" + ticket.getId()
                        + " status changed from "
                        + previousStatus
                        + " to "
                        + status
                        + ".",
                ticket.getId()
        );

        return mapToResponse(savedTicket);
    }

    public List<TicketResponse> getAssignedTickets(
            String agentEmail
    ) {

        return ticketRepository
                .findByAssignedAgentEmail(agentEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TicketPageResponse searchTickets(
            TicketStatus status,
            TicketPriority priority,
            Long departmentId,
            String agentEmail,
            String employeeEmail,
            String search,
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        if (page < 0) {
            throw new BadRequestException(
                    "Page number cannot be negative"
            );
        }

        if (size < 1 || size > 100) {
            throw new BadRequestException(
                    "Page size must be between 1 and 100"
            );
        }

        List<String> allowedSortFields =
                List.of(
                        "id",
                        "createdAt",
                        "updatedAt",
                        "priority",
                        "status"
                );

        if (!allowedSortFields.contains(sortBy)) {
            throw new BadRequestException(
                    "Invalid sort field"
            );
        }

        Sort.Direction sortDirection;

        if ("asc".equalsIgnoreCase(direction)) {

            sortDirection = Sort.Direction.ASC;

        } else if ("desc".equalsIgnoreCase(direction)) {

            sortDirection = Sort.Direction.DESC;

        } else {

            throw new BadRequestException(
                    "Sort direction must be asc or desc"
            );
        }

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                sortDirection,
                                sortBy
                        )
                );

        Specification<Ticket> specification =
                Specification
                        .where(
                                TicketSpecification
                                        .hasStatus(status)
                        )
                        .and(
                                TicketSpecification
                                        .hasPriority(priority)
                        )
                        .and(
                                TicketSpecification
                                        .hasDepartment(departmentId)
                        )
                        .and(
                                TicketSpecification
                                        .assignedTo(agentEmail)
                        )
                        .and(
                                TicketSpecification
                                        .createdBy(employeeEmail)
                        )
                        .and(
                                TicketSpecification
                                        .containsSearchText(search)
                        );

        Page<Ticket> result =
                ticketRepository.findAll(
                        specification,
                        pageable
                );

        return TicketPageResponse.builder()
                .tickets(
                        result.getContent()
                                .stream()
                                .map(this::mapToResponse)
                                .toList()
                )
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(
                        result.getTotalElements()
                )
                .totalPages(
                        result.getTotalPages()
                )
                .first(result.isFirst())
                .last(result.isLast())
                .build();
    }
@Transactional
    public TicketCommentResponse addComment(
            Long ticketId,
            AddCommentRequest request,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        validateTicketAccess(ticket, user);

        TicketComment comment =
                TicketComment.builder()
                        .ticket(ticket)
                        .author(user)
                        .message(request.getMessage())
                        .build();

        TicketComment savedComment =
                ticketCommentRepository.save(comment);

        if (ticket.getFirstRespondedAt() == null
                && (user.getRole() == Role.SUPPORT_AGENT
                || user.getRole() == Role.ADMIN)) {

            ticket.setFirstRespondedAt(
                    LocalDateTime.now()
            );

            ticketRepository.save(ticket);

            recordHistory(
                    ticket,
                    user,
                    "FIRST_RESPONSE",
                    "First support response provided by "
                            + user.getEmail()
            );
        }

        recordHistory(
                ticket,
                user,
                "COMMENT_ADDED",
                "Comment added by "
                        + user.getEmail()
        );

        if (user.getRole() == Role.EMPLOYEE) {

            if (ticket.getAssignedAgent() != null) {

                notificationService.createNotification(
                        ticket.getAssignedAgent(),
                        "New Ticket Comment",
                        "A new comment was added to ticket #"
                                + ticket.getId()
                                + " by "
                                + user.getEmail()
                                + ".",
                        ticket.getId()
                );
            }

        } else {

            notificationService.createNotification(
                    ticket.getCreatedBy(),
                    "Support Reply",
                    "A support agent replied to ticket #"
                            + ticket.getId()
                            + ".",
                    ticket.getId()
            );
        }

        return mapCommentToResponse(
                savedComment
        );
    }

    public List<TicketCommentResponse> getComments(
            Long ticketId,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        validateTicketAccess(ticket, user);

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
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        validateTicketAccess(ticket, user);

        return ticketHistoryRepository
                .findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(history ->
                        TicketHistoryResponse.builder()
                                .id(history.getId())
                                .action(
                                        history.getAction()
                                )
                                .details(
                                        history.getDetails()
                                )
                                .performedBy(
                                        history.getPerformedBy() != null
                                                ? history.getPerformedBy()
                                                .getEmail()
                                                : null
                                )
                                .createdAt(
                                        history.getCreatedAt()
                                )
                                .build()
                )
                .toList();
    }

    private void validateTicketAccess(
        Ticket ticket,
        User user
) {

    String userEmail =
            user.getEmail();

    boolean isOwner =
            ticket.getCreatedBy()
                    .getEmail()
                    .equals(userEmail);

    boolean isAssignedAgent =
            ticket.getAssignedAgent() != null
                    && ticket.getAssignedAgent()
                    .getEmail()
                    .equals(userEmail);

    boolean isSupportAgent =
            user.getRole() == Role.SUPPORT_AGENT;

    boolean isAdmin =
            user.getRole() == Role.ADMIN;

    if (!isOwner
            && !isAssignedAgent
            && !isSupportAgent
            && !isAdmin) {

        throw new ForbiddenException(
                "You are not allowed to access this ticket"
        );
    }
}

    private long getResponseSlaHours(
            TicketPriority priority
    ) {

        return switch (priority) {
            case LOW -> 8;
            case MEDIUM -> 4;
            case HIGH -> 2;
            case CRITICAL -> 1;
        };
    }

    private long getResolutionSlaHours(
            TicketPriority priority
    ) {

        return switch (priority) {
            case LOW -> 72;
            case MEDIUM -> 48;
            case HIGH -> 24;
            case CRITICAL -> 8;
        };
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

    private TicketResponse mapToResponse(
            Ticket ticket
    ) {

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(
                        ticket.getDescription()
                )
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .departmentId(
                        ticket.getDepartment()
                                .getId()
                )
                .departmentName(
                        ticket.getDepartment()
                                .getName()
                )
                .categoryId(
                        ticket.getCategory()
                                .getId()
                )
                .categoryName(
                        ticket.getCategory()
                                .getName()
                )
                .createdBy(
                        ticket.getCreatedBy()
                                .getEmail()
                )
                .assignedAgent(
                        ticket.getAssignedAgent() != null
                                ? ticket.getAssignedAgent()
                                .getEmail()
                                : null
                )
                .responseDueAt(
                        ticket.getResponseDueAt()
                )
                .resolutionDueAt(
                        ticket.getResolutionDueAt()
                )
                .firstRespondedAt(
                        ticket.getFirstRespondedAt()
                )
                .resolvedAt(
                        ticket.getResolvedAt()
                )
                .responseOverdue(
                        isResponseOverdue(ticket)
                )
                .resolutionOverdue(
                        isResolutionOverdue(ticket)
                )
                .createdAt(
                        ticket.getCreatedAt()
                )
                .updatedAt(
                        ticket.getUpdatedAt()
                )
                .build();
    }

    private TicketCommentResponse mapCommentToResponse(
            TicketComment comment
    ) {

        return TicketCommentResponse.builder()
                .id(comment.getId())
                .message(comment.getMessage())
                .authorEmail(
                        comment.getAuthor()
                                .getEmail()
                )
                .createdAt(
                        comment.getCreatedAt()
                )
                .build();
    }

    private void recordHistory(
            Ticket ticket,
            User performedBy,
            String action,
            String details
    ) {

        TicketHistory history =
                TicketHistory.builder()
                        .ticket(ticket)
                        .performedBy(performedBy)
                        .action(action)
                        .details(details)
                        .build();

        ticketHistoryRepository.save(history);
    }
}