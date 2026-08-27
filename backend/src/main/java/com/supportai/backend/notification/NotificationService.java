package com.supportai.backend.notification;

import com.supportai.backend.exception.ForbiddenException;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNotification(
            User user,
            String title,
            String message,
            Long ticketId
    ) {

        Notification notification =
                Notification.builder()
                        .user(user)
                        .title(title)
                        .message(message)
                        .ticketId(ticketId)
                        .read(false)
                        .build();

        notificationRepository.save(
                notification
        );
    }

    public List<NotificationResponse> getMyNotifications(
            String userEmail
    ) {

        return notificationRepository
                .findByUserEmailOrderByCreatedAtDesc(
                        userEmail
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public long getUnreadCount(
            String userEmail
    ) {

        return notificationRepository
                .countByUserEmailAndReadFalse(
                        userEmail
                );
    }

    public NotificationResponse markAsRead(
            Long notificationId,
            String userEmail
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Notification not found"
                                )
                        );

        if (!notification.getUser()
                .getEmail()
                .equals(userEmail)) {

            throw new ForbiddenException(
                    "You are not allowed to access this notification"
            );
        }

        notification.setRead(true);

        return mapToResponse(
                notificationRepository.save(
                        notification
                )
        );
    }

    private NotificationResponse mapToResponse(
            Notification notification
    ) {

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead())
                .ticketId(
                        notification.getTicketId()
                )
                .createdAt(
                        notification.getCreatedAt()
                )
                .build();
    }
}