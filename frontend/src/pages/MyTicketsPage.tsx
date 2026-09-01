import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Ticket } from "../types/ticket";

function MyTicketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        setLoading(true);

        const response =
          await api.get<Ticket[]>("/tickets/my");

        if (active) {
          setTickets(response.data);
          setError("");
        }
      } catch {
        if (active) {
          setError("Unable to load your tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "RESOLVED" &&
      ticket.status !== "CLOSED" &&
      ticket.status !== "CANCELLED"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "RESOLVED" ||
      ticket.status === "CLOSED"
  ).length;

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />

        <span>Loading your tickets...</span>
      </div>
    );
  }

  return (
    <div className="page-container tickets-page">
      {/* Header */}
      <div className="tickets-page-header">
        <div>
          <span className="dashboard-kicker">
            Employee Support
          </span>

          <h1>My Tickets</h1>

          <p>
            Track your support requests, monitor their
            progress, and view the support agent assigned
            to each ticket.
          </p>
        </div>

        <button
          type="button"
          className="primary-button tickets-create-button"
          onClick={() =>
            navigate("/tickets/create")
          }
        >
          <span>＋</span>
          Create Ticket
        </button>
      </div>

      {/* Summary Cards */}
      <div className="ticket-summary-grid">
        <div className="ticket-summary-card">
          <span>Total Tickets</span>

          <strong>
            {tickets.length}
          </strong>

          <small>
            Requests submitted
          </small>
        </div>

        <div className="ticket-summary-card ticket-summary-active">
          <span>Active</span>

          <strong>
            {activeTickets}
          </strong>

          <small>
            Requests currently being handled
          </small>
        </div>

        <div className="ticket-summary-card ticket-summary-resolved">
          <span>Resolved</span>

          <strong>
            {resolvedTickets}
          </strong>

          <small>
            Completed requests
          </small>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error &&
        tickets.length === 0 && (
          <div className="empty-state ticket-empty-state">
            <div className="empty-state-icon">
              ＋
            </div>

            <h3>No tickets yet</h3>

            <p>
              You haven't created any support tickets yet.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/tickets/create")
              }
            >
              Create your first ticket
            </button>
          </div>
        )}

      {/* Tickets */}
      {!error &&
        tickets.length > 0 && (
          <div className="tickets-panel">
            <div className="tickets-panel-header">
              <div>
                <h2>
                  Your support requests
                </h2>

                <p>
                  Select a ticket to view its full details,
                  comments, attachments, and activity.
                </p>
              </div>

              <span className="tickets-count-badge">
                {tickets.length}{" "}
                {tickets.length === 1
                  ? "ticket"
                  : "tickets"}
              </span>
            </div>

            <div className="tickets-table-scroll">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Department</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Agent</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map(
                    (ticket) => (
                      <tr
                        key={ticket.id}
                        className="ticket-row"
                        onClick={() =>
                          navigate(
                            `/tickets/${ticket.id}`
                          )
                        }
                      >
                        {/* Ticket */}
                        <td>
                          <div className="ticket-title-cell">
                            <span className="ticket-number">
                              #{ticket.id}
                            </span>

                            <strong>
                              {ticket.title}
                            </strong>
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <span className="table-main-text">
                            {
                              ticket.departmentName
                            }
                          </span>
                        </td>

                        {/* Category */}
                        <td>
                          {ticket.categoryName}
                        </td>

                        {/* Priority */}
                        <td>
                          <span
                            className={`priority-badge priority-${ticket.priority.toLowerCase()}`}
                          >
                            {ticket.priority.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`status-badge status-${ticket.status.toLowerCase()}`}
                          >
                            {ticket.status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        {/* Assigned Agent */}
                        <td>
                          {ticket.assignedAgent ? (
                            <div className="table-agent">
                              <span className="mini-agent-avatar mini-agent-purple">
                                {ticket.assignedAgent
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <span className="table-agent-email">
                                {
                                  ticket.assignedAgent
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="unassigned-text">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="table-date">
                          {formatDate(
                            ticket.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

export default MyTicketsPage;