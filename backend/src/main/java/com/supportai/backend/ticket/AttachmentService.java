package com.supportai.backend.ticket;

import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final UserRepository userRepository;

    private final Path uploadDirectory =
            Paths.get("uploads").toAbsolutePath().normalize();

    public TicketAttachmentResponse uploadAttachment(
            Long ticketId,
            MultipartFile file,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateTicketAccess(ticket, user);

        if (file.isEmpty()) {
            throw new RuntimeException("File cannot be empty");
        }

        try {
            Files.createDirectories(uploadDirectory);

            String originalFileName = file.getOriginalFilename();

            if (originalFileName == null || originalFileName.isBlank()) {
                originalFileName = "attachment";
            }

            String storedFileName =
                    UUID.randomUUID() + "_" + originalFileName;

            Path targetLocation =
                    uploadDirectory.resolve(storedFileName);

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            TicketAttachment attachment =
                    TicketAttachment.builder()
                            .ticket(ticket)
                            .uploadedBy(user)
                            .originalFileName(originalFileName)
                            .storedFileName(storedFileName)
                            .contentType(
                                    file.getContentType() != null
                                            ? file.getContentType()
                                            : "application/octet-stream"
                            )
                            .fileSize(file.getSize())
                            .build();

            TicketAttachment savedAttachment =
                    ticketAttachmentRepository.save(attachment);

            recordHistory(
                    ticket,
                    user,
                    "ATTACHMENT_ADDED",
                    "Attachment added: " + originalFileName
            );

            return mapToResponse(savedAttachment);

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to store attachment",
                    e
            );
        }
    }

    public List<TicketAttachmentResponse> getAttachments(
            Long ticketId,
            String userEmail
    ) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateTicketAccess(ticket, user);

        return ticketAttachmentRepository
                .findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Resource downloadAttachment(
            Long attachmentId,
            String userEmail
    ) {

        TicketAttachment attachment =
                ticketAttachmentRepository.findById(attachmentId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Attachment not found"
                                )
                        );

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateTicketAccess(
                attachment.getTicket(),
                user
        );

        try {
            Path filePath =
                    uploadDirectory.resolve(
                            attachment.getStoredFileName()
                    );

            Resource resource =
                    new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new RuntimeException(
                        "Attachment file not found"
                );
            }

            return resource;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to load attachment",
                    e
            );
        }
    }

    public TicketAttachment getAttachmentMetadata(
            Long attachmentId
    ) {
        return ticketAttachmentRepository
                .findById(attachmentId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Attachment not found"
                        )
                );
    }

    private void validateTicketAccess(
            Ticket ticket,
            User user
    ) {

        String userEmail = user.getEmail();

        boolean isOwner =
                ticket.getCreatedBy()
                        .getEmail()
                        .equals(userEmail);

        boolean isAssignedAgent =
                ticket.getAssignedAgent() != null
                        && ticket.getAssignedAgent()
                        .getEmail()
                        .equals(userEmail);

        boolean isAdmin =
                user.getRole() == Role.ADMIN;

        if (!isOwner && !isAssignedAgent && !isAdmin) {
            throw new RuntimeException(
                    "You are not allowed to access attachments for this ticket"
            );
        }
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

    private TicketAttachmentResponse mapToResponse(
            TicketAttachment attachment
    ) {

        return TicketAttachmentResponse.builder()
                .id(attachment.getId())
                .originalFileName(
                        attachment.getOriginalFileName()
                )
                .contentType(
                        attachment.getContentType()
                )
                .fileSize(
                        attachment.getFileSize()
                )
                .uploadedBy(
                        attachment.getUploadedBy().getEmail()
                )
                .createdAt(
                        attachment.getCreatedAt()
                )
                .build();
    }
}