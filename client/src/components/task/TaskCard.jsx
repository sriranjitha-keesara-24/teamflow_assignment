import DependencyBadge from "./DependencyBadge";
import { getInitials, formatDate } from "../../utils/formatters";
import { FiClock, FiCheckSquare } from "react-icons/fi";

export default function TaskCard({ task, onClick, draggable = true, onDragStart }) {
  // Subtasks progress calculation
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onClick={() => onClick?.(task)}
      className="task-card"
    >
      {/* Priority accent line */}
      <div className={`task-card-priority ${task.priority}`} />

      <h4 className="task-card-title">{task.title}</h4>

      {task.tags?.length > 0 && (
        <div className="task-card-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="task-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="task-subtask-progress">
          <div className="task-subtask-bar">
            <div className="task-subtask-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="task-subtask-label">
            {completedSubtasks}/{totalSubtasks} Checklist
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="task-card-footer">
        <div className="task-card-meta">
          {task.dueDate && (
            <div className="task-card-meta-item">
              <FiClock size={12} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        <div className="task-card-assignees">
          {task.assignees?.map((a) => (
            <div key={a._id} className="avatar avatar-sm" title={a.name}>
              {getInitials(a.name)}
            </div>
          ))}
        </div>
      </div>

      {/* Dependency Badging */}
      {task.isBlocked && (
        <div style={{ marginTop: 8 }}>
          <DependencyBadge blockedBy={task.blockedBy} />
        </div>
      )}
    </div>
  );
}