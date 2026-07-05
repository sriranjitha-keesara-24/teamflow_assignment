import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notificationService";
import { formatDate } from "../../utils/formatters";
import { FiCheck, FiTrash, FiActivity, FiFolder, FiCheckSquare, FiMessageSquare, FiInfo } from "react-icons/fi";
import toast from "react-hot-toast";

const getNotificationIcon = (type) => {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_STATUS_CHANGED":
    case "DEADLINE_APPROACHING":
      return <FiCheckSquare />;
    case "RCA_SUBMITTED":
    case "REVIEW_OUTCOME":
      return <FiActivity />;
    case "PROJECT_INVITE":
      return <FiFolder />;
    case "COMMENT_MENTION":
      return <FiMessageSquare />;
    default:
      return <FiInfo />;
  }
};

const getNotificationClass = (type) => {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_STATUS_CHANGED":
    case "DEADLINE_APPROACHING":
      return "task";
    case "RCA_SUBMITTED":
    case "REVIEW_OUTCOME":
      return "rca";
    case "PROJECT_INVITE":
      return "project";
    case "COMMENT_MENTION":
      return "comment";
    default:
      return "general";
  }
};

const NotificationDropdown = ({ onClose, setUnreadCount }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll({ limit: 5 });
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Could not mark all as read");
    }
  };

  const handleItemClick = async (item) => {
    onClose();
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    // Dynamic routing depending on related entity
    if (item.relatedEntity) {
      const { type, id } = item.relatedEntity;
      if (type === "Task") {
        // Find tasks under the project
        navigate(`/tasks/${id}`);
      } else if (type === "Project") {
        navigate(`/projects/${id}`);
      } else if (type === "RCA") {
        navigate(`/rca/${id}`);
      }
    } else if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="notification-dropdown-header">
        <span className="notification-dropdown-title">Recent Notifications</span>
        <div className="notification-dropdown-actions">
          <button
            className="btn btn-xs btn-ghost"
            onClick={handleMarkAllRead}
            title="Mark all read"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <FiCheck /> Mark all read
          </button>
        </div>
      </div>

      <div className="notification-dropdown-body">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <h3>All caught up!</h3>
            <p>You have no unread notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-item ${!n.isRead ? "unread" : ""}`}
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
            </div>
          ))
        )}
      </div>

      <div className="notification-dropdown-footer">
        <Link to="/notifications" onClick={onClose}>
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
export { getNotificationClass, getNotificationIcon };
