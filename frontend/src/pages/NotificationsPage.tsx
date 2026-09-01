import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Notification } from "../types/notification";

function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [markingReadId, setMarkingReadId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await api.get<Notification[]>(
          "/notifications"
        );

        if (active) {
          setNotifications(response.data);
        }
      } catch {
        if (active) {
          setError("Unable to load notifications.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleMarkAsRead = async (
    notification: Notification
  ) => {
    if (notification.read) {
      return;
    }

    try {
      setMarkingReadId(notification.id);
      setError("");

      const response = await api.put<Notification>(
        `/notifications/${notification.id}/read`
      );

      setNotifications((currentNotifications) =>
        currentNotifications.map(
          (currentNotification) =>
            currentNotification.id === notification.id
              ? response.data
              : currentNotification
        )
      );
    } catch {
      setError(
        "Unable to mark notification as read."
      );
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleOpenNotification = async (
    notification: Notification
  ) => {
    if (!notification.read) {
      await handleMarkAsRead(notification);
    }

    if (notification.ticketId) {
      navigate(
        `/tickets/${notification.ticketId}`
      );
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const readCount =
    notifications.length - unreadCount;

  const getNotificationIcon = (
    notification: Notification
  ) => {
    const text =
      `${notification.title} ${notification.message}`.toLowerCase();

    if (text.includes("created")) {
      return "+";
    }

    if (
      text.includes("status") ||
      text.includes("updated")
    ) {
      return "↗";
    }

    if (
      text.includes("comment") ||
      text.includes("message")
    ) {
      return "✦";
    }

    if (
      text.includes("resolved") ||
      text.includes("closed")
    ) {
      return "✓";
    }

    if (text.includes("assign")) {
      return "◎";
    }

    return "◌";
  };

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />
        <span>Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="page-container notifications-page">
      <div className="notifications-header">
        <div>
          <span className="dashboard-kicker">
            ACTIVITY CENTER
          </span>

          <h1>Notifications</h1>

          <p>
            Stay informed about updates and activity
            across your support requests.
          </p>
        </div>

        <div className="notifications-header-status">
          <span
            className={
              unreadCount > 0
                ? "notification-live-dot"
                : "notification-live-dot all-read"
            }
          />

          {unreadCount > 0
            ? `${unreadCount} unread`
            : "You're all caught up"}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="notification-summary-grid">
        <div className="notification-summary-card notification-summary-total">
          <div className="notification-summary-icon">
            ◌
          </div>

          <div>
            <span>Total Notifications</span>
            <strong>
              {notifications.length}
            </strong>
            <small>
              All recent activity
            </small>
          </div>
        </div>

        <div className="notification-summary-card notification-summary-unread">
          <div className="notification-summary-icon">
            ✦
          </div>

          <div>
            <span>Unread</span>
            <strong>{unreadCount}</strong>
            <small>
              Require your attention
            </small>
          </div>
        </div>

        <div className="notification-summary-card notification-summary-read">
          <div className="notification-summary-icon">
            ✓
          </div>

          <div>
            <span>Read</span>
            <strong>{readCount}</strong>
            <small>
              Already reviewed
            </small>
          </div>
        </div>
      </div>

      <section className="notifications-panel">
        <div className="notifications-panel-header">
          <div>
            <span className="dashboard-kicker">
              RECENT ACTIVITY
            </span>

            <h2>Your notifications</h2>

            <p>
              Updates related to your support
              activity appear here.
            </p>
          </div>

          <span className="notifications-count">
            {notifications.length}{" "}
            {notifications.length === 1
              ? "notification"
              : "notifications"}
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              ✓
            </div>

            <h3>No notifications yet</h3>

            <p>
              When there is activity on your
              support requests, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(
              (notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    notification.read
                      ? "notification-read"
                      : "notification-unread"
                  }`}
                >
                  <div className="notification-card-status">
                    {!notification.read && (
                      <span />
                    )}
                  </div>

                  <div className="notification-card-icon">
                    {getNotificationIcon(
                      notification
                    )}
                  </div>

                  <div className="notification-card-content">
                    <div className="notification-card-top">
                      <div>
                        <div className="notification-title-row">
                          <h3>
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="unread-badge">
                              NEW
                            </span>
                          )}
                        </div>

                        <p>
                          {notification.message}
                        </p>
                      </div>

                      <time>
                        {formatDate(
                          notification.createdAt
                        )}
                      </time>
                    </div>

                    <div className="notification-card-footer">
                      <div className="notification-state">
                        <span
                          className={
                            notification.read
                              ? "notification-state-dot read"
                              : "notification-state-dot unread"
                          }
                        />

                        {notification.read
                          ? "Read"
                          : "Unread"}
                      </div>

                      <div className="notification-actions">
                        {!notification.read && (
                          <button
                            type="button"
                            className="notification-read-button"
                            onClick={() =>
                              void handleMarkAsRead(
                                notification
                              )
                            }
                            disabled={
                              markingReadId ===
                              notification.id
                            }
                          >
                            {markingReadId ===
                            notification.id
                              ? "Marking..."
                              : "Mark as Read"}
                          </button>
                        )}

                        {notification.ticketId && (
                          <button
                            type="button"
                            className="notification-open-button"
                            onClick={() =>
                              void handleOpenNotification(
                                notification
                              )
                            }
                          >
                            Open Ticket
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default NotificationsPage;