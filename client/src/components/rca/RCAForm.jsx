import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  User,
  Link2,
} from 'lucide-react';

const STEP_CONFIG = [
  {
    step: 1,
    title: 'Incident Overview',
    description: 'Describe the incident and assign a reviewer',
    icon: FileText,
  },
  {
    step: 2,
    title: 'Impact & Root Cause',
    description: 'Assess the scope and identify the root cause',
    icon: AlertTriangle,
  },
  {
    step: 3,
    title: 'Resolution Plan',
    description: 'Document actions taken to prevent recurrence',
    icon: CheckCircle2,
  },
];

const RCAForm = ({
  onSubmit,
  members = [],
  tasks = [],
  defaultValues = null,
  submitLabel = 'Save RCA Report',
}) => {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultValues || {
      title: '',
      task: '',
      reviewer: '',
      incidentDescription: '',
      impact: '',
      rootCause: '',
      resolutionSteps: '',
    },
  });

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['title', 'reviewer', 'incidentDescription'];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const labelClass = 'block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5';
  const currentConfig = STEP_CONFIG[step - 1];
  const StepIcon = currentConfig.icon;

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Step progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-hover)', borderRadius: 16, padding: 16 }}>
        {STEP_CONFIG.map((s, idx) => {
          const SIcon = s.icon;
          const isActive = step === s.step;
          const isDone = step > s.step;
          return (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    background: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-border)',
                    color: isActive || isDone ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {isDone ? <CheckCircle2 size={16} /> : <SIcon size={16} />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {s.title}
                  </p>
                </div>
              </div>
              {idx < STEP_CONFIG.length - 1 && (
                <div style={{ height: 2, flex: 1, margin: '0 8px 18px', background: step > s.step ? 'var(--color-success)' : 'var(--color-border)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-dim)', color: 'var(--color-primary-hover)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
          <StepIcon size={16} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>{currentConfig.title}</p>
          <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-muted)' }}>{currentConfig.description}</p>
        </div>
      </div>

      {/* Step 1: Incident Description */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>RCA Title *</label>
            <input
              {...register('title', { required: 'RCA title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
              placeholder="e.g. Major server outage due to DB connection pool exhaustion"
              className="input-text"
              style={{ width: "100%", borderColor: errors.title ? "var(--color-danger)" : "" }}
            />
            {errors.title && <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4, margin: 0 }}>{errors.title.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={11} /> Related Task (Optional)</span>
              </label>
              <select {...register('task')} className="input-text" style={{ width: "100%", height: 38 }}>
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> Reviewer *</span>
              </label>
              <select
                {...register('reviewer', { required: 'Please assign a reviewer' })}
                className="input-text"
                style={{ width: "100%", height: 38, borderColor: errors.reviewer ? "var(--color-danger)" : "" }}
              >
                <option value="">Select reviewer...</option>
                {members.map((m) => {
                  const u = m.user || m;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name} ({m.role || u.role || 'Member'})
                    </option>
                  );
                })}
              </select>
              {errors.reviewer && <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4, margin: 0 }}>{errors.reviewer.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Incident Description *</label>
            <textarea
              {...register('incidentDescription', { required: 'Incident description is required', minLength: { value: 20, message: 'Provide at least 20 characters of detail' } })}
              placeholder="What happened? When? Who was involved? Provide a detailed timeline of events."
              className="input-text"
              style={{ width: "100%", minHeight: 110, borderColor: errors.incidentDescription ? "var(--color-danger)" : "" }}
            />
            {errors.incidentDescription && (
              <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4, margin: 0 }}>{errors.incidentDescription.message}</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next: Impact &amp; Root Cause
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Impact & Root Cause */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Business / Technical Impact</label>
            <textarea
              {...register('impact')}
              placeholder="What was the scope of impact? (e.g. 2 hours downtime, 15% failed payments, 500 users affected)"
              className="input-text"
              style={{ width: "100%", minHeight: 110 }}
            />
          </div>

          <div>
            <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Root Cause (5-Why Analysis)</label>
            <textarea
              {...register('rootCause')}
              placeholder="Why did this happen? Use the 5-Whys technique or describe the underlying process / code / infrastructure failure."
              className="input-text"
              style={{ width: "100%", minHeight: 110 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next: Resolution Plan
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Resolution */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className={labelClass} style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Resolution &amp; Preventative Actions</label>
            <textarea
              {...register('resolutionSteps')}
              placeholder="What actions have been or will be taken to fix this permanently and prevent recurrence? List specific steps, owners, and deadlines."
              className="input-text"
              style={{ width: "100%", minHeight: 110 }}
            />
          </div>

          <div style={{ padding: 14, borderRadius: 8, background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)', color: 'var(--color-primary-hover)', fontSize: 12.5 }}>
            <span style={{ fontWeight: 700 }}>Saving as Draft.</span> After saving, you can attach evidence files and then submit the RCA to your reviewer.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} />
              Previous
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RCAForm;
