import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import type {
  CurrentUser,
  UserRole,
} from "../auth/authTypes";

const USER_ROLES: UserRole[] = [
  "EMPLOYEE",
  "SUPPORT_AGENT",
  "ADMIN",
];

function AdminUsersPage() {
  const [users, setUsers] =
    useState<CurrentUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    updatingUserId,
    setUpdatingUserId,
  ] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      try {
        const response =
          await api.get<CurrentUser[]>(
            "/admin/users"
          );

        if (active) {
          setUsers(response.data);
        }
      } catch {
        if (active) {
          setError(
            "Unable to load users."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  const handleRoleChange = async (
    userId: number,
    role: UserRole
  ) => {
    try {
      setUpdatingUserId(userId);
      setError("");

      const response =
        await api.put<CurrentUser>(
          `/admin/users/${userId}/role`,
          {
            role,
          }
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? response.data
            : user
        )
      );
    } catch {
      setError(
        "Unable to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusChange = async (
    userId: number,
    enabled: boolean
  ) => {
    try {
      setUpdatingUserId(userId);
      setError("");

      const response =
        await api.put<CurrentUser>(
          `/admin/users/${userId}/status`,
          {
            enabled,
          }
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? response.data
            : user
        )
      );
    } catch {
      setError(
        "Unable to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const enabledUsers =
    users.filter(
      (user) => user.enabled
    ).length;

  const disabledUsers =
    users.length - enabledUsers;

  const admins =
    users.filter(
      (user) =>
        user.role === "ADMIN"
    ).length;

  const supportAgents =
    users.filter(
      (user) =>
        user.role ===
        "SUPPORT_AGENT"
    ).length;

  const filteredUsers =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) => {
          const fullName =
            `${user.firstName} ${user.lastName}`.toLowerCase();

          const formattedRole =
            user.role
              .replaceAll("_", " ")
              .toLowerCase();

          return (
            fullName.includes(query) ||
            user.email
              .toLowerCase()
              .includes(query) ||
            formattedRole.includes(
              query
            ) ||
            String(user.id).includes(
              query
            )
          );
        }
      );
    }, [search, users]);

  const getInitials = (
    firstName: string,
    lastName: string
  ) => {
    return `${firstName.charAt(
      0
    )}${lastName.charAt(
      0
    )}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />

        <span>
          Loading users...
        </span>
      </div>
    );
  }

  return (
    <div className="page-container admin-users-page">
      <div className="admin-users-header">
        <div>
          <span className="dashboard-kicker">
            ADMINISTRATION
          </span>

          <h1>
            User Management
          </h1>

          <p>
            Manage account access, roles, and
            support permissions across the
            platform.
          </p>
        </div>

        <div className="admin-users-header-badge">
          <span>
            Directory
          </span>

          <strong>
            {users.length}
          </strong>
        </div>
      </div>

      <div className="admin-user-summary-grid">
        <div className="admin-user-summary-card">
          <span>
            Total Users
          </span>

          <strong>
            {users.length}
          </strong>

          <small>
            Accounts in the platform
          </small>
        </div>

        <div className="admin-user-summary-card admin-user-summary-enabled">
          <span>
            Enabled
          </span>

          <strong>
            {enabledUsers}
          </strong>

          <small>
            Active accounts
          </small>
        </div>

        <div className="admin-user-summary-card admin-user-summary-disabled">
          <span>
            Disabled
          </span>

          <strong>
            {disabledUsers}
          </strong>

          <small>
            Restricted accounts
          </small>
        </div>

        <div className="admin-user-summary-card admin-user-summary-agent">
          <span>
            Support Agents
          </span>

          <strong>
            {supportAgents}
          </strong>

          <small>
            Support team members
          </small>
        </div>

        <div className="admin-user-summary-card admin-user-summary-admin">
          <span>
            Administrators
          </span>

          <strong>
            {admins}
          </strong>

          <small>
            Platform admins
          </small>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <h3>
            No users found
          </h3>

          <p>
            No user accounts are currently
            available.
          </p>
        </div>
      ) : (
        <section className="admin-users-panel">
          <div className="admin-users-panel-header">
            <div>
              <span className="dashboard-kicker">
                USER DIRECTORY
              </span>

              <h2>
                Accounts and access
              </h2>

              <p>
                Search users, update roles,
                and control account access.
              </p>
            </div>

            <span className="tickets-count-badge">
              {users.length} users
            </span>
          </div>

          <div className="admin-users-toolbar">
            <div className="admin-users-search">
              <span className="admin-users-search-icon">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, email, role, or user ID..."
                aria-label="Search users"
              />

              {search && (
                <button
                  type="button"
                  className="admin-users-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="admin-users-search-result">
              <strong>
                {filteredUsers.length}
              </strong>

              <span>
                {filteredUsers.length ===
                1
                  ? "user found"
                  : "users found"}
              </span>
            </div>
          </div>

          <div className="admin-users-table-scroll">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Account</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="admin-users-no-results"
                    >
                      <div>
                        <strong>
                          No users found
                        </strong>

                        <span>
                          No accounts match
                          {search
                            ? ` "${search}".`
                            : "."}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setSearch("")
                          }
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredUsers.map(
                  (user) => {
                    const isUpdating =
                      updatingUserId ===
                      user.id;

                    return (
                      <tr
                        key={user.id}
                      >
                        <td>
                          <div className="admin-user-identity">
                            <div className="admin-user-avatar">
                              {getInitials(
                                user.firstName,
                                user.lastName
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  user.firstName
                                }{" "}
                                {
                                  user.lastName
                                }
                              </strong>

                              <span>
                                User #
                                {user.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="admin-user-email">
                            {
                              user.email
                            }
                          </span>
                        </td>

                        <td>
                          <select
                            className="admin-role-select"
                            value={
                              user.role
                            }
                            disabled={
                              isUpdating
                            }
                            onChange={(
                              event
                            ) =>
                              void handleRoleChange(
                                user.id,
                                event
                                  .target
                                  .value as UserRole
                              )
                            }
                          >
                            {USER_ROLES.map(
                              (
                                role
                              ) => (
                                <option
                                  key={
                                    role
                                  }
                                  value={
                                    role
                                  }
                                >
                                  {role.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td>
                          <span
                            className={`admin-user-status ${
                              user.enabled
                                ? "enabled"
                                : "disabled"
                            }`}
                          >
                            <span className="admin-user-status-dot" />

                            {user.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`admin-account-button ${
                              user.enabled
                                ? "disable"
                                : "enable"
                            }`}
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              void handleStatusChange(
                                user.id,
                                !user.enabled
                              )
                            }
                          >
                            {isUpdating
                              ? "Updating..."
                              : user.enabled
                                ? "Disable"
                                : "Enable"}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminUsersPage;