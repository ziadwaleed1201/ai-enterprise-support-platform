import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import TicketDetailsPage from "./pages/TicketDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AssignedTicketsPage from "./pages/AssignedTicketsPage";
import AllTicketsPage from "./pages/AllTicketsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDepartmentsPage from "./pages/AdminDepartmentsPage";

function protectedPage(
  element: React.ReactNode
) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {element}
      </AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={protectedPage(
          <DashboardPage />
        )}
      />

      {/* Employee Tickets */}
      <Route
        path="/tickets/my"
        element={protectedPage(
          <MyTicketsPage />
        )}
      />

      <Route
        path="/tickets/create"
        element={protectedPage(
          <CreateTicketPage />
        )}
      />

      {/* Shared Ticket Details */}
      <Route
        path="/tickets/:id"
        element={protectedPage(
          <TicketDetailsPage />
        )}
      />

      {/* Support / Admin Tickets */}
      <Route
        path="/tickets/assigned"
        element={protectedPage(
          <AssignedTicketsPage />
        )}
      />

      <Route
        path="/tickets/all"
        element={protectedPage(
          <AllTicketsPage />
        )}
      />

      {/* Notifications */}
      <Route
        path="/notifications"
        element={protectedPage(
          <NotificationsPage />
        )}
      />

      {/* Administration */}
      <Route
        path="/admin/users"
        element={protectedPage(
          <AdminUsersPage />
        )}
      />

      <Route
        path="/admin/departments"
        element={protectedPage(
          <AdminDepartmentsPage />
        )}
      />

      {/* Redirects */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;