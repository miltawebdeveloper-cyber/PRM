import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Home from "./pages/home/Home";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import Invoices from "./pages/admin/Invoices";
import Clients from "./pages/admin/Clients";
import TimeLogs from "./pages/admin/TimeLogs";
import CreateTask from "./pages/manager/CreateTask";
import Timer from "./pages/employee/Timer";
import ClientDashboard from "./pages/client/Dashboard";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import NewProject from "./pages/projects/NewProject";
import Issues from "./pages/issues/Issues";
import Reports from "./pages/reports/Reports";
import Utilization from "./pages/reports/Utilization";
import Organizations from "./pages/admin/Organizations";
import Roles from "./pages/admin/Roles";
import TaskLists from "./pages/tasklists/TaskLists";
import Milestones from "./pages/milestones/Milestones";
import Settings from "./pages/settings/Settings";
import Notifications from "./pages/notifications/Notifications";
import Profile from "./pages/profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Sprints from "./pages/sprints/Sprints";
import Portfolio from "./pages/reports/Portfolio";
import Workload from "./pages/reports/Workload";
import Templates from "./pages/projects/Templates";

function GuestRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function RootRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee", "Client"]}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee", "Client"]}>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee", "Client"]}>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <NewProject />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Invoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/time-logs"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <TimeLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tasks"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
            <CreateTask />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/tasks"
        element={
          <ProtectedRoute allowedRoles={["Employee", "Manager", "Admin"]}>
            <Timer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Client"]}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/issues"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
            <Issues />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/utilization"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <Utilization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/milestones"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
            <Milestones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee", "Client"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizations"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Organizations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/task-lists"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <TaskLists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Roles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee", "Client"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sprints"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
            <Sprints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/portfolio"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <Portfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/workload"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <Workload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/templates"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
            <Templates />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
