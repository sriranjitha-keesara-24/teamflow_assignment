import { useState, useEffect } from "react";
import { FiUsers, FiShield, FiActivity } from "react-icons/fi";
import toast from "react-hot-toast";
import { adminGetUsersList, toggleUserActivation, adminGetAuditLogs } from "../services/userService";
import useAuth from "../hooks/useAuth";
import UserManagement from "../components/admin/UserManagement";
import AuditLogTable from "../components/admin/AuditLogTable";

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // users, logs
  const [usersLoading, setUsersLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await adminGetUsersList();
      setUsers(data.users || []);
    } catch (err) {
      toast.error("Could not load users database");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await adminGetAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      toast.error("Could not load system audit logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  const handleToggleStatus = async (user) => {
    if (user._id === (currentUser?._id || currentUser?.id)) {
      toast.error("You cannot deactivate your own account!");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this user's account?`)) {
      return;
    }

    try {
      setUpdatingId(user._id);
      const res = await toggleUserActivation(user._id);
      
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(res.message || `Account successfully ${user.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header" style={{ marginBottom: 28, borderBottom: "1px solid var(--color-border)", paddingBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiShield size={22} style={{ color: "var(--color-primary-hover)" }} />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Admin Control Panel</h1>
          </div>
          <p className="page-subtitle" style={{ margin: "6px 0 0 0" }}>Manage system users, adjust roles, and monitor system activity logs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <FiUsers size={16} /> User Accounts
        </button>
        <button
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <FiActivity size={16} /> System Audit Logs
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          {/* Stats Cards */}
          <div className="stat-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Accounts</div>
              <div className="stat-value" style={{ color: "var(--color-success)" }}>
                {users.filter(u => u.isActive).length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Deactivated Accounts</div>
              <div className="stat-value" style={{ color: "var(--color-text-muted)" }}>
                {users.filter(u => !u.isActive).length}
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="loading-center" style={{ minHeight: 250 }}>
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <FiUsers size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
              <h3>No users registered</h3>
            </div>
          ) : (
            <UserManagement
              users={users}
              currentUser={currentUser}
              updatingId={updatingId}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </>
      ) : (
        <>
          {logsLoading ? (
            <div className="loading-center" style={{ minHeight: 250 }}>
              <div className="spinner" />
            </div>
          ) : (
            <AuditLogTable logs={logs} />
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
