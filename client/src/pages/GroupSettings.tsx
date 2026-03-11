import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Group } from '../types';

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
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.375rem',
  fontFamily: 'Inter, sans-serif',
};

const GroupSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => { const res = await api.get(`/groups/${id}`); return res.data as Group; },
  });

  const [form, setForm] = useState({ name: '', description: '', type: 'public' });

  React.useEffect(() => {
    if (group) setForm({ name: group.name, description: group.description, type: group.type });
  }, [group]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.put(`/groups/${id}`, data),
    onSuccess: () => { setSuccess('Group settings saved!'); setTimeout(() => setSuccess(''), 3000); },
    onError: (err: unknown) => setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Settings not saved — check your connection and try again.'),
  });

  if (isLoading) return <Layout><Typography>Loading...</Typography></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Back button */}
        <Box
          component="button"
          onClick={() => navigate(`/groups/${id}`)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            mb: 2.5,
            background: 'transparent',
            border: 'none',
            color: '#6B7280',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            padding: '0.25rem 0',
            '&:hover': { color: '#4F46E5' },
          }}
        >
          <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} />
          Back to Group
        </Box>

        {/* Page header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="fas fa-cog" style={{ color: 'white', fontSize: '1.125rem' }} />
          </Box>
          <Box>
            <Typography
              fontFamily="Poppins, sans-serif"
              fontWeight={700}
              fontSize="1.375rem"
              color="#1F2937"
              lineHeight={1.2}
            >
              Group Settings
            </Typography>
            <Typography fontSize="0.875rem" color="#6B7280">
              Manage your group details and privacy
            </Typography>
          </Box>
        </Box>

        {/* Settings card */}
        <Box
          sx={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            p: '2rem',
          }}
        >
          {/* Success banner */}
          {success && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                background: '#ECFDF5',
                border: '1px solid #10B981',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                mb: 2.5,
                color: '#065F46',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            >
              <i className="fas fa-check-circle" style={{ color: '#10B981', fontSize: '1rem' }} />
              {success}
            </Box>
          )}

          {/* Error banner */}
          {error && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                mb: 2.5,
                color: '#991B1B',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
            >
              <i className="fas fa-exclamation-circle" style={{ color: '#EF4444', fontSize: '1rem' }} />
              {error}
            </Box>
          )}

          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); }}
          >
            {/* Group name */}
            <Box sx={{ mb: 2.5 }}>
              <label style={labelStyle}>Group name</label>
              <input
                style={inputStyle}
                type="text"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Enter group name"
                onFocus={e => (e.target.style.borderColor = '#4F46E5')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </Box>

            {/* Description */}
            <Box sx={{ mb: 2.5 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: '5rem', resize: 'vertical' }}
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your group..."
                rows={3}
                onFocus={e => (e.target.style.borderColor = '#4F46E5')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </Box>

            {/* Privacy */}
            <Box sx={{ mb: 3 }}>
              <label style={labelStyle}>Privacy</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                value={form.type}
                onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = '#4F46E5')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              >
                <option value="public">Public — Anyone can join</option>
                <option value="restricted">Restricted — Request to join</option>
                <option value="private">Private — Invite only</option>
              </select>
            </Box>

            {/* Submit button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                fontFamily: 'Inter, sans-serif',
                opacity: mutation.isPending ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.15s',
              }}
            >
              {mutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" />
                  Save Changes
                </>
              )}
            </button>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default GroupSettings;
