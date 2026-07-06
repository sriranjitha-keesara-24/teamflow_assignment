import React, { useState, useEffect, useCallback } from "react";
import { FiCheckSquare, FiAlertCircle, FiClipboard, FiArrowRight, FiActivity } from "react-icons/fi";
import { rcaService } from "../services/rcaService";
import useAuth from "../hooks/useAuth";
import RCADetails from "../components/rca/RCADetails";
import Modal from "../components/common/Modal";
import toast from "react-hot-toast";

const STATUS_BADGES = {
  Submitted: "badge badge-priority-high",
  "Under Review": "badge badge-priority-medium",
  Approved: "badge badge-priority-low",
  Rejected: "badge badge-priority-critical",
  "Needs Revision": "badge badge-priority-medium",
};

export default function Reviews() {
  const { user } = useAuth();
  const [rcas, setRcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // pending, completed
  const [selectedRcaId, setSelectedRcaId] = useState(null);

  const fetchRCAData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rcaService.getAllRCAs();
      const rcaList = res.data || res.data?.data || res || [];
      
      // Filter RCAs where the current user is the reviewer
      const myId = user?._id || user?.id;
      const myReviews = rcaList.filter(
        (r) => r.reviewer?._id === myId || r.reviewer === myId
      );
      setRcas(myReviews);
    } catch (err) {
      toast.error("Failed to load RCA reviews");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRCAData();
  }, [fetchRCAData]);

  // Derive pending vs completed reviews
  const pendingReviews = rcas.filter((r) => ["Submitted", "Under Review"].includes(r.status));
  const completedReviews = rcas.filter((r) => ["Approved", "Rejected", "Needs Revision"].includes(r.status));

  const stats = {
    pending: pendingReviews.length,
    completed: completedReviews.length,
    total: rcas.length,
  };

  const handleOpenReview = (rcaId) => {
    setSelectedRcaId(rcaId);
  };

  const handleCloseReview = () => {
    setSelectedRcaId(null);
    fetchRCAData(); // Reload data to sync status changes
  };

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
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiClipboard size={22} style={{ color: "var(--color-primary-hover)" }} />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>RCA Review Dashboard</h1>
          </div>
          <p className="page-subtitle" style={{ margin: "6px 0 0 0" }}>Manage and decision Root Cause Analysis reports assigned to you for review.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Pending Action</div>
          <div className="stat-value" style={{ color: stats.pending > 0 ? "var(--color-warning-hover)" : "inherit" }}>
            {stats.pending}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Reviews</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {stats.completed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Assigned</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <button
          className={`filter-chip ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          Pending Review <span style={{ background: stats.pending > 0 ? "var(--color-danger)" : "var(--color-border)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>{stats.pending}</span>
        </button>
        <button
          className={`filter-chip ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Review History
        </button>
      </div>

      {loading ? (
        <div className="loading-center" style={{ minHeight: 250 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div>
          {activeTab === "pending" && (
            pendingReviews.length === 0 ? (
              <div className="empty-state">
                <FiCheckSquare size={36} style={{ marginBottom: 12, color: "var(--color-success)" }} />
                <h3>All Caught Up!</h3>
                <p>No RCA reports are currently pending your review decision.</p>
              </div>
            ) : (
              <ReviewList list={pendingReviews} onSelect={handleOpenReview} formatDate={formatDate} />
            )
          )}

          {activeTab === "completed" && (
            completedReviews.length === 0 ? (
              <div className="empty-state">
                <FiAlertCircle size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
                <h3>No Review History</h3>
                <p>Reports you review and decision will show up here.</p>
              </div>
            ) : (
              <ReviewList list={completedReviews} onSelect={handleOpenReview} formatDate={formatDate} isHistory />
            )
          )}
        </div>
      )}

      {/* Detailed RCA Review Modal */}
      {selectedRcaId && (
        <Modal
          isOpen={!!selectedRcaId}
          onClose={handleCloseReview}
          title="Review RCA Case Report Details"
          size="xl"
        >
          <div style={{ padding: "8px 4px" }}>
            <RCADetails
              rcaId={selectedRcaId}
              onBack={handleCloseReview}
              currentUserId={user?._id || user?.id}
              isAdmin={user?.role === "Admin"}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReviewList({ list, onSelect, formatDate, isHistory }) {
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
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Incident / Report Title</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Project</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Submitter</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Date Submitted</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Status</th>
            <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((rca) => {
            const badgeClass = STATUS_BADGES[rca.status] || "badge";
            return (
              <tr
                key={rca._id}
                style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <td style={{ padding: "14px 20px", fontWeight: 650, color: "var(--color-text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FiActivity style={{ color: "var(--color-primary-hover)", flexShrink: 0 }} />
                    {rca.title}
                  </div>
                </td>
                <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                  {rca.project?.name || "Deleted Project"}
                </td>
                <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                  {rca.submitter?.name}
                </td>
                <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                  {formatDate(rca.createdAt)}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span className={badgeClass}>{rca.status}</span>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => onSelect(rca._id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px" }}
                  >
                    {isHistory ? "View Details" : "Review"} <FiArrowRight size={12} />
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
