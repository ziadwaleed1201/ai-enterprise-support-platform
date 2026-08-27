package com.supportai.backend.ticket;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping(
            value = "/{ticketId}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<TicketAttachmentResponse> uploadAttachment(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                attachmentService.uploadAttachment(
                        ticketId,
                        file,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/{ticketId}/attachments")
    public ResponseEntity<List<TicketAttachmentResponse>> getAttachments(
            @PathVariable Long ticketId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                attachmentService.getAttachments(
                        ticketId,
                        authentication.getName()
                )
        );
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            Authentication authentication
    ) {

        Resource resource =
                attachmentService.downloadAttachment(
                        attachmentId,
                        authentication.getName()
                );

        TicketAttachment metadata =
                attachmentService.getAttachmentMetadata(
                        attachmentId
                );

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                metadata.getContentType()
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\""
                                + metadata.getOriginalFileName()
                                + "\""
                )
                .body(resource);
    }
}