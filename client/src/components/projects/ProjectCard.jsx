import { useNavigate } from "react-router-dom";
import { getInitials, formatDate, priorityBadgeClass } from "../../utils/formatters";
import { FiUsers, FiClock } from "react-icons/fi";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const membersCount = project.members?.length || 0;

  const totalTasks = project.taskStats?.total || 0;
  const completedTasks = project.taskStats?.completed || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="project-card"
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      <div className="project-card-header">
        <h3 className="project-card-title">{project.name}</h3>
        <span className={`badge ${priorityBadgeClass(project.priority)}`}>
          {project.priority}
        </span>
      </div>

      <p className="project-card-desc">
        {project.description || "No description provided."}
      </p>

      {project.tags && project.tags.length > 0 && (
        <div className="project-card-tags">
          {project.tags.slice(0, 3).map((t) => (
            <span key={t} className="project-card-tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="project-card-footer">
        <div className="project-card-progress">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-label">{project.status}</div>
        </div>

        <div className="avatar-stack">
          {project.members?.slice(0, 3).map((m) => (
            <div
              key={m.user?._id || m._id}
              className="avatar avatar-sm"
              title={m.user?.name}
              style={{ fontSize: 9 }}
            >
              {getInitials(m.user?.name)}
            </div>
          ))}
          {membersCount > 3 && (
            <div className="avatar avatar-sm" style={{ background: "var(--color-surface-raised)", fontSize: 9 }}>
              +{membersCount - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;