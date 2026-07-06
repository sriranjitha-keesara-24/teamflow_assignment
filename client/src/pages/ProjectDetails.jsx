import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit2, FiArchive, FiTrash2, FiFileText, FiPlus, FiDownload, FiFolder, FiCheckSquare, FiAlertCircle, FiActivity } from "react-icons/fi";
import { getProjectById, getProjectStats, setArchiveStatus, deleteProject, getProjectActivities } from "../services/projectService";
import { rcaService } from "../services/rcaService";
import { reportService } from "../services/reportService";
import StatCard from "../components/analytics/StatCard";
import {
  ProjectHealthWidget,
  TaskStatusChart,
  RCAStatusChart,
  TeamWorkloadChart,
  RcaTrendChart,
} from "../components/analytics/ChartWidgets";
import ExportButton from "../components/analytics/ExportButton";
import ProjectModal from "../components/projects/ProjectModal";
import MemberList from "../components/projects/MemberList";
import ProjectTasks from "../components/task/ProjectTasks";
import RCAPage from "./RCAPage";
import useAuth from "../hooks/useAuth";
import { statusBadgeClass, priorityBadgeClass, formatDate, getInitials } from "../utils/formatters";
import { formatRelativeTime } from "../utils/formatDate";
import "../styles/Projects.css"
import "../styles/rca.css";

