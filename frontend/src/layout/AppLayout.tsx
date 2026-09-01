import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  const roleLabel = user.role.replaceAll("_", " ");

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-item active" : "nav-item";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span>S</span>
          </div>

          <div className="sidebar-brand-copy">
            <h2>SupportAI</h2>
            <span>Enterprise Service Desk</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            Workspace
          </div>

          <NavLink
            to="/dashboard"
            className={navClassName}
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </NavLink>

          {user.role === "EMPLOYEE" && (
            <>
              <NavLink
                to="/tickets/my"
                className={navClassName}
              >
                <span className="nav-icon">▤</span>
                <span>My Tickets</span>
              </NavLink>

              <NavLink
                to="/tickets/create"
                className={navClassName}
              >
                <span className="nav-icon">＋</span>
                <span>Create Ticket</span>
              </NavLink>
            </>
          )}

          {(user.role === "SUPPORT_AGENT" ||
            user.role === "ADMIN") && (
            <>
              <NavLink
                to="/tickets/assigned"
                className={navClassName}
              >
                <span className="nav-icon">✓</span>
                <span>Assigned Tickets</span>
              </NavLink>

              <NavLink
                to="/tickets/all"
                className={navClassName}
              >
                <span className="nav-icon">▤</span>
                <span>All Tickets</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/notifications"
            className={navClassName}
          >
            <span className="nav-icon">◌</span>
            <span>Notifications</span>
          </NavLink>

          {user.role === "ADMIN" && (
            <>
              <div className="nav-section-title">
                Administration
              </div>

              <NavLink
                to="/admin/users"
                className={navClassName}
              >
                <span className="nav-icon">◎</span>
                <span>Users</span>
              </NavLink>

              <NavLink
                to="/admin/departments"
                className={navClassName}
              >
                <span className="nav-icon">◇</span>
                <span>Departments</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-profile">
          <div className="sidebar-profile-main">
            <div className="user-avatar">
              {initials}
            </div>

            <div className="user-details">
              <strong>
                {user.firstName} {user.lastName}
              </strong>

              <span>{roleLabel}</span>

              <div className="profile-online">
                <span className="profile-online-dot" />
                Online
              </div>
            </div>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="topbar-eyebrow">
              SUPPORTAI
            </span>

            <h1>Support Workspace</h1>
          </div>

          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>
                {user.firstName} {user.lastName}
              </strong>

              <span>{user.email}</span>
            </div>

            <div className="topbar-avatar">
              {initials}

              <span className="topbar-online-dot" />
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;