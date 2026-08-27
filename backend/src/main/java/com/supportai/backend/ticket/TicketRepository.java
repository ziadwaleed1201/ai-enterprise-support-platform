package com.supportai.backend.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TicketRepository
        extends JpaRepository<Ticket, Long>,
        JpaSpecificationExecutor<Ticket> {

    List<Ticket> findByCreatedByEmail(String email);

    List<Ticket> findByAssignedAgentEmail(String email);

    Page<Ticket> findByCreatedByEmail(
            String email,
            Pageable pageable
    );

    Page<Ticket> findByAssignedAgentEmail(
            String email,
            Pageable pageable
    );
}