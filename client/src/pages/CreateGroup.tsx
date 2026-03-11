import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';

/* ─────────────────────── constants ─────────────────────── */

const CATEGORIES = [
  'Gardening', 'DIY', 'Cooking', 'Fitness', 'Arts', 'Music', 'Language', 'Tech', 'Business',
  'Skills', 'Tools', 'Events', 'Sports', 'Other',
];

const STEPS = ['Details', 'Privacy', 'Rules', 'Members', 'Customize', 'Review'];

const PRIVACY_OPTIONS = [
  {
    value: 'public',
    icon: 'fas fa-globe',
    label: 'Public',
    desc: 'Anyone can discover and join this group',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    value: 'restricted',
    icon: 'fas fa-users',
    label: 'Private',
    desc: 'Members must request to join',
    color: '#4F46E5',
    bg: '#EEF2FF',
  },
  {
    value: 'private',
    icon: 'fas fa-lock',
    label: 'Hidden',
    desc: 'Only invited members can join',
    color: '#6B7280',
    bg: '#F3F4F6',
  },
];

const DEFAULT_RULES = [
  { key: 'respectful', label: 'Be Respectful', desc: 'Treat all members with kindness and respect', icon: 'fas fa-heart' },
  { key: 'onTopic', label: 'Stay On Topic', desc: 'Keep discussions relevant to the group theme', icon: 'fas fa-comment-alt' },
  { key: 'noSpam', label: 'No Spam', desc: 'No promotional content or repetitive messages', icon: 'fas fa-ban' },
  { key: 'legal', label: 'Keep It Legal', desc: 'All activities must comply with local laws', icon: 'fas fa-gavel' },
  { key: 'appropriate', label: 'Appropriate Language', desc: 'Use language suitable for all audiences', icon: 'fas fa-font' },
];

/* ─────────────────────── shared style helpers ─────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.9375rem',
  color: '#1F2937',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: '#374151',
  marginBottom: '0.5rem',
  fontFamily: 'Inter, sans-serif',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

/* ─────────────────────── Toggle Switch ─────────────────────── */

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      border: 'none',
      cursor: 'pointer',
      background: checked ? 'linear-gradient(135deg, #4F46E5, #10B981)' : '#E5E7EB',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: 2,
      left: checked ? 22 : 2,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
      display: 'block',
    }} />
  </button>
);

/* ─────────────────────── StepIndicator ─────────────────────── */

