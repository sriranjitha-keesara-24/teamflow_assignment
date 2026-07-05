import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { rcaService } from '../services/rcaService';
import { taskService } from '../services/taskService';
import RCAList from '../components/rca/RCAList';
import RCADetails from '../components/rca/RCADetails';
import RCAForm from '../components/rca/RCAForm';
import Modal from '../components/common/Modal';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Search,
  SlidersHorizontal,
  FileSearch,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Needs Revision'];

const RCAPage = ({ projectId: propProjectId, members = [] }) => {
  const { user: currentUser } = useAuth();
  const { id: urlId } = useParams();

  // If projectId is passed, use it (scoped inside project Details tabs)
  // Otherwise check if a specific rca ID is in URL parameters to load details directly
  const projectId = propProjectId;

  const [rcas, setRcas] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRca, setSelectedRca] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const getErrorMessage = (err, defaultMsg) => {
    return err.response?.data?.message || defaultMsg;
  };

  // Stats derived from RCA list
  const stats = {
    total: rcas.length,
    draft: rcas.filter((r) => r.status === 'Draft').length,
    inReview: rcas.filter((r) => ['Submitted', 'Under Review'].includes(r.status)).length,
    approved: rcas.filter((r) => r.status === 'Approved').length,
    rejected: rcas.filter((r) => ['Rejected', 'Needs Revision'].includes(r.status)).length,
  };

  const fetchRCAs = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (projectId) {
        res = await rcaService.getRCAs(projectId, { search, status: statusFilter });
      } else {
        res = await rcaService.getAllRCAs({ search, status: statusFilter });
      }
      setRcas(res.data || res.data?.data || res || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load RCA cases'));
    } finally {
      setLoading(false);
    }
  }, [projectId, search, statusFilter]);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await taskService.getTasks(projectId);
      setTasks(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRCAs();
    fetchTasks();
  }, [fetchRCAs, fetchTasks]);

  // Load specific RCA if urlId changes (direct route detail view support)
  useEffect(() => {
    if (urlId && !projectId) {
      setSelectedRca({ _id: urlId });
    } else {
      setSelectedRca(null);
    }
  }, [urlId, projectId]);

  const handleCreateRCA = async (formData) => {
    try {
      const res = await rcaService.createRCA(projectId, formData);
      const newRca = res.data || res.data?.data || res;
      setRcas((prev) => [newRca, ...prev]);
      setIsCreateOpen(false);
      toast.success('RCA report draft created');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create RCA report'));
    }
  };

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    fetchRCAs();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const hasActiveFilters = search || statusFilter;

  if (selectedRca) {
    return (
      <RCADetails
        rcaId={selectedRca._id}
        onBack={() => {
          setSelectedRca(null);
          // If we mapped direct URL route details, go back to main rca list page
          if (urlId) {
            window.history.back();
          } else {
            fetchRCAs();
          }
        }}
        currentUserId={currentUser?._id || currentUser?.id}
        isAdmin={currentUser?.role === 'Admin'}
        members={members}
        tasks={tasks}
      />
    );
  }

  const SkeletonCard = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem',
      border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      borderRadius: '8px',
      opacity: 0.6
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ height: '14px', width: '60%', backgroundColor: 'var(--color-surface-hover)', borderRadius: '4px' }} />
        <div style={{ height: '10px', width: '40%', backgroundColor: 'var(--color-surface-hover)', borderRadius: '4px' }} />
      </div>
      <div style={{ height: '24px', width: '80px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '4px' }} />
    </div>
  );

  return (
    <div style={{
      animation: 'fadeIn 0.35s ease-out',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      padding: projectId ? '0' : '30px 24px 80px',
      maxWidth: projectId ? 'none' : '1280px',
      margin: projectId ? '0' : '0 auto'
    }}>

      {/* Page Header (standalone mode) */}
      {!projectId && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
              <FileSearch size={22} style={{ color: 'var(--color-primary-hover)' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.01em' }}>
                Root Cause Analysis
              </h1>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Log, review, and track preventative plans for critical incidents across active projects.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cases</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-hover)' }}>{stats.total}</span>
        </div>
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Review</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning-hover)' }}>{stats.inReview}</span>
        </div>
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{stats.approved}</span>
        </div>
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Revision</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-danger)' }}>{stats.rejected}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {projectId ? (
            <>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                Root Cause Analysis Logs
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Log, review, and track preventative plans for critical incidents
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>
              {rcas.length > 0 ? `Showing ${rcas.length} report${rcas.length !== 1 ? 's' : ''}` : 'No reports logged'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              height: 38,
              background: (showFilters || hasActiveFilters) ? 'var(--color-primary-dim)' : '',
              color: (showFilters || hasActiveFilters) ? 'var(--color-primary-hover)' : '',
              borderColor: (showFilters || hasActiveFilters) ? 'var(--color-primary)' : '',
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && (
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px'
              }}>
                {[search, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {projectId && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                height: 38
              }}
            >
              <Plus size={15} />
              Log RCA
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <form
            onSubmit={handleApplyFilters}
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search RCA title or description..."
                className="input-text"
                style={{ paddingLeft: '2.25rem', width: '100%' }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-text"
              style={{ width: 'auto', minWidth: '140px', cursor: 'pointer', height: 38 }}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: 38 }}
              >
                Apply
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    height: 38,
                    color: 'var(--color-danger)',
                    borderColor: 'var(--color-danger)'
                  }}
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Status filter pills (quick filter) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--color-surface-hover)',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        gap: '4px',
        alignSelf: 'flex-start'
      }}>
        <button
          onClick={() => { setStatusFilter(''); }}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.15s ease',
            backgroundColor: !statusFilter ? 'var(--color-surface)' : 'transparent',
            color: !statusFilter ? 'var(--color-text)' : 'var(--color-text-muted)',
            boxShadow: !statusFilter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          All ({rcas.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const count = rcas.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(statusFilter === s ? '' : s); }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: statusFilter === s ? 'var(--color-surface)' : 'transparent',
                color: statusFilter === s ? 'var(--color-text)' : 'var(--color-text-muted)',
                boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* RCA List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <RCAList
          rcas={rcas}
          onSelect={setSelectedRca}
          showProject={!projectId}
          currentUserId={currentUser?._id || currentUser?.id}
        />
      )}

      {/* Create Modal */}
      {isCreateOpen && projectId && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Log New RCA Report"
          size="lg"
        >
          <RCAForm onSubmit={handleCreateRCA} members={members} tasks={tasks} />
        </Modal>
      )}
    </div>
  );
};

export default RCAPage;
