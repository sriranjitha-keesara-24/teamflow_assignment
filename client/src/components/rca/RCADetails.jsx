import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { rcaService } from '../../services/rcaService';
import taskService from '../../services/taskService';
import ReviewPanel from '../reviews/ReviewPanel';
import FileUpload from '../attachments/FileUpload';
import FilePreview from '../attachments/FilePreview';
import RCAForm from './RCAForm';
import Modal from '../common/Modal';
import {
  Calendar,
  User,
  FileText,
  Send,
  Trash2,
  ArrowLeft,
  Paperclip,
  Edit3,
  FolderOpen,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeTime, formatDateTime } from '../../utils/formatDate';

// Status timeline steps
const WORKFLOW = [
  { key: 'Draft', label: 'Draft', icon: Edit3 },
  { key: 'Submitted', label: 'Submitted', icon: Send },
  { key: 'Under Review', label: 'Under Review', icon: Clock },
  { key: 'Approved', label: 'Approved', icon: CheckCircle2 },
];

const STATUS_STEP = {
  Draft: 0, Submitted: 1, 'Under Review': 2, Approved: 3, Rejected: 3, 'Needs Revision': 2,
};

const STATUS_BADGE = {
  Draft: 'badge badge-priority-low',
  Submitted: 'badge badge-active',
  'Under Review': 'badge badge-onhold',
  Approved: 'badge badge-completed',
  Rejected: 'badge badge-archived',
  'Needs Revision': 'badge badge-onhold',
};

