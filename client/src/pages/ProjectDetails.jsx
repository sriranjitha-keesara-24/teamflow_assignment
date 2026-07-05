import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit2, FiArchive, FiTrash2, FiFileText, FiPlus, FiDownload } from "react-icons/fi";
import { getProjectById, getProjectStats, setArchiveStatus, deleteProject } from "../services/projectService";
import { rcaService } from "../services/rcaService";
import { reportService } from "../services/reportService";
import ProjectModal from "../components/projects/ProjectModal";
import MemberList from "../components/projects/MemberList";
import ProjectTasks from "../components/task/ProjectTasks";
import RCAPage from "./RCAPage";
import useAuth from "../hooks/useAuth";
import { statusBadgeClass, priorityBadgeClass, formatDate } from "../utils/formatters";
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

  const loadProjectData = async () => {
    try {
      const projectRes = await getProjectById(id);
      setProject(projectRes.data || projectRes.project);

      const statsRes = await getProjectStats(id);
      setStats(statsRes.data);

      const rcaRes = await rcaService.getByProject(id);
      setRcas(rcaRes.data || []);
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

  const isOwner = project.owner?._id === user.id;
  const memberEntry = project.members?.find((m) => m.user?._id === user.id);
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
              currentUserId={user.id}
              canManage={canManage}
            />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Export Project Workspace Data</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
              Export project tasks, checklists, priorities, and root cause analysis incident logs into formatted CSV files.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <button
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => handleExportCSV("tasks")}
              >
                <FiDownload /> Download Tasks CSV
              </button>
              <button
                className="btn btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => handleExportCSV("rca")}
              >
                <FiDownload /> Download RCA Logs CSV
              </button>
            </div>
          </div>
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