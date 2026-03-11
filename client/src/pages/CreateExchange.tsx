import React, { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const TYPE_CONFIG = {
  skill: { faIcon: 'fas fa-star', label: 'Skill', color: '#4F46E5', bg: '#EEF2FF', desc: 'Teach or learn a skill' },
  tool: { faIcon: 'fas fa-wrench', label: 'Tool', color: '#10B981', bg: '#ECFDF5', desc: 'Lend or borrow a tool' },
  service: { faIcon: 'fas fa-handshake', label: 'Service', color: '#F59E0B', bg: '#FFFBEB', desc: 'Offer or request a service' },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.875rem',
  color: '#1F2937',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: '#374151',
  marginBottom: '0.5rem',
  fontFamily: 'Inter, sans-serif',
};

const CreateExchange: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    type: 'skill' as 'skill' | 'tool' | 'service',
    title: '',
    description: '',
    offering: '',
    seeking: '',
    ceuValue: 1,
    tags: [] as string[],
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(tag) && form.tags.length < 8) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/exchanges', data),
    onSuccess: (res) => navigate(`/exchanges/${res.data._id}`),
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Exchange not saved — check your connection and try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required — add a title for your exchange.'); return; }
    if (!form.description.trim()) { setError('Description is required — explain your exchange.'); return; }
    if (!form.offering.trim()) { setError('"What you\'re offering" is required — fill in what you can provide.'); return; }
    if (!form.seeking.trim()) { setError('"What you\'re seeking" is required — fill in what you want in return.'); return; }
    setError('');
    mutation.mutate(form);
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>

        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#FFFFFF',
              fontSize: '1.25rem',
            }}
          >
            <i className="fas fa-exchange-alt" />
          </Box>
          <Box>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '1.375rem',
                color: '#1F2937',
                lineHeight: 1.2,
                mb: '0.25rem',
              }}
            >
              Create Exchange
            </Typography>
            <Typography
              sx={{
                color: '#6B7280',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Share what you have and what you need with your neighborhood
            </Typography>
          </Box>
        </Box>

        {/* Form card */}
        <Box
          sx={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            padding: '2rem',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '0.5rem' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>

            {/* Exchange type selector */}
            <Box sx={{ mb: 3 }}>
              <label style={labelStyle}>Exchange type *</label>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG['skill']][]).map(([type, config]) => (
                  <Box
                    key={type}
                    onClick={() => setForm(prev => ({ ...prev, type: type as 'skill' | 'tool' | 'service' }))}
                    sx={{
                      border: `2px solid ${form.type === type ? config.color : '#E5E7EB'}`,
                      borderRadius: '0.75rem',
                      padding: '1rem 0.75rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: form.type === type ? config.bg : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: config.color,
                        background: config.bg,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color: config.color,
                        fontSize: '1.25rem',
                        mb: '0.375rem',
                      }}
                    >
                      <i className={config.faIcon} />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: form.type === type ? config.color : '#1F2937',
                        fontFamily: 'Inter, sans-serif',
                        mb: '0.125rem',
                      }}
                    >
                      {config.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {config.desc}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Title */}
            <Box sx={{ mb: '1.5rem' }}>
              <label style={labelStyle} htmlFor="exchange-title">Title *</label>
              <input
                id="exchange-title"
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                placeholder="e.g. Guitar lessons in exchange for cooking tips"
                maxLength={200}
                style={inputStyle}
              />
            </Box>

            {/* Description */}
            <Box sx={{ mb: '1.5rem' }}>
              <label style={labelStyle} htmlFor="exchange-description">Description *</label>
              <textarea
                id="exchange-description"
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Describe the exchange in detail — your experience level, availability, any requirements..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Box>

            {/* Offering / Seeking */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: '1rem',
                mb: '1.5rem',
              }}
            >
              <Box>
                <label style={labelStyle} htmlFor="exchange-offering">What I'm offering *</label>
                <textarea
                  id="exchange-offering"
                  value={form.offering}
                  onChange={handleChange('offering')}
                  placeholder="e.g. 1hr guitar lessons for beginners"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Box>
              <Box>
                <label style={labelStyle} htmlFor="exchange-seeking">What I'm seeking *</label>
                <textarea
                  id="exchange-seeking"
                  value={form.seeking}
                  onChange={handleChange('seeking')}
                  placeholder="e.g. Home-cooked meals or baking lessons"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Box>
            </Box>

            {/* CEU Value */}
            <Box sx={{ mb: '1.5rem', maxWidth: 200 }}>
              <label style={labelStyle} htmlFor="exchange-ceu">CEU Value</label>
              <Box sx={{ position: 'relative' }}>
                <input
                  id="exchange-ceu"
                  type="number"
                  min={0}
                  max={100}
                  value={form.ceuValue}
                  onChange={(e) => setForm(prev => ({ ...prev, ceuValue: Math.max(0, Number(e.target.value)) }))}
                  style={{ ...inputStyle, paddingRight: '3.5rem' }}
                />
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.8125rem',
                    color: '#6B7280',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    pointerEvents: 'none',
                  }}
                >
                  CEUs
                </Box>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  fontFamily: 'Inter, sans-serif',
                  mt: '0.375rem',
                }}
              >
                Community Exchange Units
              </Typography>
            </Box>

            {/* Tags */}
            <Box sx={{ mb: '2rem' }}>
              <label style={labelStyle} htmlFor="exchange-tags">Tags</label>
              <input
                id="exchange-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tags and press Enter"
                disabled={form.tags.length >= 8}
                style={{
                  ...inputStyle,
                  opacity: form.tags.length >= 8 ? 0.6 : 1,
                  cursor: form.tags.length >= 8 ? 'not-allowed' : 'text',
                }}
              />
              {form.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mt: '0.75rem' }}>
                  {form.tags.map(tag => (
                    <Box
                      key={tag}
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        borderRadius: '2rem',
                        padding: '0.25rem 0.625rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      #{tag}
                      <Box
                        component="button"
                        type="button"
                        onClick={() => removeTag(tag)}
                        sx={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#4F46E5',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.7rem',
                          opacity: 0.7,
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <i className="fas fa-times" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: '0.75rem' }}>
              <Box
                component="button"
                type="button"
                onClick={() => navigate('/my-exchanges')}
                sx={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  '&:hover': { background: '#F3F4F6' },
                  transition: 'background 0.15s',
                }}
              >
                Cancel
              </Box>

              <Box
                component="button"
                type="submit"
                disabled={mutation.isPending}
                sx={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: mutation.isPending ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <i className="fas fa-exchange-alt" />
                {mutation.isPending ? 'Posting...' : 'Post Exchange'}
              </Box>
            </Box>

          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default CreateExchange;
