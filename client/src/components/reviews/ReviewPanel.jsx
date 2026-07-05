import React, { useState } from "react";
import { FiCheckCircle, FiRefreshCw, FiXCircle } from "react-icons/fi";

export default function ReviewPanel({ onSubmit, isSubmitting }) {
  const [comment, setComment] = useState("");

  const handleAction = (decision) => {
    if (decision !== "Approved" && !comment.trim()) {
      alert("Please provide comments explaining the reason for this decision.");
      return;
    }
    onSubmit({ decision, reviewComments: comment });
  };

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20, marginTop: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px 0" }}>Review Report Action</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          placeholder="Add reviewer feedback, suggestions, or reason for decision..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input-text"
          style={{ width: "100%", minHeight: 90 }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ borderColor: "var(--color-warning)", color: "var(--color-warning-hover)", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => handleAction("Needs Revision")}
            disabled={isSubmitting}
          >
            <FiRefreshCw /> Request Revision
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => handleAction("Rejected")}
            disabled={isSubmitting}
          >
            <FiXCircle /> Reject
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: "var(--color-success)", borderColor: "var(--color-success)", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => handleAction("Approved")}
            disabled={isSubmitting}
          >
            <FiCheckCircle /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
