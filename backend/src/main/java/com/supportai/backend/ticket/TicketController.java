package com.supportai.backend.ticket;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

        String userEmail = authentication.getName();

        return ResponseEntity.ok(
                ticketService.createTicket(request, userEmail)
        );
    }
    @GetMapping("/my")
public ResponseEntity<List<TicketResponse>> getMyTickets(
        Authentication authentication
) {

    String userEmail = authentication.getName();

    return ResponseEntity.ok(
            ticketService.getMyTickets(userEmail)
    );
}

@GetMapping("/{id}")
public ResponseEntity<TicketResponse> getTicketById(
        @PathVariable Long id,
        Authentication authentication
) {

    String userEmail = authentication.getName();

    return ResponseEntity.ok(
            ticketService.getTicketById(id, userEmail)
    );
}
}