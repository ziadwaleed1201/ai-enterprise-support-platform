import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Ticket } from "../types/ticket";

function AssignedTicketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        const response =
          await api.get<Ticket[]>(
            "/tickets/assigned"
          );

        if (active) {
          setTickets(response.data);
        }
      } catch {
        if (active) {
          setError(
            "Unable to load assigned tickets."
          );
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

  const urgentTickets = tickets.filter(
    (ticket) =>
      ticket.priority === "HIGH" ||
      ticket.priority === "CRITICAL"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) =>
      ticket.status === "IN_PROGRESS"
  ).length;

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />
        <span>Loading assigned tickets...</span>
      </div>
    );
  }

  return (
    <div className="page-container tickets-page">
      <div className="tickets-page-header">
        <div>
          <span className="dashboard-kicker">
            Support Queue
          </span>

          <h1>Assigned Tickets</h1>

          <p>
            Tickets currently assigned to your support
            account.
          </p>
        </div>
      </div>

      <div className="ticket-summary-grid">
        <div className="ticket-summary-card">
          <span>Assigned</span>
          <strong>{tickets.length}</strong>
          <small>Your current workload</small>
        </div>

        <div className="ticket-summary-card ticket-summary-warning">
          <span>High priority</span>
          <strong>{urgentTickets}</strong>
          <small>Require close attention</small>
        </div>

        <div className="ticket-summary-card ticket-summary-active">
          <span>In progress</span>
          <strong>{inProgressTickets}</strong>
          <small>Currently being handled</small>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!error && tickets.length === 0 ? (
        <div className="empty-state ticket-empty-state">
          <div className="empty-state-icon">
            ✓
          </div>

          <h3>Your queue is clear</h3>

          <p>
            There are currently no support tickets assigned
            to you.
          </p>
        </div>
      ) : (
        !error && (
          <div className="tickets-panel">
            <div className="tickets-panel-header">
              <div>
                <h2>Your assigned queue</h2>

                <p>
                  Open any request to respond, update its
                  status, or review ticket activity.
                </p>
              </div>

              <span className="tickets-count-badge">
                {tickets.length} assigned
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
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="ticket-row"
                      onClick={() =>
                        navigate(
                          `/tickets/${ticket.id}`
                        )
                      }
                    >
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

                      <td>
                        <span className="table-main-text">
                          {ticket.departmentName}
                        </span>
                      </td>

                      <td>
                        {ticket.categoryName}
                      </td>

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

                      <td>
                        <div className="table-agent">
                          <span className="mini-agent-avatar">
                            {ticket.createdBy
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
                            {ticket.createdBy}
                          </span>
                        </div>
                      </td>

                      <td className="table-date">
                        {formatDate(
                          ticket.createdAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default AssignedTicketsPage;