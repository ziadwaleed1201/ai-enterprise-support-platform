package com.supportai.backend.ticket;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.createTicket(
                        request,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.getMyTickets(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMIN')")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.getAssignedTickets(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMIN')")
    public ResponseEntity<TicketPageResponse> searchTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String agentEmail,
            @RequestParam(required = false) String employeeEmail,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(
                ticketService.searchTickets(
                        status,
                        priority,
                        departmentId,
                        agentEmail,
                        employeeEmail,
                        search,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.getTicketById(
                        id,
                        authentication.getName()
                )
        );
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMIN')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request
    ) {
        return ResponseEntity.ok(
                ticketService.assignTicket(
                        id,
                        request.getAgentId()
                )
        );
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMIN')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.updateStatus(
                        id,
                        request.getStatus(),
                        authentication.getName()
                )
        );
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.addComment(
                        id,
                        request,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketCommentResponse>> getComments(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.getComments(
                        id,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryResponse>> getHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.getHistory(
                        id,
                        authentication.getName()
                )
        );
    }
}