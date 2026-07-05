import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { rcaService } from "../services/rcaService";
import { getProjectById } from "../services/projectService";
import { formatDate } from "../utils/formatters";
import useAuth from "../hooks/useAuth";
import { FiArrowLeft, FiActivity, FiUser, FiFolder, FiCheckSquare, FiAlertCircle, FiTrendingUp } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/rca.css";

const RCADetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rca, setRca] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review inputs
  const [reviewComments, setReviewComments] = useState("");
  const [newReviewerId, setNewReviewerId] = useState("");

  const loadRCAData = async () => {
    try {
      const data = await rcaService.get(id);
      setRca(data.data);
      setReviewComments(data.data.reviewComments || "");
      
      if (data.data.reviewer) {
        setNewReviewerId(data.data.reviewer._id);
      }

      // Load project to check member roles
      const projectData = await getProjectById(data.data.project._id);
      setProject(projectData.data || projectData.project);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load RCA log");
      navigate("/rca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRCAData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !rca) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  // Authorisation Checks
  const isSubmitter = rca.submitter?._id === user.id;
  const isReviewer = rca.reviewer?._id === user.id;
  const isProjectOwner = project?.owner?._id === user.id;
  const userMemberEntry = project?.members?.find((m) => m.user?._id === user.id);
  const isManager = isProjectOwner || userMemberEntry?.role === "Lead" || userMemberEntry?.role === "Member" || user.role === "Admin" || user.role === "Manager";

  const handleAction = async (actionFn, successMessage) => {
    try {
      setLoading(true);
      await actionFn();
      toast.success(successMessage);
      await loadRCAData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to project details, switch tab to RCA, and edit it.
    // For simplicity, we can let user edit directly or show a message.
    toast.error("RCA editing is managed from the project workspace.");
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <Link
        to="/rca"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-muted)",
          fontSize: 13.5,
          marginBottom: 20,
        }}
      >
        <FiArrowLeft size={14} /> Back to RCA logs
      </Link>

      <div className="rca-detail-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 className="rca-detail-title">{rca.title}</h1>
            <span className={`rca-status-badge ${rca.status.replace(" ", "-")}`}>
              {rca.status}
            </span>
          </div>

          <div className="rca-detail-meta">
            <div className="rca-card-meta-item">
              <FiFolder />
              <span>Project: <strong>{rca.project?.name}</strong></span>
            </div>
            {rca.task && (
              <div className="rca-card-meta-item">
                <FiCheckSquare />
                <span>Task: <strong>{rca.task?.title}</strong></span>
              </div>
            )}
            <div className="rca-card-meta-item">
              <FiUser />
              <span>Author: <strong>{rca.submitter?.name}</strong></span>
            </div>
            <div className="rca-card-meta-item">
              <span>Reviewer: <strong>{rca.reviewer?.name || "Unassigned"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main RCA Fields */}
      <div className="rca-section">
        <h3 className="rca-section-title">
          <FiAlertCircle /> Incident Description
        </h3>
        <p className="rca-section-content">{rca.incidentDescription}</p>
      </div>

      <div className="rca-section">
        <h3 className="rca-section-title">
          <FiTrendingUp /> Impact Details
        </h3>
        <p className="rca-section-content">{rca.impact || "No impact details documented."}</p>
      </div>

      <div className="rca-section">
        <h3 className="rca-section-title">Root Cause</h3>
        <p className="rca-section-content">{rca.rootCause || "No root cause documented."}</p>
      </div>

      <div className="rca-section">
        <h3 className="rca-section-title">Resolution Steps</h3>
        <p className="rca-section-content">{rca.resolutionSteps || "No resolution steps documented."}</p>
      </div>

      {rca.reviewComments && (
        <div className="rca-review-area" style={{ marginBottom: 20 }}>
          <h3 className="rca-review-title">Review Comments</h3>
          <p className="rca-section-content">{rca.reviewComments}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="rca-actions">
        {/* Submit action for Submitter */}
        {isSubmitter && (rca.status === "Draft" || rca.status === "Needs Revision") && (
          <button
            className="btn btn-primary"
            onClick={() => handleAction(() => rcaService.submit(rca._id), "RCA submitted for review")}
          >
            Submit for Review
          </button>
        )}

        {/* Escalation Option */}
        {(isSubmitter || isReviewer) && rca.status === "Submitted" && (
          <button
            className="btn btn-secondary"
            onClick={() => handleAction(() => rcaService.escalate(rca._id), "RCA review escalated")}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            Escalate Review
          </button>
        )}
      </div>

      {/* Reviewer Action Form Panel */}
      {(isReviewer || isManager) && rca.status === "Submitted" && (
        <div className="rca-review-area">
          <h3 className="rca-review-title">Submit Review Decision</h3>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Feedback comments</label>
            <textarea
              placeholder="Add feedback notes, request items, or approval comments..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows={4}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() =>
                handleAction(
                  () => rcaService.review(rca._id, { status: "Approved", reviewComments }),
                  "RCA report Approved"
                )
              }
            >
              Approve RCA
            </button>
            <button
              className="btn btn-secondary"
              onClick={() =>
                handleAction(
                  () => rcaService.review(rca._id, { status: "Needs Revision", reviewComments }),
                  "Requested revisions from submitter"
                )
              }
            >
              Request Revision
            </button>
            <button
              className="btn btn-danger"
              onClick={() =>
                handleAction(
                  () => rcaService.review(rca._id, { status: "Rejected", reviewComments }),
                  "RCA report Rejected"
                )
              }
            >
              Reject RCA
            </button>
          </div>
        </div>
      )}

      {/* Reviewer Reassignment Panel for Lead/Owner/Admin */}
      {isManager && project?.members && (
        <div className="rca-review-area" style={{ marginTop: 20 }}>
          <h3 className="rca-review-title">Reassign Reviewer</h3>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Select a project member as reviewer</label>
            <select
              value={newReviewerId}
              onChange={(e) => setNewReviewerId(e.target.value)}
              style={{ width: "100%", maxWidth: 360 }}
            >
              <option value="">-- Choose Member --</option>
              {project.members.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!newReviewerId}
            onClick={() =>
              handleAction(
                () => rcaService.reassign(rca._id, { reviewerId: newReviewerId }),
                "RCA Reviewer reassigned"
              )
            }
          >
            Update Reviewer
          </button>
        </div>
      )}
    </div>
  );
};

export default RCADetail;
