package com.supportai.backend.ticket;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    public List<TicketResponse> getMyTickets(String userEmail) {
    return ticketRepository.findByCreatedByEmail(userEmail)
            .stream()
            .map(this::mapToResponse)
            .toList();
}

public TicketResponse getTicketById(Long id, String userEmail) {

    Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    if (!ticket.getCreatedBy().getEmail().equals(userEmail)) {
        throw new RuntimeException("You are not allowed to view this ticket");
    }

    return mapToResponse(ticket);
}

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

        return mapToResponse(savedTicket);
    }

    private TicketResponse mapToResponse(Ticket ticket) {

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
}