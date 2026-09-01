import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../auth/useAuth";
import type { Ticket } from "../types/ticket";
import type { TicketComment } from "../types/comment";
import type { TicketAttachment } from "../types/attachment";
import type { TicketHistory } from "../types/history";

const TICKET_STATUSES = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [comments, setComments] =
    useState<TicketComment[]>([]);

  const [attachments, setAttachments] =
    useState<TicketAttachment[]>([]);

  const [history, setHistory] =
    useState<TicketHistory[]>([]);

  const [newComment, setNewComment] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const [loading, setLoading] =
    useState(Boolean(id));

  const [
    submittingComment,
    setSubmittingComment,
  ] = useState(false);

  const [
    uploadingAttachment,
    setUploadingAttachment,
  ] = useState(false);

  const [
    downloadingAttachmentId,
    setDownloadingAttachmentId,
  ] = useState<number | null>(null);

  const [
    assigningTicket,
    setAssigningTicket,
  ] = useState(false);

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [error, setError] = useState(
    id ? "" : "Ticket ID is missing."
  );

  const canManageTicket =
    user?.role === "SUPPORT_AGENT" ||
    user?.role === "ADMIN";

  const backPath =
    user?.role === "EMPLOYEE"
      ? "/tickets/my"
      : "/tickets/all";

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadTicket = async () => {
      try {
        const [
          ticketResponse,
          commentsResponse,
          attachmentsResponse,
          historyResponse,
        ] = await Promise.all([
          api.get<Ticket>(
            `/tickets/${id}`
          ),

          api.get<TicketComment[]>(
            `/tickets/${id}/comments`
          ),

          api.get<TicketAttachment[]>(
            `/tickets/${id}/attachments`
          ),

          api.get<TicketHistory[]>(
            `/tickets/${id}/history`
          ),
        ]);

        if (active) {
          setTicket(ticketResponse.data);
          setComments(commentsResponse.data);
          setAttachments(
            attachmentsResponse.data
          );
          setHistory(historyResponse.data);

          setSelectedStatus(
            ticketResponse.data.status
          );
        }
      } catch {
        if (active) {
          setError(
            "Unable to load ticket details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTicket();

    return () => {
      active = false;
    };
  }, [id]);

  const formatDate = (
    date?: string | null
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(
        1
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const formatAction = (
    action: string
  ) => {
    return action.replaceAll("_", " ");
  };

  const getInitial = (
    value?: string | null
  ) => {
    if (!value) {
      return "?";
    }

    return value.charAt(0).toUpperCase();
  };

  const refreshHistory = async () => {
    if (!id) {
      return;
    }

    const response =
      await api.get<TicketHistory[]>(
        `/tickets/${id}/history`
      );

    setHistory(response.data);
  };

  const handleAssignToMe = async () => {
    if (
      !id ||
      !user ||
      !canManageTicket
    ) {
      return;
    }

    try {
      setAssigningTicket(true);
      setError("");

      const response =
        await api.put<Ticket>(
          `/tickets/${id}/assign`,
          {
            agentId: user.id,
          }
        );

      setTicket(response.data);

      setSelectedStatus(
        response.data.status
      );

      await refreshHistory();
    } catch {
      setError(
        "Unable to assign this ticket."
      );
    } finally {
      setAssigningTicket(false);
    }
  };

  const handleUpdateStatus =
    async () => {
      if (
        !id ||
        !ticket ||
        !canManageTicket ||
        !selectedStatus ||
        selectedStatus === ticket.status
      ) {
        return;
      }

      try {
        setUpdatingStatus(true);
        setError("");

        const response =
          await api.put<Ticket>(
            `/tickets/${id}/status`,
            {
              status: selectedStatus,
            }
          );

        setTicket(response.data);

        setSelectedStatus(
          response.data.status
        );

        await refreshHistory();
      } catch {
        setError(
          "Unable to update ticket status."
        );
      } finally {
        setUpdatingStatus(false);
      }
    };

  const handleAddComment =
    async () => {
      if (!id) {
        return;
      }

      const trimmedComment =
        newComment.trim();

      if (!trimmedComment) {
        return;
      }

      try {
        setSubmittingComment(true);
        setError("");

        const response =
          await api.post<TicketComment>(
            `/tickets/${id}/comments`,
            {
              message: trimmedComment,
            }
          );

        setComments(
          (currentComments) => [
            ...currentComments,
            response.data,
          ]
        );

        setNewComment("");

        await refreshHistory();

        const ticketResponse =
          await api.get<Ticket>(
            `/tickets/${id}`
          );

        setTicket(
          ticketResponse.data
        );

        setSelectedStatus(
          ticketResponse.data.status
        );
      } catch {
        setError(
          "Unable to add comment."
        );
      } finally {
        setSubmittingComment(false);
      }
    };

  const handleUploadAttachment =
    async () => {
      if (!id || !selectedFile) {
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      try {
        setUploadingAttachment(true);
        setError("");

        const response =
          await api.post<TicketAttachment>(
            `/tickets/${id}/attachments`,
            formData
          );

        setAttachments(
          (currentAttachments) => [
            ...currentAttachments,
            response.data,
          ]
        );

        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
        }

        await refreshHistory();
      } catch {
        setError(
          "Unable to upload attachment."
        );
      } finally {
        setUploadingAttachment(false);
      }
    };

  const handleDownloadAttachment =
    async (
      attachment: TicketAttachment
    ) => {
      try {
        setDownloadingAttachmentId(
          attachment.id
        );

        setError("");

        const response =
          await api.get(
            `/tickets/attachments/${attachment.id}/download`,
            {
              responseType: "blob",
            }
          );

        const blob = new Blob(
          [response.data],
          {
            type:
              attachment.contentType ||
              "application/octet-stream",
          }
        );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          attachment.originalFileName;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);
      } catch {
        setError(
          "Unable to download attachment."
        );
      } finally {
        setDownloadingAttachmentId(
          null
        );
      }
    };

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />

        <span>
          Loading ticket...
        </span>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="page-container">
        <div className="ticket-load-error">
          <span>!</span>

          <h2>
            Unable to open ticket
          </h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() =>
              navigate(backPath)
            }
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page-container">
        <div className="ticket-load-error">
          <h2>Ticket not found</h2>

          <button
            className="primary-button"
            onClick={() =>
              navigate(backPath)
            }
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  const assignedToCurrentUser =
    ticket.assignedAgent ===
    user?.email;

  return (
    <div className="page-container ticket-details-page">
      {/* Back navigation */}

      <button
        type="button"
        className="ticket-back-button"
        onClick={() =>
          navigate(backPath)
        }
      >
        <span>←</span>
        Back to Tickets
      </button>

      {/* Ticket hero */}

      <section className="ticket-detail-hero">
        <div className="ticket-detail-hero-main">
          <div className="ticket-detail-id">
            TICKET #{ticket.id}
          </div>

          <h1>{ticket.title}</h1>

          <p>
            {ticket.description}
          </p>

          <div className="ticket-hero-badges">
            <span
              className={`status-badge status-${ticket.status.toLowerCase()}`}
            >
              {ticket.status.replaceAll(
                "_",
                " "
              )}
            </span>

            <span
              className={`priority-badge priority-${ticket.priority.toLowerCase()}`}
            >
              {ticket.priority}
            </span>

            <span className="ticket-department-badge">
              {ticket.departmentName}
            </span>
          </div>
        </div>

        <div className="ticket-hero-meta">
          <span>Created</span>

          <strong>
            {formatDate(
              ticket.createdAt
            )}
          </strong>

          <span>Last updated</span>

          <strong>
            {formatDate(
              ticket.updatedAt
            )}
          </strong>
        </div>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Main layout */}

      <div className="ticket-details-layout">
        {/* Left column */}

        <div className="ticket-details-main">
          {/* Conversation */}

          <section className="ticket-detail-card">
            <div className="ticket-card-header">
              <div>
                <span className="ticket-section-kicker">
                  COMMUNICATION
                </span>

                <h2>Conversation</h2>

                <p>
                  Discussion between the
                  requester and support team.
                </p>
              </div>

              <span className="tickets-count-badge">
                {comments.length}{" "}
                {comments.length === 1
                  ? "message"
                  : "messages"}
              </span>
            </div>

            <div className="ticket-conversation">
              {comments.length === 0 ? (
                <div className="ticket-section-empty">
                  <div className="ticket-empty-icon">
                    ◌
                  </div>

                  <h3>
                    No messages yet
                  </h3>

                  <p>
                    Start the conversation
                    by adding a comment.
                  </p>
                </div>
              ) : (
                comments.map(
                  (comment) => {
                    const isCurrentUser =
                      comment.authorEmail ===
                      user?.email;

                    return (
                      <div
                        key={comment.id}
                        className={`ticket-comment ${
                          isCurrentUser
                            ? "ticket-comment-own"
                            : ""
                        }`}
                      >
                        <div className="ticket-comment-avatar">
                          {getInitial(
                            comment.authorEmail
                          )}
                        </div>

                        <div className="ticket-comment-content">
                          <div className="ticket-comment-meta">
                            <strong>
                              {
                                comment.authorEmail
                              }
                            </strong>

                            <span>
                              {formatDate(
                                comment.createdAt
                              )}
                            </span>
                          </div>

                          <div className="ticket-comment-message">
                            {
                              comment.message
                            }
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            <div className="ticket-comment-composer">
              <label htmlFor="ticket-comment">
                Add Comment
              </label>

              <textarea
                id="ticket-comment"
                value={newComment}
                onChange={(event) =>
                  setNewComment(
                    event.target.value
                  )
                }
                placeholder="Write a comment or update..."
                rows={4}
              />

              <div className="ticket-comment-actions">
                <span>
                  Keep updates clear and
                  relevant to this request.
                </span>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    void handleAddComment()
                  }
                  disabled={
                    submittingComment ||
                    newComment.trim()
                      .length === 0
                  }
                >
                  {submittingComment
                    ? "Sending..."
                    : "Send Comment"}
                </button>
              </div>
            </div>
          </section>

          {/* Attachments */}

          <section className="ticket-detail-card">
            <div className="ticket-card-header">
              <div>
                <span className="ticket-section-kicker">
                  FILES
                </span>

                <h2>Attachments</h2>

                <p>
                  Files shared with this
                  support request.
                </p>
              </div>

              <span className="tickets-count-badge">
                {attachments.length}{" "}
                {attachments.length === 1
                  ? "file"
                  : "files"}
              </span>
            </div>

            <div className="ticket-attachments">
              {attachments.length === 0 ? (
                <div className="ticket-section-empty ticket-section-empty-small">
                  <div className="ticket-empty-icon">
                    ▤
                  </div>

                  <h3>
                    No attachments
                  </h3>

                  <p>
                    Upload files that may
                    help with this request.
                  </p>
                </div>
              ) : (
                attachments.map(
                  (attachment) => (
                    <div
                      key={
                        attachment.id
                      }
                      className="ticket-attachment-row"
                    >
                      <div className="attachment-file-icon">
                        ▤
                      </div>

                      <div className="attachment-details">
                        <strong>
                          {
                            attachment.originalFileName
                          }
                        </strong>

                        <span>
                          {formatFileSize(
                            attachment.fileSize
                          )}{" "}
                          • Uploaded by{" "}
                          {
                            attachment.uploadedBy
                          }
                        </span>

                        <small>
                          {formatDate(
                            attachment.createdAt
                          )}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="attachment-download-button"
                        onClick={() =>
                          void handleDownloadAttachment(
                            attachment
                          )
                        }
                        disabled={
                          downloadingAttachmentId ===
                          attachment.id
                        }
                      >
                        {downloadingAttachmentId ===
                        attachment.id
                          ? "Downloading..."
                          : "Download"}
                      </button>
                    </div>
                  )
                )
              )}

              <div className="ticket-upload-area">
                <div className="ticket-upload-copy">
                  <strong>
                    Upload attachment
                  </strong>

                  <span>
                    Add supporting files to
                    this ticket.
                  </span>
                </div>

                <div className="ticket-upload-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(
                      event
                    ) =>
                      setSelectedFile(
                        event.target
                          .files?.[0] ??
                          null
                      )
                    }
                  />

                  {selectedFile && (
                    <span className="selected-file-info">
                      {
                        selectedFile.name
                      }{" "}
                      (
                      {formatFileSize(
                        selectedFile.size
                      )}
                      )
                    </span>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      void handleUploadAttachment()
                    }
                    disabled={
                      !selectedFile ||
                      uploadingAttachment
                    }
                  >
                    {uploadingAttachment
                      ? "Uploading..."
                      : "Upload"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* History */}

          <section className="ticket-detail-card">
            <div className="ticket-card-header">
              <div>
                <span className="ticket-section-kicker">
                  ACTIVITY
                </span>

                <h2>
                  Ticket History
                </h2>

                <p>
                  Complete activity log for
                  this request.
                </p>
              </div>

              <span className="tickets-count-badge">
                {history.length} events
              </span>
            </div>

            <div className="ticket-history">
              {history.length === 0 ? (
                <div className="ticket-section-empty ticket-section-empty-small">
                  <p>
                    No ticket history yet.
                  </p>
                </div>
              ) : (
                history.map(
                  (
                    historyItem,
                    index
                  ) => (
                    <div
                      key={
                        historyItem.id
                      }
                      className="ticket-history-item"
                    >
                      <div className="history-timeline">
                        <span className="history-dot" />

                        {index !==
                          history.length -
                            1 && (
                          <span className="history-line" />
                        )}
                      </div>

                      <div className="history-content">
                        <div className="history-heading">
                          <strong>
                            {formatAction(
                              historyItem.action
                            )}
                          </strong>

                          <span>
                            {formatDate(
                              historyItem.createdAt
                            )}
                          </span>
                        </div>

                        <p>
                          {
                            historyItem.details
                          }
                        </p>

                        <small>
                          Performed by{" "}
                          <strong>
                            {historyItem.performedBy ??
                              "System"}
                          </strong>
                        </small>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </div>

        {/* Right sidebar */}

        <aside className="ticket-details-sidebar">
          {/* Ticket info */}

          <section className="ticket-side-card">
            <div className="ticket-side-card-header">
              <span className="ticket-section-kicker">
                DETAILS
              </span>

              <h2>Ticket Information</h2>
            </div>

            <div className="ticket-info-list">
              <div className="ticket-info-item">
                <span>Status</span>

                <strong>
                  <span
                    className={`status-badge status-${ticket.status.toLowerCase()}`}
                  >
                    {ticket.status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>
                </strong>
              </div>

              <div className="ticket-info-item">
                <span>Priority</span>

                <strong>
                  <span
                    className={`priority-badge priority-${ticket.priority.toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>
                </strong>
              </div>

              <div className="ticket-info-item">
                <span>Department</span>

                <strong>
                  {ticket.departmentName}
                </strong>
              </div>

              <div className="ticket-info-item">
                <span>Category</span>

                <strong>
                  {ticket.categoryName}
                </strong>
              </div>
            </div>
          </section>

          {/* People */}

          <section className="ticket-side-card">
            <div className="ticket-side-card-header">
              <span className="ticket-section-kicker">
                PEOPLE
              </span>

              <h2>Participants</h2>
            </div>

            <div className="ticket-person">
              <div className="ticket-person-avatar">
                {getInitial(
                  ticket.createdBy
                )}
              </div>

              <div>
                <span>Created by</span>

                <strong>
                  {ticket.createdBy}
                </strong>
              </div>
            </div>

            <div className="ticket-person">
              <div className="ticket-person-avatar ticket-person-avatar-purple">
                {getInitial(
                  ticket.assignedAgent
                )}
              </div>

              <div>
                <span>
                  Assigned agent
                </span>

                <strong>
                  {ticket.assignedAgent ??
                    "Unassigned"}
                </strong>
              </div>
            </div>
          </section>

          {/* Agent actions */}

          {canManageTicket && (
            <section className="ticket-side-card ticket-agent-card">
              <div className="ticket-side-card-header">
                <span className="ticket-section-kicker">
                  SUPPORT CONTROL
                </span>

                <h2>Agent Actions</h2>
              </div>

              {assignedToCurrentUser ? (
                <div className="ticket-assigned-notice">
                  <span>✓</span>

                  <div>
                    <strong>
                      Assigned to you
                    </strong>

                    <small>
                      You are currently
                      handling this ticket.
                    </small>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="primary-button ticket-full-button"
                  onClick={() =>
                    void handleAssignToMe()
                  }
                  disabled={
                    assigningTicket
                  }
                >
                  {assigningTicket
                    ? "Assigning..."
                    : ticket.assignedAgent
                      ? "Reassign to Me"
                      : "Assign to Me"}
                </button>
              )}

              <div className="ticket-status-control">
                <label htmlFor="ticket-status">
                  Change Status
                </label>

                <select
                  id="ticket-status"
                  value={
                    selectedStatus
                  }
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value
                    )
                  }
                >
                  {TICKET_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status.replaceAll(
                          "_",
                          " "
                        )}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="secondary-button ticket-full-button"
                  onClick={() =>
                    void handleUpdateStatus()
                  }
                  disabled={
                    updatingStatus ||
                    selectedStatus ===
                      ticket.status
                  }
                >
                  {updatingStatus
                    ? "Updating..."
                    : "Update Status"}
                </button>
              </div>
            </section>
          )}

          {/* SLA */}

          <section className="ticket-side-card">
            <div className="ticket-side-card-header">
              <span className="ticket-section-kicker">
                SERVICE LEVEL
              </span>

              <h2>SLA Information</h2>
            </div>

            <div className="ticket-sla-list">
              <div
                className={`ticket-sla-item ${
                  ticket.responseOverdue
                    ? "sla-overdue"
                    : ""
                }`}
              >
                <div>
                  <span>
                    Response Due
                  </span>

                  <strong>
                    {formatDate(
                      ticket.responseDueAt
                    )}
                  </strong>
                </div>

                <span className="sla-state">
                  {ticket.responseOverdue
                    ? "Overdue"
                    : "On track"}
                </span>
              </div>

              <div
                className={`ticket-sla-item ${
                  ticket.resolutionOverdue
                    ? "sla-overdue"
                    : ""
                }`}
              >
                <div>
                  <span>
                    Resolution Due
                  </span>

                  <strong>
                    {formatDate(
                      ticket.resolutionDueAt
                    )}
                  </strong>
                </div>

                <span className="sla-state">
                  {ticket.resolutionOverdue
                    ? "Overdue"
                    : "On track"}
                </span>
              </div>

              <div className="ticket-sla-item">
                <div>
                  <span>
                    First Response
                  </span>

                  <strong>
                    {formatDate(
                      ticket.firstRespondedAt
                    )}
                  </strong>
                </div>
              </div>

              <div className="ticket-sla-item">
                <div>
                  <span>
                    Resolved At
                  </span>

                  <strong>
                    {formatDate(
                      ticket.resolvedAt
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TicketDetailsPage;