package com.supportai.backend.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository
        extends JpaRepository<TicketAttachment, Long> {

    List<TicketAttachment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}