import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/formatters";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { notificationService } from "../../services/notificationService";

const Topbar = ({ setSidebarOpen, setSearchOpen, unreadCount, setUnreadCount }) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    // Initial fetch of unread count
    const fetchUnread = async () => {
      try {
        const { unreadCount: count } = await notificationService.getAll({ limit: 1 });
        setUnreadCount(count);
      } catch (err) {
        console.error("Could not fetch unread notification count", err);
      }
    };
    fetchUnread();
  }, [setUnreadCount]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        <FiMenu size={20} />
      </button>

      {/* Mock Search Input Triggering Search Modal */}
      <div className="topbar-search" onClick={() => setSearchOpen(true)} style={{ cursor: "pointer" }}>
        <FiSearch className="topbar-search-icon" size={16} />
        <input type="text" placeholder="Search tasks, projects, RCAs..." readOnly />
        <span className="topbar-search-shortcut">Ctrl+K</span>
      </div>

      <div className="topbar-actions">
        {/* Notification Bell with Count */}
        <div style={{ position: "relative" }} ref={bellRef}>
          <button className="topbar-icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <FiBell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {dropdownOpen && (
            <NotificationDropdown
              onClose={() => setDropdownOpen(false)}
              unreadCount={unreadCount}
              setUnreadCount={setUnreadCount}
            />
          )}
        </div>

        {/* User Info / Profile Link */}
        <Link to="/profile" style={{ display: "flex", alignItems: "center" }}>
          <div className="avatar" title={user?.name}>
            {getInitials(user?.name)}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
