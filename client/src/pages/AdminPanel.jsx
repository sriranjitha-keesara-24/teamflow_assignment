import { useState, useEffect } from "react";
import { FiUsers, FiUserCheck, FiUserX, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { adminGetUsersList, toggleUserActivation } from "../services/userService";
import { getInitials } from "../utils/formatters";
import useAuth from "../hooks/useAuth";

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminGetUsersList();
      setUsers(data.users || []);
    } catch (err) {
      toast.error("Could not load users database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  // Safe Date formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header" style={{ marginBottom: 28, borderBottom: "1px solid var(--color-border)", paddingBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiShield size={22} style={{ color: "var(--color-primary-hover)" }} />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Admin Control Panel</h1>
          </div>
          <p className="page-subtitle" style={{ margin: "6px 0 0 0" }}>Manage system users, adjust roles, and activate/deactivate accounts.</p>
        </div>
      </div>

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

      {loading ? (
        <div className="loading-center" style={{ minHeight: 250 }}>
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <FiUsers size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
          <h3>No users registered</h3>
        </div>
      ) : (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>User</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>System Role</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Joined</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Status</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user._id === (currentUser?._id || currentUser?.id);
                return (
                  <tr key={user._id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                    <td style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="avatar" style={{ fontSize: 11, background: isSelf ? "var(--color-primary-dim)" : "", color: isSelf ? "var(--color-primary-hover)" : "", fontWeight: 750 }}>
                        {user.avatar ? (
                          <img src={user.avatar.startsWith("http") ? user.avatar : `${import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")}${user.avatar}`} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 650, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
                          {user.name}
                          {isSelf && <span className="member-role-badge" style={{ fontSize: 10, padding: "1px 6px" }}>You</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>{user.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="member-role-badge" style={{
                        background: user.role === "Admin" ? "var(--color-danger-dim, #ffebeb)" : user.role === "Manager" ? "var(--color-warning-dim, #fff8eb)" : "var(--color-primary-dim)",
                        color: user.role === "Admin" ? "var(--color-danger, #d93838)" : user.role === "Manager" ? "var(--color-warning-hover, #d98238)" : "var(--color-primary-hover)"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className={`badge ${user.isActive ? "badge-active" : "badge-archived"}`} style={{
                        background: user.isActive ? "var(--color-success-dim, #ebfffa)" : "var(--color-border)",
                        color: user.isActive ? "var(--color-success, #22c55e)" : "var(--color-text-muted)",
                        fontWeight: 700
                      }}>
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button
                        className={`btn btn-xs ${user.isActive ? "btn-secondary" : "btn-primary"}`}
                        onClick={() => handleToggleStatus(user)}
                        disabled={updatingId === user._id || isSelf}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11.5,
                          padding: "6px 12px",
                          borderColor: isSelf ? "transparent" : user.isActive ? "var(--color-danger)" : "var(--color-success)",
                          color: isSelf ? "var(--color-text-muted)" : user.isActive ? "var(--color-danger)" : "var(--color-success)",
                          background: isSelf ? "var(--color-border)" : "transparent"
                        }}
                      >
                        {user.isActive ? (
                          <>
                            <FiUserX size={12} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <FiUserCheck size={12} />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
