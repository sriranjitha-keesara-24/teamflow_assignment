import { useEffect, useState } from "react";
import { commentService } from "../../services/commentService";
import { getInitials, formatDate } from "../../utils/formatters";
import { FiSend, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const CommentSection = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedMentions, setSelectedMentions] = useState([]);

  const fetchComments = async () => {
    try {
      const res = await commentService.getComments(taskId);
      setComments(res.comments || res.data || []);
    } catch (err) {
      console.error("Could not load comments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const taskRes = await api.get(`/tasks/${taskId}`);
        const taskObj = taskRes.data?.data || taskRes.data;
        const projId = taskObj.project?._id || taskObj.project;
        if (projId) {
          const projRes = await api.get(`/projects/${projId}`);
          const projObj = projRes.data?.data || projRes.data;
          setProjectMembers(projObj.members || []);
        }
      } catch (err) {
        console.error("Failed to load project members for comments", err);
      }
    };
    if (taskId) {
      fetchComments();
      fetchProjectMembers();
    }
  }, [taskId]);

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setNewComment(val);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query.toLowerCase());
        setMentionIndex(lastAtIdx);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = (member) => {
    if (!member.user) return;
    const textBefore = newComment.slice(0, mentionIndex);
    const textAfter = newComment.slice(mentionIndex + mentionQuery.length + 1);
    const updatedText = `${textBefore}@${member.user.name} ${textAfter}`;
    setNewComment(updatedText);
    setSelectedMentions((prev) => [...new Set([...prev, member.user._id])]);
    setShowMentions(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await commentService.createComment(taskId, newComment, selectedMentions);
      setComments((prev) => [...prev, res.comment || res.data]);
      setNewComment("");
      setSelectedMentions([]);
      toast.success("Comment added");
    } catch (err) {
      toast.error("Could not send comment");
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const res = await commentService.updateComment(taskId, commentId, editingText);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.comment || res.data : c))
      );
      setEditingId(null);
      setEditingText("");
      toast.success("Comment updated");
    } catch (err) {
      toast.error("Could not update comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await commentService.deleteComment(taskId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Could not delete comment");
    }
  };

  const filteredMembers = projectMembers.filter(
    (m) =>
      m.user &&
      m.user.name &&
      m.user.name.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="task-detail-section">
      <h3 className="task-detail-section-title">Discussion</h3>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="avatar avatar-sm">
                {getInitials(comment.author?.name)}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{comment.author?.name}</span>
                  <span className="comment-time">{formatDate(comment.createdAt)}</span>
                </div>

                {editingId === comment._id ? (
                  <div style={{ marginTop: 6 }}>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={{ width: "100%", minHeight: 60, marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleUpdate(comment._id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.content}</p>
                    <div className="comment-actions">
                      <button
                        className="comment-action-btn"
                        onClick={() => {
                          setEditingId(comment._id);
                          setEditingText(comment.content);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="comment-action-btn"
                        style={{ color: "var(--color-danger)" }}
                        onClick={() => handleDelete(comment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-input-area" onSubmit={handleSend} style={{ position: "relative" }}>
        {showMentions && filteredMembers.length > 0 && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            maxHeight: 180,
            overflowY: "auto",
            zIndex: 10,
            minWidth: 220,
            padding: "4px 0"
          }}>
            {filteredMembers.map((member) => (
              <div
                key={member.user._id}
                onMouseDown={() => handleSelectMention(member)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background 0.2s",
                  borderBottom: "1px solid var(--color-border)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <div className="avatar" style={{ width: 22, height: 22, fontSize: 8, flexShrink: 0 }}>
                  {getInitials(member.user.name)}
                </div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  <div style={{ fontWeight: 650, color: "var(--color-text)", whiteSpace: "nowrap" }}>{member.user.name}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{member.user.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <textarea
          placeholder="Write a comment... (use @ to mention)"
          value={newComment}
          onChange={handleTextareaChange}
          onBlur={() => setTimeout(() => setShowMentions(false), 200)}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: 44, height: 44, padding: 0, borderRadius: "var(--radius-md)" }}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