const WorkflowTimeline = ({ status }) => {
  const currentStep = STATUS_STEP[status] ?? 0;
  const isRejected = status === 'Rejected';
  const isRevision = status === 'Needs Revision';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
      {WORKFLOW.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentStep;
        const isCurrent = idx === currentStep;
        const isTerminalFail = (isRejected || isRevision) && idx === currentStep;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  background: isCurrent && isTerminalFail ? 'var(--color-danger)' : isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isActive || isCurrent ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {isCurrent && isTerminalFail ? <XCircle size={16} /> : <Icon size={16} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                {isCurrent && (isRejected ? 'Rejected' : isRevision ? 'Revision' : step.label)}
                {!isCurrent && step.label}
              </span>
            </div>
            {idx < WORKFLOW.length - 1 && (
              <div style={{ width: 40, height: 2, background: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)', marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Section = ({ title, content, icon: Icon }) => {
  if (!content) return null;
  return (
    <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
        {Icon && <Icon size={13} />}
        {title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
        {content}
      </p>
    </div>
  );
};

const RCADetails = ({ rcaId, onBack, currentUserId, isAdmin, members = [], tasks = [] }) => {
  const [rca, setRca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedNewReviewer, setSelectedNewReviewer] = useState('');
  const [localMembers, setLocalMembers] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);

  const activeMembers = members.length ? members : localMembers;
  const activeTasks = tasks.length ? tasks : localTasks;

  const handleReassignReviewer = async () => {
    if (!selectedNewReviewer) return;
    try {
      setIsReassigning(true);
      const res = await api.put(`/rca/${rcaId}/reassign`, {
        newReviewerId: selectedNewReviewer,
      });
      setRca(res.data?.data || res.data);
      toast.success('Reviewer reassigned successfully');
    } catch (err) {
      toast.error('Failed to reassign reviewer');
    } finally {
      setIsReassigning(false);
      setSelectedNewReviewer('');
    }
  };

  const handleEscalateRCA = async () => {
    try {
      setIsReassigning(true);
      const res = await api.put(`/rca/${rcaId}/escalate`);
      setRca(res.data?.data || res.data);
      toast.success('RCA escalated to project owner');
    } catch (err) {
      toast.error('Failed to escalate RCA');
    } finally {
      setIsReassigning(false);
    }
  };

  const fetchRCADetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rcaService.getRCA(rcaId);
      const rcaData = res.data || res;
      setRca(rcaData);
      const attachRes = await api.get(`/rca/${rcaId}/attachments`);
      setAttachments(attachRes.data.data || []);

      if (rcaData.project?._id) {
        // Fetch project to get members list
        const projRes = await api.get(`/projects/${rcaData.project._id}`);
        const projData = projRes.data?.data || projRes.data;
        setLocalMembers(projData.members || []);

        // Fetch project tasks list
        const tasksRes = await taskService.getTasks(rcaData.project._id);
        setLocalTasks(tasksRes.data?.data || tasksRes.data || []);
      }
    } catch (err) {
      console.error("fetchRCADetails error details:", err);
      toast.error('Failed to load RCA details');
    } finally {
      setLoading(false);
    }
  }, [rcaId]);

  useEffect(() => {
    fetchRCADetails();
  }, [fetchRCADetails]);

  const handleUploadAttachment = async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/rca/${rcaId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments((prev) => [response.data.data, ...prev]);
      toast.success('Evidence file uploaded');
    } catch (err) {
      toast.error('Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      toast.success('Attachment deleted');
    } catch (err) {
      toast.error('Failed to delete attachment');
    }
  };

  const handleSubmitRCA = async () => {
    try {
      const res = await rcaService.submitRCA(rcaId);
      setRca(res.data || res);
      toast.success('RCA submitted for review');
    } catch (err) {
      toast.error('Failed to submit RCA');
    }
  };

  const handleReviewRCA = async ({ decision, reviewComments }) => {
    try {
      setIsReviewing(true);
      const res = await rcaService.reviewRCA(rcaId, decision, reviewComments);
      setRca(res.data || res);
      toast.success(`RCA marked as ${decision}`);
    } catch (err) {
      toast.error('Failed to save review');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleUpdateRCA = async (formData) => {
    try {
      const res = await rcaService.updateRCA(rcaId, formData);
      setRca(res.data || res);
      setIsEditOpen(false);
      toast.success('RCA report updated');
    } catch (err) {
      toast.error('Failed to update RCA');
    }
  };

  const handleDeleteRCA = async () => {
    if (!confirm('Are you sure you want to permanently delete this RCA report?')) return;
    try {
      await rcaService.deleteRCA(rcaId);
      toast.success('RCA deleted');
      onBack();
    } catch (err) {
      toast.error('Failed to delete RCA');
    }
  };

  if (loading || !rca) {
    return (
      <div className="loading-center" style={{ minHeight: 250 }}>
        <div className="spinner" />
      </div>
    );
  }

  const isSubmitter = rca.submitter?._id === currentUserId || rca.submitter === currentUserId;
  const isReviewer = rca.reviewer?._id === currentUserId || rca.reviewer === currentUserId;
  const canEdit = isSubmitter && ['Draft', 'Needs Revision'].includes(rca.status);
  const canDelete = (isSubmitter || isAdmin) && rca.status === 'Draft';
  const showSubmitBtn = isSubmitter && ['Draft', 'Needs Revision'].includes(rca.status);
  const showReviewPanel = (isReviewer || isAdmin) && ['Submitted', 'Under Review'].includes(rca.status);

  const badgeClass = STATUS_BADGE[rca.status] || STATUS_BADGE.Draft;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>

      {/* Header buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={14} /> Back to RCA List
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={13} /> Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDeleteRCA}
              className="btn btn-secondary"
              style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)", display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          {showSubmitBtn && (
            <button
              onClick={handleSubmitRCA}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={13} /> Submit RCA
            </button>
          )}
          <span className={badgeClass}>
            {rca.status}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <WorkflowTimeline status={rca.status} />

      {/* Feedback Banner */}
      {rca.reviewComments && ['Rejected', 'Needs Revision'].includes(rca.status) && (
        <div style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-warning-dim)', border: '1px solid var(--color-warning)', color: 'var(--color-warning-hover)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Reviewer Feedback</p>
            <p style={{ margin: 0, fontSize: 13.5 }}>{rca.reviewComments}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>{rca.title}</h2>
            <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: 0 }}>
              Created: {formatDateTime(rca.createdAt)}
              {rca.updatedAt !== rca.createdAt && ` · Updated ${formatRelativeTime(rca.updatedAt)}`}
            </p>

            <Section title="Incident Description" content={rca.incidentDescription} icon={FileText} />
            <Section title="Scope of Impact" content={rca.impact} icon={AlertTriangle} />
            <Section title="Root Cause Analysis" content={rca.rootCause} icon={RefreshCw} />
            <Section title="Resolution & Preventative Actions" content={rca.resolutionSteps} icon={CheckCircle2} />
          </div>

          {/* Evidence Attachments */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Paperclip size={16} /> Evidence &amp; Attachments
            </h3>
            {canEdit && (
              <FileUpload onUpload={handleUploadAttachment} isUploading={isUploading} />
            )}
            <FilePreview
              attachments={attachments}
              onDelete={handleDeleteAttachment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              Report Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
              {rca.project && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><FolderOpen size={13} /> Project</span>
                  <span style={{ fontWeight: 600 }}>{rca.project.name}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} /> Submitter</span>
                <span style={{ fontWeight: 600 }}>{rca.submitter?.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><UserCheck size={13} /> Reviewer</span>
                <span style={{ fontWeight: 600 }}>{rca.reviewer?.name}</span>
              </div>
            </div>

            {/* Escalate / Reassign features */}
            {(isAdmin || isSubmitter) && ['Submitted', 'Under Review'].includes(rca.status) && (
              <div style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Reviewer Operations</h4>

                {/* Reassign dropdown */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={selectedNewReviewer}
                    onChange={(e) => setSelectedNewReviewer(e.target.value)}
                    className="input-text"
                    style={{ flex: 1, height: 32, fontSize: 12 }}
                  >
                    <option value="">Reassign reviewer...</option>
                    {activeMembers.filter(m => (m.user?._id || m._id) !== (rca.reviewer?._id || rca.reviewer)).map((m) => {
                      const u = m.user || m;
                      return (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      );
                    })}
                  </select>
                  <button
                    onClick={handleReassignReviewer}
                    disabled={!selectedNewReviewer || isReassigning}
                    className="btn btn-secondary"
                    style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                  >
                    Reassign
                  </button>
                </div>

                {/* Escalate button */}
                <button
                  onClick={handleEscalateRCA}
                  disabled={isReassigning}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: 12, height: 32, color: 'var(--color-warning-hover)', borderColor: 'var(--color-warning)' }}
                >
                  Escalate to Project Owner
                </button>
              </div>
            )}
          </div>

          {/* Review Panel */}
          {showReviewPanel && (
            <ReviewPanel onSubmit={handleReviewRCA} isSubmitting={isReviewing} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit RCA Report Draft"
          size="lg"
        >
          <RCAForm
            onSubmit={handleUpdateRCA}
            members={activeMembers}
            tasks={activeTasks}
            defaultValues={{
              title: rca.title,
              task: rca.task?._id || rca.task || '',
              reviewer: rca.reviewer?._id || rca.reviewer || '',
              incidentDescription: rca.incidentDescription,
              impact: rca.impact || '',
              rootCause: rca.rootCause || '',
              resolutionSteps: rca.resolutionSteps || '',
            }}
            submitLabel="Save Changes"
          />
        </Modal>
      )}
    </div>
  );
};

export default RCADetails;
