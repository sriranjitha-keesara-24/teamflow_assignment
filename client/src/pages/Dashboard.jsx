import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getProjects } from "../services/projectService";
import { taskService } from "../services/taskService";
import { rcaService } from "../services/rcaService";
import { formatDate } from "../utils/formatters";
import { FiFolder, FiCheckSquare, FiActivity, FiClock, FiCheck, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    overdueCount: 0,
    completedCount: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes, rcasRes] = await Promise.all([
          getProjects({ limit: 4 }),
          taskService.getMyTasks({ limit: 50 }),
          rcaService.getAll(),
        ]);

        const allProjects = projectsRes.data || [];
        const myTasks = tasksRes.data || [];

        const activeTasks = myTasks.filter((t) => t.status !== "Completed");
        const completedTasks = myTasks.filter((t) => t.status === "Completed");

        // Count overdue tasks
        const now = new Date();
        const overdue = activeTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now
        );

        setStats({
          projectsCount: allProjects.length,
          tasksCount: activeTasks.length,
          overdueCount: overdue.length,
          completedCount: completedTasks.length,
        });

        setRecentProjects(allProjects.slice(0, 4));

        // Get upcoming deadlines sorted
        const deadlines = activeTasks
          .filter((t) => t.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
        setUpcomingDeadlines(deadlines);

      } catch (err) {
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getDeadlineClass = (dueDateStr) => {
    const diff = new Date(dueDateStr) - new Date();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return "urgent";
    if (days <= 3) return "soon";
    return "normal";
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="container" style={{ animation: "fadeIn 0.35s ease" }}>
      <div className="dashboard-greeting">
        <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
        <p>Here is what's happening on your team today.</p>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats">
        <div className="dash-stat-card" onClick={() => navigate("/projects")}>
          <div className="dash-stat-icon projects">
            <FiFolder />
          </div>
          <div className="dash-stat-content">
            <h3>Active Projects</h3>
            <div className="value">{stats.projectsCount}</div>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate("/my-tasks")}>
          <div className="dash-stat-icon tasks">
            <FiCheckSquare />
          </div>
          <div className="dash-stat-content">
            <h3>My Pending Tasks</h3>
            <div className="value">{stats.tasksCount}</div>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate("/my-tasks")}>
          <div className="dash-stat-icon overdue">
            <FiClock />
          </div>
          <div className="dash-stat-content">
            <h3>Overdue Tasks</h3>
            <div className="value" style={{ color: "var(--color-danger)" }}>
              {stats.overdueCount}
            </div>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate("/my-tasks")}>
          <div className="dash-stat-icon completed">
            <FiCheck />
          </div>
          <div className="dash-stat-content">
            <h3>Completed Tasks</h3>
            <div className="value">{stats.completedCount}</div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Projects Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent Projects</h2>
            <Link to="/projects" className="dashboard-section-link">
              View all <FiArrowRight style={{ verticalAlign: "middle" }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentProjects.length === 0 ? (
              <div className="empty-state" style={{ padding: "30px 10px" }}>
                <h3>No projects yet</h3>
                <p>Create a project to start planning tasks.</p>
              </div>
            ) : (
              recentProjects.map((p) => (
                <div
                  key={p._id}
                  className="recent-project-item"
                  onClick={() => navigate(`/projects/${p._id}`)}
                >
                  <div className="recent-project-icon">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="recent-project-info">
                    <div className="recent-project-name">{p.name}</div>
                    <div className="recent-project-meta">
                      {p.status} • {p.members?.length || 0} members
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines Section */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Upcoming Deadlines</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state" style={{ padding: "30px 10px" }}>
                <h3>No deadlines approaching</h3>
                <p>You have no pending tasks with due dates.</p>
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="deadline-item"
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`deadline-dot ${getDeadlineClass(task.dueDate)}`} />
                  <div className="deadline-info">
                    <div className="deadline-task">{task.title}</div>
                    <div className="deadline-project">{task.project?.name}</div>
                  </div>
                  <div className="deadline-date">{formatDate(task.dueDate)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;