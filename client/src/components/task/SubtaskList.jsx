import { useState } from "react";
import { taskService } from "../../services/taskService";
import { FiTrash2, FiPlus, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

const SubtaskList = ({ projectId, taskId, subtasks, onUpdate }) => {
  const [newTitle, setNewTitle] = useState("");

  const handleToggle = async (subtaskId) => {
    try {
      const res = await taskService.toggleSubtask(projectId, taskId, subtaskId);
      onUpdate(res.task || res.data);
    } catch (err) {
      toast.error("Failed to toggle subtask");
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      const res = await taskService.deleteSubtask(projectId, taskId, subtaskId);
      onUpdate(res.task || res.data);
      toast.success("Subtask deleted");
    } catch (err) {
      toast.error("Failed to delete subtask");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await taskService.addSubtask(projectId, taskId, newTitle);
      onUpdate(res.task || res.data);
      setNewTitle("");
      toast.success("Subtask added");
    } catch (err) {
      toast.error("Failed to add subtask");
    }
  };

  return (
    <div className="task-detail-section">
      <h3 className="task-detail-section-title">Checklist</h3>

      <div className="subtask-list">
        {subtasks?.map((sub) => (
          <div key={sub._id} className="subtask-item">
            <div
              className={`subtask-checkbox ${sub.completed ? "checked" : ""}`}
              onClick={() => handleToggle(sub._id)}
            >
              {sub.completed && <FiCheck size={12} />}
            </div>
            <span className={`subtask-title ${sub.completed ? "completed" : ""}`}>
              {sub.title}
            </span>
            <button
              className="subtask-delete"
              onClick={() => handleDelete(sub._id)}
              style={{ display: "inline-flex", alignSelf: "center" }}
            >
              <FiTrash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <form className="subtask-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add an item to the checklist..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          style={{ padding: "0 14px" }}
        >
          <FiPlus size={16} />
        </button>
      </form>
    </div>
  );
};

export default SubtaskList;