const TABS = ["Overview", "Tasks", "RCA Reports", "Reports & Export"];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [rcas, setRcas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Tab State
  const [activeTab, setActiveTab] = useState("Overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRcaModal, setShowRcaModal] = useState(false);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadReportData = async () => {
      if (activeTab === "Reports & Export" && !dashboardReport) {
        try {
          setReportLoading(true);
          const res = await reportService.getDashboardReport(id);
          setDashboardReport(res.data || res);
        } catch (err) {
          console.error("Error loading dashboard report:", err);
          toast.error("Failed to load project reports");
        } finally {
          setReportLoading(false);
        }
      }
    };
    loadReportData();
  }, [activeTab, id, dashboardReport]);

  const loadProjectData = async () => {
    try {
      const projectRes = await getProjectById(id);
      setProject(projectRes.data || projectRes.project);

      const statsRes = await getProjectStats(id);
      setStats(statsRes.data);

      const rcaRes = await rcaService.getByProject(id);
      setRcas(rcaRes.data || []);

      const activitiesRes = await getProjectActivities(id);
      setActivities(activitiesRes.activities || []);
    } catch (err) {
      console.error("Error loading project data:", err);
      toast.error(err.response?.data?.message || "Could not load project");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !project) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const isOwner = project.owner?._id === (user._id || user.id);
  const memberEntry = project.members?.find((m) => m.user?._id === (user._id || user.id));
  const canManage = isOwner || memberEntry?.role === "Lead" || memberEntry?.role === "Manager" || user.role === "Admin" || user.role === "Manager";

  const handleArchiveToggle = async () => {
    try {
      const archived = project.status !== "Archived";
      const data = await setArchiveStatus(project._id, archived);
      setProject(data.project);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project._id);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete project");
    }
  };

  const handleExportCSV = async (type = "tasks") => {
    try {
      const res = await reportService.exportProjectData(project._id, type);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `project-${project.name}-${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type.toUpperCase()} CSV export downloaded successfully`);
    } catch (err) {
      toast.error("Failed to export project data");
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <Link
        to="/projects"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-muted)",
          fontSize: 13.5,
          marginBottom: 20,
        }}
      >
        <FiArrowLeft size={14} /> Back to projects
      </Link>

      {/* Project Header */}
      <div className="project-details-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{project.name}</h1>
            <span className={statusBadgeClass(project.status)}>{project.status}</span>
            <span className={priorityBadgeClass(project.priority)}>{project.priority}</span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, maxWidth: 560 }}>
            {project.description || "No description provided."}
          </p>
        </div>

        {canManage && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowEditModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleArchiveToggle}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FiArchive size={14} />
              {project.status === "Archived" ? "Restore" : "Archive"}
            </button>
            {(isOwner || user.role === "Admin") && (
              <button
                className="btn btn-sm btn-danger"
                onClick={handleDelete}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <FiTrash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar" style={{ marginBottom: 28 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Stats cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-label">Team size</div>
              <div className="stat-value">{project.members?.length || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tasks done</div>
              <div className="stat-value">{stats?.completed || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overdue tasks</div>
              <div className="stat-value" style={{ color: "var(--color-danger)" }}>
                {stats?.overdue || 0}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Deadline</div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {formatDate(project.deadline)}
              </div>
            </div>
          </div>

          {/* Member List */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
            <MemberList
              projectId={project._id}
              currentUserId={user._id || user.id}
              canManage={canManage}
              onMembersUpdated={(updatedMembers) => {
                setProject((prev) => ({ ...prev, members: updatedMembers }));
              }}
            />
          </div>

          {/* Recent Activity Feed */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <FiActivity style={{ color: "var(--color-primary-hover)" }} /> Recent Project Activity
            </h3>
            {activities.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>No recent activities logged for this project.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                {activities.map((act) => (
                  <div key={act._id} style={{ display: "flex", gap: 12, fontSize: 13, borderBottom: "1px solid var(--color-border)", paddingBottom: 10 }}>
                    <div className="avatar" style={{ fontSize: 9, width: 24, height: 24, flexShrink: 0 }}>
                      {act.user?.avatar ? (
                        <img src={act.user.avatar.startsWith("http") ? act.user.avatar : `${import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")}${act.user.avatar}`} alt={act.user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        getInitials(act.user?.name)
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 650, color: "var(--color-text)" }}>{act.user?.name || "System"}</span>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                      <p style={{ color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {act.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
          <ProjectTasks projectId={project._id} projectMembers={project.members || []} />
        </div>
      )}

      {activeTab === "RCA Reports" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
          <RCAPage projectId={project._id} members={project.members || []} />
        </div>
      )}

      {activeTab === "Reports & Export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {reportLoading ? (
            <div className="loading-center" style={{ minHeight: 250 }}>
              <div className="spinner" />
            </div>
          ) : !dashboardReport ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
              No report data available.
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="stat-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <StatCard
                  title="Total Tasks"
                  value={dashboardReport.taskStats?.completion?.total ?? 0}
                  icon={FiFolder}
                  subtext="Total tasks created in project"
                />
                <StatCard
                  title="Completed Tasks"
                  value={dashboardReport.taskStats?.completion?.completed ?? 0}
                  icon={FiCheckSquare}
                  subtext="Successfully completed tasks"
                  trend="positive"
                  trendValue={`${dashboardReport.taskStats?.completion?.rate ?? 0}% rate`}
                />
                <StatCard
                  title="Overdue Tasks"
                  value={dashboardReport.taskStats?.overdue ?? 0}
                  icon={FiAlertCircle}
                  subtext="Unfinished past due date"
                  trend={(dashboardReport.taskStats?.overdue ?? 0) > 0 ? "negative" : "positive"}
                  trendValue={(dashboardReport.taskStats?.overdue ?? 0) > 0 ? `${dashboardReport.taskStats?.overdue} urgent` : "0 issues"}
                />
                <StatCard
                  title="Active RCAs"
                  value={dashboardReport.rcaStats?.total ?? 0}
                  icon={FiActivity}
                  subtext="Root Cause Analyses created"
                />
              </div>

              {/* Charts Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                <ProjectHealthWidget health={dashboardReport.health} />
                <TaskStatusChart data={dashboardReport.taskStats?.status} />
                <RCAStatusChart data={dashboardReport.rcaStats?.statuses} />
                <TeamWorkloadChart workload={dashboardReport.teamWorkload} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <RcaTrendChart trend={dashboardReport.rcaTrend} />
                </div>
              </div>

              {/* CSV Export panel */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Export Project Workspace Data</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
                  Export project tasks, checklists, priorities, and root cause analysis incident logs into formatted CSV files.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  <ExportButton label="Download Tasks CSV" onExport={() => handleExportCSV("tasks")} type="primary" />
                  <ExportButton label="Download RCA Logs CSV" onExport={() => handleExportCSV("rca")} type="secondary" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Project Edit Modal */}
      {showEditModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProject(updated.project || updated);
            setShowEditModal(false);
            loadProjectData();
          }}
        />
      )}

      {/* RCA Create Modal */}
      {showRcaModal && (
        <RCAModal
          projectId={project._id}
          onClose={() => setShowRcaModal(false)}
          onSaved={loadProjectData}
        />
      )}
    </div>
  );
};

export default ProjectDetails;