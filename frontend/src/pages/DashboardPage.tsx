import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../auth/useAuth";

interface DashboardResponse {
  totalTickets: number;
  newTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;

  overdueResponses: number;
  overdueResolutions: number;

  ticketsByPriority: Record<string, number>;
  ticketsByDepartment: Record<string, number>;
  agentWorkload: Record<string, number>;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canViewDashboard =
    user?.role === "SUPPORT_AGENT" ||
    user?.role === "ADMIN";

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(canViewDashboard);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!canViewDashboard) {
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      try {
        const response =
          await api.get<DashboardResponse>("/dashboard");

        if (active) {
          setDashboard(response.data);
        }
      } catch {
        if (active) {
          setError("Unable to load dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [canViewDashboard]);

  if (!canViewDashboard) {
    return (
      <div className="page-container employee-dashboard">
        <div className="dashboard-hero">
          <div>
            <span className="dashboard-kicker">
              Employee Workspace
            </span>

            <h1>
              Welcome back, {user?.firstName}
            </h1>

            <p>
              Create support requests, track their progress,
              and stay updated from one place.
            </p>
          </div>
        </div>

        <div className="employee-dashboard-grid">
          <button
            type="button"
            className="employee-action-card employee-action-card-button"
            onClick={() =>
              navigate("/tickets/create")
            }
          >
            <div className="employee-action-icon">
              +
            </div>

            <div>
              <h3>
                Create a support ticket
              </h3>

              <p>
                Submit a new request to the appropriate
                support department.
              </p>

              <span className="employee-action-link">
                Create ticket
                <span>→</span>
              </span>
            </div>
          </button>

          <button
            type="button"
            className="employee-action-card employee-action-card-button"
            onClick={() =>
              navigate("/tickets/my")
            }
          >
            <div className="employee-action-icon">
              ✓
            </div>

            <div>
              <h3>
                Track your requests
              </h3>

              <p>
                Review ticket status, responses, attachments,
                and resolution progress.
              </p>

              <span className="employee-action-link">
                View my tickets
                <span>→</span>
              </span>
            </div>
          </button>

          <button
            type="button"
            className="employee-action-card employee-action-card-button"
            onClick={() =>
              navigate("/notifications")
            }
          >
            <div className="employee-action-icon">
              ◌
            </div>

            <div>
              <h3>
                Stay informed
              </h3>

              <p>
                View notifications whenever your support
                requests are updated.
              </p>

              <span className="employee-action-link">
                View notifications
                <span>→</span>
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner" />

        <p>
          Loading support dashboard...
        </p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="page-container">
        <div className="dashboard-page-header">
          <div>
            <span className="dashboard-kicker">
              Support Operations
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Monitor support activity, service levels, and
              team workload.
            </p>
          </div>
        </div>

        <div className="dashboard-error">
          <strong>
            Dashboard unavailable
          </strong>

          <span>
            {error || "Dashboard data is unavailable."}
          </span>
        </div>
      </div>
    );
  }

  const priorityOrder = [
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
  ];

  const priorityEntries = priorityOrder
    .filter(
      (priority) =>
        priority in dashboard.ticketsByPriority
    )
    .map(
      (priority) =>
        [
          priority,
          dashboard.ticketsByPriority[priority],
        ] as const
    );

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-kicker">
            Support Operations
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor ticket activity, SLA health, and support
            team workload.
          </p>
        </div>

        <div className="dashboard-live-status">
          <span className="dashboard-live-dot" />
          Live overview
        </div>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>
              Ticket overview
            </h2>

            <p>
              Current ticket volume across the support desk.
            </p>
          </div>
        </div>

        <div className="dashboard-metrics-grid">
          <div className="dashboard-metric-card metric-total">
            <div className="metric-card-top">
              <span className="metric-label">
                Total tickets
              </span>

              <span className="metric-icon">
                ▤
              </span>
            </div>

            <strong>
              {dashboard.totalTickets}
            </strong>

            <span className="metric-caption">
              All support requests
            </span>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-card-top">
              <span className="metric-label">
                New
              </span>

              <span className="metric-icon">
                +
              </span>
            </div>

            <strong>
              {dashboard.newTickets}
            </strong>

            <span className="metric-caption">
              Awaiting review
            </span>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-card-top">
              <span className="metric-label">
                Open
              </span>

              <span className="metric-icon">
                ◇
              </span>
            </div>

            <strong>
              {dashboard.openTickets}
            </strong>

            <span className="metric-caption">
              Open support cases
            </span>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-card-top">
              <span className="metric-label">
                In progress
              </span>

              <span className="metric-icon">
                →
              </span>
            </div>

            <strong>
              {dashboard.inProgressTickets}
            </strong>

            <span className="metric-caption">
              Currently being handled
            </span>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-card-top">
              <span className="metric-label">
                Resolved
              </span>

              <span className="metric-icon">
                ✓
              </span>
            </div>

            <strong>
              {dashboard.resolvedTickets}
            </strong>

            <span className="metric-caption">
              Successfully resolved
            </span>
          </div>

          <div className="dashboard-metric-card">
            <div className="metric-card-top">
              <span className="metric-label">
                Closed
              </span>

              <span className="metric-icon">
                ×
              </span>
            </div>

            <strong>
              {dashboard.closedTickets}
            </strong>

            <span className="metric-caption">
              Completed requests
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>
              SLA health
            </h2>

            <p>
              Tickets currently exceeding service targets.
            </p>
          </div>
        </div>

        <div className="sla-grid">
          <div
            className={
              dashboard.overdueResponses > 0
                ? "sla-card sla-card-danger"
                : "sla-card sla-card-success"
            }
          >
            <div className="sla-icon">
              !
            </div>

            <div className="sla-content">
              <span>
                Overdue responses
              </span>

              <strong>
                {dashboard.overdueResponses}
              </strong>

              <p>
                Tickets awaiting a response beyond the SLA
                target.
              </p>
            </div>
          </div>

          <div
            className={
              dashboard.overdueResolutions > 0
                ? "sla-card sla-card-danger"
                : "sla-card sla-card-success"
            }
          >
            <div className="sla-icon">
              !
            </div>

            <div className="sla-content">
              <span>
                Overdue resolutions
              </span>

              <strong>
                {dashboard.overdueResolutions}
              </strong>

              <p>
                Tickets exceeding their expected resolution
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-details-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Tickets by priority
              </h2>

              <p>
                Distribution across support priority levels.
              </p>
            </div>
          </div>

          {priorityEntries.length === 0 ? (
            <div className="dashboard-empty">
              No priority data available.
            </div>
          ) : (
            <div className="priority-list">
              {priorityEntries.map(
                ([priority, count]) => {
                  const total =
                    dashboard.totalTickets || 1;

                  const percentage =
                    (count / total) * 100;

                  return (
                    <div
                      className="priority-item"
                      key={priority}
                    >
                      <div className="priority-item-top">
                        <div>
                          <span
                            className={`priority-dot priority-dot-${priority.toLowerCase()}`}
                          />

                          <span className="priority-name">
                            {priority.replaceAll("_", " ")}
                          </span>
                        </div>

                        <strong>
                          {count}
                        </strong>
                      </div>

                      <div className="dashboard-progress">
                        <div
                          className={`dashboard-progress-fill priority-progress-${priority.toLowerCase()}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Tickets by department
              </h2>

              <p>
                Support demand across business functions.
              </p>
            </div>
          </div>

          {Object.keys(
            dashboard.ticketsByDepartment
          ).length === 0 ? (
            <div className="dashboard-empty">
              No department data available.
            </div>
          ) : (
            <div className="department-list">
              {Object.entries(
                dashboard.ticketsByDepartment
              ).map(([department, count]) => (
                <div
                  className="department-row"
                  key={department}
                >
                  <div className="department-name">
                    <span className="department-icon">
                      {department
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span>
                      {department}
                    </span>
                  </div>

                  <div className="department-count">
                    <strong>
                      {count}
                    </strong>

                    <span>
                      {count === 1
                        ? "ticket"
                        : "tickets"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-panel workload-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>
                Agent workload
              </h2>

              <p>
                Active ticket assignments by support agent.
              </p>
            </div>

            <span className="dashboard-panel-badge">
              {
                Object.keys(
                  dashboard.agentWorkload
                ).length
              }{" "}
              agents
            </span>
          </div>

          {Object.keys(
            dashboard.agentWorkload
          ).length === 0 ? (
            <div className="dashboard-empty">
              No agent workload data available.
            </div>
          ) : (
            <div className="workload-table-wrapper">
              <table className="workload-table">
                <thead>
                  <tr>
                    <th>
                      Agent
                    </th>

                    <th>
                      Assigned tickets
                    </th>

                    <th>
                      Workload
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(
                    dashboard.agentWorkload
                  ).map(([agent, count]) => {
                    const maxWorkload = Math.max(
                      ...Object.values(
                        dashboard.agentWorkload
                      ),
                      1
                    );

                    const percentage =
                      (count / maxWorkload) * 100;

                    return (
                      <tr key={agent}>
                        <td>
                          <div className="agent-cell">
                            <span className="agent-avatar">
                              {agent
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {agent}
                              </strong>

                              <span>
                                Support Agent
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {count}
                          </strong>
                        </td>

                        <td>
                          <div className="workload-progress">
                            <div
                              className="workload-progress-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;