const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', rowGap: '0.5rem' }}>
    {STEPS.map((label, idx) => {
      const done = idx < current;
      const active = idx === current;
      return (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
            {/* Circle */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: done
                ? '#10B981'
                : active
                ? 'linear-gradient(135deg, #4F46E5, #10B981)'
                : '#E5E7EB',
              color: (done || active) ? '#fff' : '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: active ? '0 4px 6px -1px rgba(79,70,229,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
              {done ? <i className="fas fa-check" style={{ fontSize: '0.75rem' }} /> : idx + 1}
            </div>
            {/* Label */}
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: active ? 600 : 400,
              color: active ? '#4F46E5' : done ? '#10B981' : '#9CA3AF',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
            }}>
              {label}
            </span>
          </div>

          {/* Connector line between steps */}
          {idx < STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: 2,
              minWidth: 20,
              maxWidth: 48,
              background: done ? '#10B981' : '#E5E7EB',
              marginBottom: 22,
              transition: 'background 0.2s',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────── main component ─────────────────────── */

const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'restricted',
    category: '',
    location: '',
    tags: [] as string[],
    rules: {
      respectful: true,
      onTopic: true,
      noSpam: true,
      legal: true,
      appropriate: true,
    } as Record<string, boolean>,
    customRules: '',
  });

  /* ── helpers ── */

  const setField = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!form.tags.includes(tag) && form.tags.length < 10) {
        setField('tags', [...form.tags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setField('tags', form.tags.filter(t => t !== tag));

  /* ── validation ── */

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (!form.name.trim()) { setError('Group name is required — enter a name for your group.'); return false; }
      if (!form.category) { setError('Category is required — select a category for your group.'); return false; }
      if (!form.description.trim()) { setError('Description is required — describe what your group is about.'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 0) setStep(s => s - 1);
  };

  /* ── mutation ── */

  const mutation = useMutation({
    mutationFn: () => api.post('/groups', {
      name: form.name,
      description: form.description,
      type: form.type,
      category: form.category,
      tags: form.tags,
    }),
    onSuccess: (res) => navigate(`/groups/${res.data._id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Group not created — check your connection and try again.');
    },
  });

  const handleSubmit = () => {
    setError('');
    mutation.mutate();
  };

  /* ── shared card style ── */

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    padding: '2rem',
  };

  /* ── step renderers ── */

  const renderStep1 = () => (
    <>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Group Name <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          style={inputStyle}
          value={form.name}
          maxLength={100}
          placeholder="e.g. Hackney Gardeners, East Side Fixers"
          onChange={e => setField('name', e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        />
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', textAlign: 'right' }}>
          {form.name.length}/100
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Category <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.category}
          onChange={e => setField('category', e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        >
          <option value="">Select a category...</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Description <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
          value={form.description}
          maxLength={1000}
          rows={4}
          placeholder="What is this group about? What will members do or share?"
          onChange={e => setField('description', e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        />
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', textAlign: 'right' }}>
          {form.description.length}/1000
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Location <span style={{ fontSize: '0.8125rem', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
            <i className="fas fa-map-marker-alt" />
          </span>
          <input
            style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            value={form.location}
            placeholder="e.g. Brooklyn, NY"
            onChange={e => setField('location', e.target.value)}
            onFocus={e => (e.target.style.borderColor = '#4F46E5')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Tags</label>
        <input
          style={inputStyle}
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter (max 10)"
          disabled={form.tags.length >= 10}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        />
        {form.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {form.tags.map(tag => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onDelete={() => removeTag(tag)}
                sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', '& .MuiChip-deleteIcon': { color: '#4F46E5' } }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <Typography sx={{ color: '#6B7280', fontSize: '0.9375rem', mb: 2.5, lineHeight: 1.6 }}>
        Choose who can see and join your group. You can change this later in group settings.
      </Typography>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {PRIVACY_OPTIONS.map(opt => {
          const selected = form.type === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => setField('type', opt.value)}
              style={{
                border: selected ? `2px solid ${opt.color}` : '1px solid #E5E7EB',
                padding: '1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                background: selected ? opt.bg : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '0.5rem',
                background: selected ? opt.bg : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selected ? opt.color : '#9CA3AF',
                fontSize: '1.2rem',
                flexShrink: 0,
                border: selected ? `1px solid ${opt.color}30` : '1px solid transparent',
              }}>
                <i className={opt.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: selected ? opt.color : '#1F2937', fontFamily: 'Inter, sans-serif', marginBottom: '0.25rem' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{opt.desc}</div>
              </div>
              {/* Radio indicator */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selected ? opt.color : '#D1D5DB'}`,
                background: selected ? opt.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}>
                {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <Typography sx={{ color: '#6B7280', fontSize: '0.9375rem', mb: 2.5, lineHeight: 1.6 }}>
        Set community guidelines to keep your group welcoming and productive.
      </Typography>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {DEFAULT_RULES.map(rule => (
          <div
            key={rule.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              background: form.rules[rule.key] ? '#F9FAFB' : '#FFFFFF',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: '0.5rem',
                background: form.rules[rule.key] ? '#EEF2FF' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: form.rules[rule.key] ? '#4F46E5' : '#9CA3AF',
                flexShrink: 0,
              }}>
                <i className={rule.icon} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1F2937', fontFamily: 'Inter, sans-serif' }}>
                  {rule.label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.125rem' }}>{rule.desc}</div>
              </div>
            </div>
            <ToggleSwitch
              checked={form.rules[rule.key]}
              onChange={v => setField('rules', { ...form.rules, [rule.key]: v })}
            />
          </div>
        ))}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Custom Rules <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.8125rem' }}>(optional)</span></label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          value={form.customRules}
          rows={3}
          placeholder="Add any specific rules for your group..."
          onChange={e => setField('customRules', e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
        />
      </div>
    </>
  );

  const renderStepPlaceholder = (title: string, subtitle: string, icon: string) => (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: '50%',
        background: '#EEF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
        fontSize: '1.75rem',
        color: '#4F46E5',
      }}>
        <i className={icon} />
      </div>
      <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#1F2937', mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#6B7280', fontSize: '0.9375rem', maxWidth: 380, mx: 'auto' }}>
        {subtitle}
      </Typography>
    </div>
  );

  const renderStep4 = () => renderStepPlaceholder(
    'Invite Members',
    'After creating your group you can invite members by username or email. Skip this step to start with an open group.',
    'fas fa-user-plus',
  );

  const renderStep5 = () => renderStepPlaceholder(
    'Customize Your Group',
    'Upload a cover image, set a group color, and choose a banner to make your group stand out in the community.',
    'fas fa-palette',
  );

  const renderStep6 = () => (
    <>
      <Typography sx={{ color: '#6B7280', fontSize: '0.9375rem', mb: 2.5, lineHeight: 1.6 }}>
        Review your group details before publishing.
      </Typography>

      {/* Summary cards */}
      {[
        {
          title: 'Details',
          stepIdx: 0,
          rows: [
            { label: 'Name', value: form.name || '—' },
            { label: 'Category', value: form.category || '—' },
            { label: 'Location', value: form.location || 'Not specified' },
            { label: 'Description', value: form.description ? form.description.slice(0, 120) + (form.description.length > 120 ? '...' : '') : '—' },
          ],
        },
        {
          title: 'Privacy',
          stepIdx: 1,
          rows: [
            {
              label: 'Type',
              value: PRIVACY_OPTIONS.find(o => o.value === form.type)?.label || '—',
            },
          ],
        },
        {
          title: 'Rules',
          stepIdx: 2,
          rows: DEFAULT_RULES
            .filter(r => form.rules[r.key])
            .map(r => ({ label: r.label, value: 'Enabled' })),
        },
      ].map(section => (
        <div key={section.title} style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.875rem 1rem',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1F2937', fontFamily: 'Poppins, sans-serif' }}>{section.title}</span>
            <button
              type="button"
              onClick={() => { setError(''); setStep(section.stepIdx); }}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Edit
            </button>
          </div>
          <div style={{ padding: '0.875rem 1rem' }}>
            {section.rows.map(row => (
              <div key={row.label} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280', minWidth: 90, flexShrink: 0 }}>{row.label}</span>
                <span style={{ color: '#1F2937', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {form.tags.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {form.tags.map(tag => (
            <Chip key={tag} label={`#${tag}`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5' }} />
          ))}
        </div>
      )}
    </>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  /* ─────────────────────── render ─────────────────────── */

  return (
    <Layout hideSidebar>
      <Box sx={{ maxWidth: 700, mx: 'auto', py: 2 }}>

        {/* ── Page header card ── */}
        <Box sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          p: '1.75rem 2rem',
          mb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: 1.25 }}>
            <Box sx={{
              width: 52, height: 52,
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontSize: '1.375rem',
              flexShrink: 0,
              boxShadow: '0 4px 6px -1px rgba(79,70,229,0.2)',
            }}>
              <i className="fas fa-users" />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.375rem', color: '#1F2937', lineHeight: 1.3 }}>
                Create New Group
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
                Build a community around a shared interest or skill
              </Typography>
            </Box>
          </Box>

          {/* Step indicator */}
          <Box sx={{ mt: 2.5 }}>
            <StepIndicator current={step} />
          </Box>
        </Box>

        {/* ── Form card ── */}
        <Box sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          p: '2rem',
          mb: 2,
        }}>
          {/* Step heading */}
          <Box sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1F2937', mb: 0.25 }}>
              Step {step + 1}: {STEPS[step]}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              {STEPS.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    height: 3,
                    flex: 1,
                    borderRadius: 999,
                    background: idx <= step
                      ? 'linear-gradient(135deg, #4F46E5, #10B981)'
                      : '#E5E7EB',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '0.5rem' }}>{error}</Alert>
          )}

          {/* Dynamic step content */}
          <div>{stepContent[step]()}</div>
        </Box>

        {/* ── Navigation buttons ── */}
        <Box sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          p: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/groups')}
              sx={{ borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#D1D5DB', background: '#F9FAFB' } }}
            >
              Cancel
            </Button>
            {step > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<i className="fas fa-arrow-left" style={{ fontSize: '0.875rem' }} />}
                sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#D1D5DB', background: '#F9FAFB' } }}
              >
                Back
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>
              {step + 1} of {STEPS.length}
            </Typography>

            {step < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<i className="fas fa-arrow-right" style={{ fontSize: '0.875rem' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA, #059669)' },
                  boxShadow: '0 4px 6px -1px rgba(79,70,229,0.2)',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {step === STEPS.length - 2 ? 'Review' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                startIcon={<i className="fas fa-check" style={{ fontSize: '0.875rem' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA, #059669)' },
                  boxShadow: '0 4px 6px -1px rgba(79,70,229,0.2)',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {mutation.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default CreateGroup;
