import React, { useState } from 'react';
import { Box, Skeleton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Exchange } from '../types';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: '#4F46E5', bg: '#EEF2FF', label: 'Open' },
  pending: { color: '#D97706', bg: '#FEF3C7', label: 'Pending' },
  active: { color: '#059669', bg: '#D1FAE5', label: 'Active' },
  completed: { color: '#2563EB', bg: '#DBEAFE', label: 'Completed' },
  cancelled: { color: '#DC2626', bg: '#FEE2E2', label: 'Cancelled' },
};

const TYPE_ICONS: Record<string, string> = {
  skill: 'fa-chalkboard-teacher',
  tool: 'fa-tools',
  service: 'fa-handshake',
};

const TYPE_LABELS: Record<string, string> = {
  skill: 'Skill',
  tool: 'Tool',
  service: 'Service',
};

const ExchangeCard: React.FC<{ exchange: Exchange }> = ({ exchange }) => {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.open;
  const typeIcon = TYPE_ICONS[exchange.type] || 'fa-handshake';
  const typeLabel = TYPE_LABELS[exchange.type] || exchange.type;

  return (
    <Box
      onClick={() => navigate(`/exchanges/${exchange._id}`)}
      sx={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#4F46E5',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          padding: '1.25rem 1.5rem',
        }}
      >
        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', mb: '0.625rem', flexWrap: 'wrap' }}>
          {/* Type badge */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              color: '#FFFFFF',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <i className={`fas ${typeIcon}`} style={{ fontSize: '0.7rem' }} />
            {typeLabel}
          </Box>

          {/* Exchange ID */}
          <Box sx={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            #{exchange._id.slice(-6).toUpperCase()}
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Status badge */}
          <Box
            sx={{
              background: status.bg,
              color: status.color,
              borderRadius: '2rem',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {status.label}
          </Box>
        </Box>

        {/* Title */}
        <Box
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#1F2937',
            mb: '0.75rem',
            lineHeight: 1.3,
          }}
        >
          {exchange.offering} ↔ {exchange.seeking}
        </Box>

        {/* Participants row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Avatar
            src={exchange.requester.avatar}
            sx={{ width: 28, height: 28, fontSize: '0.7rem' }}
          >
            {exchange.requester.name[0]}
          </Avatar>
          <Box sx={{ fontSize: '0.8125rem', color: '#6B7280' }}>
            {exchange.requester.name}
          </Box>
          {exchange.provider && (
            <>
              <Box sx={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>↔</Box>
              <Avatar
                src={exchange.provider.avatar}
                sx={{ width: 28, height: 28, fontSize: '0.7rem' }}
              >
                {exchange.provider.name[0]}
              </Avatar>
              <Box sx={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                {exchange.provider.name}
              </Box>
            </>
          )}
          {!exchange.provider && (
            <Box sx={{ fontSize: '0.8125rem', color: '#9CA3AF', fontStyle: 'italic' }}>
              Waiting for a match...
            </Box>
          )}
        </Box>
      </Box>

      {/* Card Body */}
      <Box sx={{ padding: '1.5rem' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
          }}
        >
          {/* Value */}
          <Box>
            <Box sx={{ fontSize: '0.75rem', color: '#6B7280', mb: '0.25rem', fontWeight: 500 }}>
              Value
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: '#1F2937', fontWeight: 600 }}>
              {exchange.ceuValue} CEU
            </Box>
          </Box>

          {/* Schedule */}
          <Box>
            <Box sx={{ fontSize: '0.75rem', color: '#6B7280', mb: '0.25rem', fontWeight: 500 }}>
              Schedule
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: '#1F2937' }}>
              {exchange.scheduledDate
                ? formatDistanceToNow(new Date(exchange.scheduledDate), { addSuffix: true })
                : 'Not scheduled'}
            </Box>
          </Box>

          {/* Type */}
          <Box>
            <Box sx={{ fontSize: '0.75rem', color: '#6B7280', mb: '0.25rem', fontWeight: 500 }}>
              Type
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: '#1F2937', textTransform: 'capitalize' }}>
              {exchange.type}
            </Box>
          </Box>

          {/* Created */}
          <Box>
            <Box sx={{ fontSize: '0.75rem', color: '#6B7280', mb: '0.25rem', fontWeight: 500 }}>
              Created
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: '#1F2937' }}>
              {formatDistanceToNow(new Date(exchange.createdAt), { addSuffix: true })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Card Footer */}
      <Box
        sx={{
          background: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {exchange.status === 'pending' && (
            <Box
              component="button"
              sx={{
                background: 'none',
                border: '1px solid #10B981',
                color: '#10B981',
                borderRadius: '0.375rem',
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                '&:hover': { background: '#D1FAE5' },
              }}
            >
              <i className="fas fa-check" style={{ fontSize: '0.7rem' }} />
              Confirm
            </Box>
          )}
          {(exchange.status === 'active' || exchange.status === 'pending') && (
            <Box
              component="button"
              sx={{
                background: 'none',
                border: '1px solid #F59E0B',
                color: '#D97706',
                borderRadius: '0.375rem',
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                '&:hover': { background: '#FEF3C7' },
              }}
            >
              <i className="fas fa-calendar-alt" style={{ fontSize: '0.7rem' }} />
              Reschedule
            </Box>
          )}
          {exchange.status !== 'completed' && exchange.status !== 'cancelled' && (
            <Box
              component="button"
              sx={{
                background: 'none',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: '0.375rem',
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                '&:hover': { background: '#FEE2E2' },
              }}
            >
              <i className="fas fa-times" style={{ fontSize: '0.7rem' }} />
              Cancel
            </Box>
          )}
        </Box>

        {/* Chat link */}
        <Box
          component="button"
          onClick={() => navigate(`/exchanges/${exchange._id}`)}
          sx={{
            background: 'none',
            border: 'none',
            color: '#4F46E5',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.5rem',
            borderRadius: '0.375rem',
            '&:hover': { background: '#EEF2FF' },
          }}
        >
          <i className="fas fa-comments" style={{ fontSize: '0.75rem' }} />
          Chat
        </Box>
      </Box>
    </Box>
  );
};

