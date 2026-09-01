import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Ticket } from "../types/ticket";

interface TicketPageResponse {
  tickets: Ticket[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

function AllTicketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] =
    useState(0);
  const [totalElements, setTotalElements] =
    useState(0);

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        setLoading(true);

        const response =
          await api.get<TicketPageResponse>(
            "/tickets/search",
            {
              params: {
                ...(search.trim()
                  ? {
                      search:
                        search.trim(),
                    }
                  : {}),
                ...(status
                  ? { status }
                  : {}),
                ...(priority
                  ? { priority }
                  : {}),
                page,
                size: 10,
                sortBy: "createdAt",
                direction: "desc",
              },
            }
          );

        if (active) {
          setTickets(
            response.data.tickets
          );

          setTotalPages(
            response.data.totalPages
          );

          setTotalElements(
            response.data.totalElements
          );

          setError("");
        }
      } catch {
        if (active) {
          setError(
            "Unable to load tickets."
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
  }, [
    page,
    priority,
    search,
    status,
  ]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusChange = (
    value: string
  ) => {
    setStatus(value);
    setPage(0);
  };

  const handlePriorityChange = (
    value: string
  ) => {
    setPriority(value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setPage(0);
  };

  const filtersActive =
    search.trim() ||
    status ||
    priority;

  return (
    <div className="page-container tickets-page">
      <div className="tickets-page-header">
        <div>
          <span className="dashboard-kicker">
            Support Operations
          </span>

          <h1>All Tickets</h1>

          <p>
            Search and manage support tickets across the
            entire system.
          </p>
        </div>

        <div className="all-tickets-total">
          <span>Total tickets</span>
          <strong>{totalElements}</strong>
        </div>
      </div>

      <div className="ticket-filter-panel">
        <div className="ticket-search-box">
          <span className="ticket-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              handleSearchChange(
                event.target.value
              )
            }
            placeholder="Search by title, description, or ticket..."
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            handleStatusChange(
              event.target.value
            )
          }
        >
          <option value="">
            All statuses
          </option>
          <option value="NEW">
            New
          </option>
          <option value="OPEN">
            Open
          </option>
          <option value="IN_PROGRESS">
            In Progress
          </option>
          <option value="RESOLVED">
            Resolved
          </option>
          <option value="CLOSED">
            Closed
          </option>
          <option value="CANCELLED">
            Cancelled
          </option>
        </select>

        <select
          value={priority}
          onChange={(event) =>
            handlePriorityChange(
              event.target.value
            )
          }
        >
          <option value="">
            All priorities
          </option>
          <option value="LOW">
            Low
          </option>
          <option value="MEDIUM">
            Medium
          </option>
          <option value="HIGH">
            High
          </option>
          <option value="CRITICAL">
            Critical
          </option>
        </select>

        {filtersActive && (
          <button
            className="ticket-clear-filter"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tickets-panel">
        <div className="tickets-panel-header">
          <div>
            <h2>Support ticket directory</h2>

            <p>
              Browse all requests and open a ticket to manage
              its workflow.
            </p>
          </div>

          <span className="tickets-count-badge">
            {totalElements} results
          </span>
        </div>

        {loading ? (
          <div className="tickets-inner-loading">
            <div className="dashboard-loading-spinner" />
            <span>Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="ticket-table-empty">
            <div className="empty-state-icon">
              ⌕
            </div>

            <h3>No tickets found</h3>

            <p>
              Try changing your search or filter criteria.
            </p>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
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
                  <th>Assigned Agent</th>
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

                    <td>
                      {ticket.assignedAgent ? (
                        <div className="table-agent">
                          <span className="mini-agent-avatar mini-agent-purple">
                            {ticket.assignedAgent
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
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
        )}

        {!loading &&
          totalPages > 1 && (
            <div className="ticket-pagination">
              <div className="pagination-info">
                Page{" "}
                <strong>{page + 1}</strong>{" "}
                of{" "}
                <strong>{totalPages}</strong>
              </div>

              <div className="pagination-actions">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() =>
                    setPage(
                      (current) =>
                        current - 1
                    )
                  }
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page + 1 >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                >
                  Next →
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default AllTicketsPage;