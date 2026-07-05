import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import { formatDate } from "../utils/formatters";
import { getNotificationIcon, getNotificationClass } from "../components/notifications/NotificationDropdown";
import { FiCheck, FiTrash, FiBellOff, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await notificationService.getAll({ page, limit: 15 });
      setNotifications(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1 });
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Could not update notifications");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Could not clear notifications");
    }
  };

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    if (n.relatedEntity) {
      const { type, id } = n.relatedEntity;
      if (type === "Task") {
        navigate(`/tasks/${id}`);
      } else if (type === "Project") {
        navigate(`/projects/${id}`);
      } else if (type === "RCA") {
        navigate(`/rca/${id}`);
      }
    } else if (n.link) {
      navigate(n.link);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Could not delete notification");
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">Manage system events and assignment updates</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiCheck size={14} /> Mark all read
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiTrash size={14} /> Clear all
          </button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <FiBellOff size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
          <h3>All clear</h3>
          <p>No notifications to display.</p>
        </div>
      ) : (
        <>
          <div className="notifications-page-list">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`notification-page-item ${!n.isRead ? "unread" : ""}`}
                onClick={() => handleItemClick(n)}
              >
                <div className={`notification-icon ${getNotificationClass(n.type)}`}>
                  {getNotificationIcon(n.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{n.title}</div>
                  <div className="notification-message">{n.message}</div>
                  <div className="notification-time">{formatDate(n.createdAt)}</div>
                </div>
                <button
                  onClick={(e) => handleDeleteItem(e, n._id)}
                  style={{ color: "var(--color-text-muted)", alignSelf: "center", padding: 6 }}
                  title="Delete notification"
                >
                  <FiTrash size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-xs btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => fetchNotifications(pagination.page - 1)}
              >
                Prev
              </button>
              <span style={{ fontSize: 13, alignSelf: "center", color: "var(--color-text-muted)" }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-xs btn-secondary"
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchNotifications(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;