const TAB_DEFS = [
  { label: 'All', status: '' },
  { label: 'Active', status: 'active' },
  { label: 'Pending', status: 'pending' },
  { label: 'Completed', status: 'completed' },
  { label: 'Cancelled', status: 'cancelled' },
];

const MyExchanges: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['myExchanges', activeTab],
    queryFn: async () => {
      const status = TAB_DEFS[activeTab].status;
      const params = status ? `?status=${status}` : '';
      const res = await api.get(`/exchanges/me${params}`);
      return res.data as { exchanges: Exchange[]; total: number };
    },
  });

  const allExchanges = data?.exchanges || [];

  // Count per status for badges (use only when showing all tab, otherwise show filtered count)
  const getTabCount = (idx: number) => {
    if (idx === 0) return data?.total ?? allExchanges.length;
    return allExchanges.length;
  };

  return (
    <Layout>
      {/* Page Header */}
      <Box
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          padding: '1.5rem',
          mb: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            <i className="fas fa-exchange-alt" />
          </Box>
          <Box>
            <Box
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#1F2937',
                lineHeight: 1.2,
              }}
            >
              My Exchanges
            </Box>
            <Box sx={{ color: '#6B7280', fontSize: '0.875rem', mt: '0.25rem' }}>
              Manage your skill and tool swaps with the community
            </Box>
          </Box>
        </Box>

        <Box
          component="button"
          onClick={() => navigate('/exchanges/create')}
          sx={{
            background: 'linear-gradient(135deg, #4F46E5, #10B981)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.9 },
          }}
        >
          <i className="fas fa-plus" />
          New Exchange
        </Box>
      </Box>

      {/* Custom Tabs */}
      <Box
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          mb: '1.5rem',
          overflowX: 'auto',
          display: 'flex',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { background: '#F3F4F6' },
          '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: '2px' },
        }}
      >
        {TAB_DEFS.map((tab, idx) => {
          const isActive = activeTab === idx;
          const count = getTabCount(idx);
          return (
            <Box
              key={tab.label}
              component="button"
              onClick={() => setActiveTab(idx)}
              sx={{
                flex: '0 0 auto',
                background: isActive ? '#F3F4F6' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                color: isActive ? '#4F46E5' : '#6B7280',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                padding: '0.875rem 1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                '&:hover': {
                  background: '#F3F4F6',
                  color: isActive ? '#4F46E5' : '#374151',
                },
              }}
            >
              {tab.label}
              {!isLoading && (
                <Box
                  component="span"
                  sx={{
                    background: '#E5E7EB',
                    color: '#6B7280',
                    borderRadius: '2rem',
                    px: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    lineHeight: '1.5',
                    display: 'inline-block',
                  }}
                >
                  {count}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: '0.75rem' }} />
          ))}
        </Box>
      ) : allExchanges.length === 0 ? (
        <Box
          sx={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
            padding: '4rem 2rem',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '1.75rem',
              mx: 'auto',
              mb: '1.25rem',
            }}
          >
            <i className="fas fa-exchange-alt" />
          </Box>
          <Box
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#1F2937',
              mb: '0.5rem',
            }}
          >
            No exchanges yet
          </Box>
          <Box sx={{ color: '#6B7280', fontSize: '0.875rem', mb: '1.5rem' }}>
            Start swapping skills and tools with your neighbors!
          </Box>
          <Box
            component="button"
            onClick={() => navigate('/exchanges/create')}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.9 },
            }}
          >
            <i className="fas fa-plus" />
            Create Your First Exchange
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: '1rem',
          }}
        >
          {allExchanges.map((exchange) => (
            <ExchangeCard key={exchange._id} exchange={exchange} />
          ))}
        </Box>
      )}
    </Layout>
  );
};

export default MyExchanges;
