import React from "react";
import { FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEdit3 } from "react-icons/fi";

const ReviewStatusBadge = ({ status }) => {
  let badgeClass = "badge ";
  let icon = null;

  switch (status) {
    case "Draft":
      badgeClass += "badge-priority-low";
      icon = <FiEdit3 size={12} />;
      break;
    case "Submitted":
      badgeClass += "badge-active";
      icon = <FiClock size={12} />;
      break;
    case "Under Review":
      badgeClass += "badge-onhold";
      icon = <FiClock size={12} />;
      break;
    case "Approved":
      badgeClass += "badge-completed";
      icon = <FiCheckCircle size={12} />;
      break;
    case "Rejected":
      badgeClass += "badge-archived";
      icon = <FiXCircle size={12} />;
      break;
    case "Needs Revision":
      badgeClass += "badge-priority-medium";
      icon = <FiAlertTriangle size={12} />;
      break;
    default:
      badgeClass += "badge-priority-low";
      icon = <FiClock size={12} />;
  }

  return (
    <span className={badgeClass} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
      {icon}
      <span>{status}</span>
    </span>
  );
};

export default ReviewStatusBadge;
