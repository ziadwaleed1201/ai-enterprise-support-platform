package com.supportai.backend.ticket;

import com.supportai.backend.exception.BadRequestException;
import com.supportai.backend.exception.ForbiddenException;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.user.Role;
import com.supportai.backend.user.User;
import com.supportai.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final UserRepository userRepository;

    private final Path uploadDirectory =
            Paths.get("uploads")
                    .toAbsolutePath()
                    .normalize();

    @Transactional
    public TicketAttachmentResponse uploadAttachment(
            Long ticketId,
            MultipartFile file,
            String userEmail
    ) {

        Ticket ticket =
                ticketRepository.findById(ticketId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Ticket not found"
                                )
                        );

        User user =
                userRepository.findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        validateTicketAccess(
                ticket,
                user
        );

        if (file.isEmpty()) {
            throw new BadRequestException(
                    "File cannot be empty"
            );
        }

        try {

            Files.createDirectories(
                    uploadDirectory
            );

            String originalFileName =
                    file.getOriginalFilename();

            if (originalFileName == null
                    || originalFileName.isBlank()) {

                originalFileName =
                        "attachment";
            }

            String safeOriginalFileName =
                    Path.of(originalFileName)
                            .getFileName()
                            .toString();

            String storedFileName =
                    UUID.randomUUID()
                            + "_"
                            + safeOriginalFileName;

            Path targetLocation =
                    uploadDirectory
                            .resolve(storedFileName)
                            .normalize();

            if (!targetLocation.startsWith(
                    uploadDirectory
            )) {

                throw new BadRequestException(
                        "Invalid file name"
                );
            }

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            TicketAttachment attachment =
                    TicketAttachment.builder()
                            .ticket(ticket)
                            .uploadedBy(user)
                            .originalFileName(
                                    safeOriginalFileName
                            )
                            .storedFileName(
                                    storedFileName
                            )
                            .contentType(
                                    file.getContentType() != null
                                            ? file.getContentType()
                                            : "application/octet-stream"
                            )
                            .fileSize(
                                    file.getSize()
                            )
                            .build();

            TicketAttachment savedAttachment =
                    ticketAttachmentRepository
                            .save(attachment);

            recordHistory(
                    ticket,
                    user,
                    "ATTACHMENT_ADDED",
                    "Attachment added: "
                            + safeOriginalFileName
            );

            return mapToResponse(
                    savedAttachment
            );

        } catch (IOException exception) {

            throw new RuntimeException(
                    "Failed to store attachment",
                    exception
            );
        }
    }

    public List<TicketAttachmentResponse> getAttachments(
            Long ticketId,
            String userEmail
    ) {

        Ticket ticket =
                ticketRepository.findById(ticketId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Ticket not found"
                                )
                        );

        User user =
                userRepository.findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        validateTicketAccess(
                ticket,
                user
        );

        return ticketAttachmentRepository
                .findByTicketIdOrderByCreatedAtAsc(
                        ticketId
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Resource downloadAttachment(
            Long attachmentId,
            String userEmail
    ) {

        TicketAttachment attachment =
                ticketAttachmentRepository
                        .findById(attachmentId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Attachment not found"
                                )
                        );

        User user =
                userRepository.findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        validateTicketAccess(
                attachment.getTicket(),
                user
        );

        Path filePath =
                uploadDirectory
                        .resolve(
                                attachment.getStoredFileName()
                        )
                        .normalize();

        if (!filePath.startsWith(uploadDirectory)) {
            throw new BadRequestException(
                    "Invalid attachment path"
            );
        }

        try {

            Resource resource =
                    new UrlResource(
                            filePath.toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                throw new ResourceNotFoundException(
                        "Attachment file not found"
                );
            }

            return resource;

        } catch (MalformedURLException exception) {

            throw new ResourceNotFoundException(
                    "Attachment file not found"
            );
        }
    }

    public TicketAttachment getAttachmentMetadata(
            Long attachmentId
    ) {

        return ticketAttachmentRepository
                .findById(attachmentId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Attachment not found"
                        )
                );
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

        TicketHistory history =
                TicketHistory.builder()
                        .ticket(ticket)
                        .performedBy(performedBy)
                        .action(action)
                        .details(details)
                        .build();

        ticketHistoryRepository.save(
                history
        );
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
                        attachment.getUploadedBy()
                                .getEmail()
                )
                .createdAt(
                        attachment.getCreatedAt()
                )
                .build();
    }
}