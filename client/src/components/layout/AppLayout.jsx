import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import SearchModal from "../search/SearchModal";
import io from "socket.io-client";
import toast from "react-hot-toast";
import "../../styles/layout.css";

const AppLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Socket setup for real-time notifications
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "");
    const token = localStorage.getItem("accessToken");
    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
      query: { userId: user.id },
    });

    socket.on("connect", () => {
      console.log("Connected to notification socket");
    });

    socket.on("notification", (notification) => {
      toast(notification.title + ": " + notification.message, {
        icon: "🔔",
        style: {
          background: "var(--color-surface)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
        },
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);

  // Handle Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="app-main">
        <Topbar
          setSidebarOpen={setSidebarOpen}
          setSearchOpen={setSearchOpen}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
};

export default AppLayout;
