import React from "react";
import { FiUserCheck, FiUserX } from "react-icons/fi";
import { getInitials } from "../../utils/formatters";

export default function UserManagement({ users, currentUser, updatingId, onToggleStatus }) {
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
                    onClick={() => onToggleStatus(user)}
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
  );
}
