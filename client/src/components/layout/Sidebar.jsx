import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/formatters";
import {
  FiGrid,
  FiFolder,
  FiCheckSquare,
  FiActivity,
  FiBell,
  FiLogOut,
  FiX,
  FiShield,
} from "react-icons/fi";

const Sidebar = ({ open, setOpen }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">TF</div>
        <div className="sidebar-brand-text">TeamFlow</div>
        <button
          className="mobile-menu-btn"
          onClick={() => setOpen(false)}
          style={{ marginLeft: "auto", color: "var(--color-text-muted)" }}
        >
          <FiX size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <FiFolder />
          <span>Projects</span>
        </NavLink>
        <NavLink
          to="/my-tasks"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <FiCheckSquare />
          <span>My Tasks</span>
        </NavLink>

        <div className="sidebar-section-label">Operations</div>
        <NavLink
          to="/rca"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <FiActivity />
          <span>RCA Reports</span>
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <FiBell />
          <span>Notifications</span>
        </NavLink>
        {user?.role === "Admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <FiShield />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink 
          to="/profile" 
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textDecoration: "none" }}
          onClick={() => setOpen(false)}
        >
          <div className="avatar avatar-sm">
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ color: "var(--color-text)" }}>{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          style={{ color: "var(--color-text-muted)", display: "flex", padding: 6, marginLeft: "auto" }}
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
