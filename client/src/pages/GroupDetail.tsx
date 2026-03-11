import React, { useState } from 'react';
import { Box, Avatar, Typography, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Group } from '../types';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '0.75rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  overflow: 'hidden',
};

const outlinedBtnStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  background: 'transparent',
  color: '#1F2937',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontFamily: 'Inter, sans-serif',
};

const gradientBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontFamily: 'Inter, sans-serif',
};

const dangerBtnStyle: React.CSSProperties = {
  border: '1px solid #FCA5A5',
  background: 'transparent',
  color: '#EF4444',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontFamily: 'Inter, sans-serif',
};

const badgeStyle: React.CSSProperties = {
  background: '#EEF2FF',
  color: '#4F46E5',
  borderRadius: '2rem',
  padding: '0.25rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
};

const greyBadgeStyle: React.CSSProperties = {
  background: '#F3F4F6',
  color: '#6B7280',
  borderRadius: '2rem',
  padding: '0.25rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  textTransform: 'capitalize' as const,
};

const greenBadgeStyle: React.CSSProperties = {
  background: '#ECFDF5',
  color: '#10B981',
  borderRadius: '2rem',
  padding: '0.25rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  textTransform: 'capitalize' as const,
};

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { data: group, isLoading, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => { const res = await api.get(`/groups/${id}`); return res.data as Group; },
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/join`),
    onSuccess: () => refetch(),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/leave`),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <Layout><Skeleton variant="rounded" height={400} /></Layout>;
  if (!group) return null;

  const isMember = group.members.some(m => m.user._id === user?._id);
  const isAdmin = group.admin._id === user?._id;

  const tabs = ['About', `Members (${group.memberCount})`];

  return (
    <Layout>
      {/* Back button */}
      <Box
        component="button"
        onClick={() => navigate('/groups')}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          mb: 2,
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
        Groups
      </Box>

      {/* Group card */}
      <Box sx={{ ...cardStyle, mb: 2 }}>
        {/* Cover banner */}
        <Box sx={{ height: 120, background: 'linear-gradient(135deg, #4F46E520, #10B98120)' }} />

        {/* Content area */}
        <Box sx={{ padding: '1.5rem 2rem' }}>
          {/* Avatar + action buttons row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: '-3rem', mb: 2 }}>
            <Avatar
              src={group.avatar}
              sx={{
                width: 64,
                height: 64,
                border: '3px solid #fff',
                bgcolor: '#4F46E5',
                fontSize: '1.75rem',
                borderRadius: '0.75rem',
              }}
            >
              {group.name[0]}
            </Avatar>
            <Box sx={{ display: 'flex', gap: 1, mt: '3rem' }}>
              {isAdmin && (
                <button
                  style={outlinedBtnStyle}
                  onClick={() => navigate(`/groups/${id}/settings`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-cog" />
                  Settings
                </button>
              )}
              {isMember && (
                <button
                  style={outlinedBtnStyle}
                  onClick={() => navigate(`/groups/${id}/chat`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-comments" />
                  Chat
                </button>
              )}
              {isMember && !isAdmin ? (
                <button
                  style={{ ...dangerBtnStyle, opacity: leaveMutation.isPending ? 0.7 : 1 }}
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                >
                  Leave
                </button>
              ) : !isMember ? (
                <button
                  style={{ ...gradientBtnStyle, opacity: joinMutation.isPending ? 0.7 : 1 }}
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  <i className="fas fa-plus" />
                  Join Group
                </button>
              ) : null}
            </Box>
          </Box>

          {/* Group name */}
          <Typography
            fontFamily="Poppins, sans-serif"
            fontWeight={700}
            fontSize="1.375rem"
            color="#1F2937"
            mb={0.5}
          >
            {group.name}
          </Typography>

          {/* Description */}
          <Typography fontSize="0.875rem" color="#6B7280" mb={1.5}>
            {group.description}
          </Typography>

          {/* Meta chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <span style={greyBadgeStyle}>
              👥 {group.memberCount} members
            </span>
            <span style={badgeStyle}>
              {group.category}
            </span>
            <span style={greyBadgeStyle}>
              {group.type}
            </span>
          </Box>
        </Box>

        {/* Tab bar */}
        <Box sx={{ borderTop: '1px solid #E5E7EB', display: 'flex', px: 1 }}>
          {tabs.map((tab, idx) => (
            <Box
              key={tab}
              component="button"
              onClick={() => setActiveTab(idx)}
              sx={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === idx
                  ? '2px solid #4F46E5'
                  : '2px solid transparent',
                color: activeTab === idx ? '#4F46E5' : '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                fontWeight: activeTab === idx ? 600 : 500,
                padding: '0.875rem 1rem',
                cursor: 'pointer',
                transition: 'color 0.15s',
                '&:hover': { color: '#4F46E5' },
              }}
            >
              {tab}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Members list */}
      {activeTab === 1 && (
        <Box sx={cardStyle}>
          <Box sx={{ p: 2 }}>
            {group.members.slice(0, 20).map((m, idx) => (
              <Box
                key={m.user._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1,
                  borderBottom: idx < Math.min(group.members.length, 20) - 1 ? '1px solid #E5E7EB' : 'none',
                }}
              >
                <Avatar
                  src={m.user.avatar}
                  sx={{ width: 36, height: 36, fontSize: '0.875rem', bgcolor: '#4F46E5' }}
                >
                  {m.user.name[0]}
                </Avatar>
                <Box flex={1}>
                  <Typography fontWeight={500} fontSize="0.875rem" color="#1F2937">
                    {m.user.name}
                  </Typography>
                  <Typography fontSize="0.75rem" color="#6B7280" sx={{ textTransform: 'capitalize' }}>
                    {m.role}
                  </Typography>
                </Box>
                {m.role !== 'member' && (
                  <span
                    style={
                      m.role === 'admin'
                        ? badgeStyle
                        : greenBadgeStyle
                    }
                  >
                    {m.role}
                  </span>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Layout>
  );
};

export default GroupDetail;
