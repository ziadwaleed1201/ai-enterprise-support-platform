package com.supportai.backend.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedByEmail(String email);

    List<Ticket> findByAssignedAgentEmail(String email);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByDepartmentId(Long departmentId);
}