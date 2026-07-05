import { useEffect, useState } from "react";
import { commentService } from "../../services/commentService";
import { getInitials, formatDate } from "../../utils/formatters";
import { FiSend, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const CommentSection = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);

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
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await commentService.createComment(taskId, newComment);
      setComments((prev) => [...prev, res.comment || res.data]);
      setNewComment("");
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

      <form className="comment-input-area" onSubmit={handleSend}>
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
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
