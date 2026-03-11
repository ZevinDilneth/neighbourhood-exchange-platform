import React from 'react';
import { Box, Avatar, Typography, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Exchange } from '../types';
import { useAuth } from '../context/AuthContext';

const statusColors: Record<string, string> = {
  open: '#4F46E5',
  pending: '#D97706',
  active: '#059669',
  completed: '#6B7280',
  cancelled: '#DC2626',
};

const typeIcons: Record<string, string> = {
  skill: 'fas fa-star',
  tool: 'fas fa-wrench',
  service: 'fas fa-handshake',
};

const ExchangeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: exchange, isLoading, refetch } = useQuery({
    queryKey: ['exchange', id],
    queryFn: async () => { const res = await api.get(`/exchanges/${id}`); return res.data as Exchange; },
  });

  const respondMutation = useMutation({
    mutationFn: () => api.post(`/exchanges/${id}/respond`),
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <Layout>
        <Skeleton variant="rounded" height={400} />
      </Layout>
    );
  }

  if (!exchange) return null;

  const isRequester = exchange.requester._id === user?._id;
  // kept for potential future use — same logic as original
  const isProvider = exchange.provider?._id === user?._id; // eslint-disable-line @typescript-eslint/no-unused-vars
  const canRespond = !isRequester && exchange.status === 'open';

  const statusColor = statusColors[exchange.status] ?? '#6B7280';
  const typeIcon = typeIcons[exchange.type] ?? 'fas fa-star';

  return (
    <Layout>
      {/* Back button */}
      <Box
        component="button"
        onClick={() => navigate(-1)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6B7280',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '0.25rem 0',
          mb: 2,
          '&:hover': { color: '#1F2937' },
        }}
      >
        <i className="fas fa-arrow-left" />
        Back
      </Box>

      {/* Main card */}
      <Box
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        {/* Zone 1 — Header */}
        <Box
          sx={{
            background: '#F9FAFB',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          {/* Gradient type icon */}
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
              fontSize: '1.125rem',
            }}
          >
            <i className={typeIcon} />
          </Box>

          {/* Title block */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.75rem',
                mb: '0.375rem',
              }}
            >
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#1F2937',
                  lineHeight: 1.3,
                }}
              >
                {exchange.title}
              </Typography>

              {/* Status badge */}
              <Box
                component="span"
                sx={{
                  background: `${statusColor}15`,
                  color: statusColor,
                  borderRadius: '2rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  textTransform: 'capitalize',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {exchange.status}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.8rem',
                  color: '#6B7280',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {formatDistanceToNow(new Date(exchange.createdAt), { addSuffix: true })}
              </Typography>

              {/* CEU badge */}
              <Box
                component="span"
                sx={{
                  background: '#F5F3FF',
                  color: '#8B5CF6',
                  borderRadius: '2rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {exchange.ceuValue} CEU
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Zone 2 — Content */}
        <Box sx={{ background: '#FFFFFF', padding: '1.5rem' }}>
          {/* Description */}
          <Typography
            sx={{
              color: '#6B7280',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
              mb: '1.5rem',
            }}
          >
            {exchange.description}
          </Typography>

          {/* Offering / Seeking grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              mb: '1.5rem',
            }}
          >
            {/* Offering */}
            <Box
              sx={{
                background: '#EEF2FF',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  mb: '0.5rem',
                }}
              >
                <i className="fas fa-gift" style={{ color: '#4F46E5', fontSize: '0.8125rem' }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#4F46E5',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Offering
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                }}
              >
                {exchange.offering}
              </Typography>
            </Box>

            {/* Seeking */}
            <Box
              sx={{
                background: '#ECFDF5',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  mb: '0.5rem',
                }}
              >
                <i className="fas fa-search" style={{ color: '#10B981', fontSize: '0.8125rem' }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#10B981',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Seeking
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                }}
              >
                {exchange.seeking}
              </Typography>
            </Box>
          </Box>

          {/* Participants row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Requester */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Avatar
                src={exchange.requester.avatar}
                sx={{ width: 34, height: 34, fontSize: '0.8rem' }}
              >
                {exchange.requester.name[0]}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1,
                    mb: '0.1875rem',
                  }}
                >
                  Posted by
                </Typography>
                <Typography
                  onClick={() => navigate(`/profile/${exchange.requester._id}`)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#1F2937',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    '&:hover': { color: '#4F46E5' },
                  }}
                >
                  {exchange.requester.name}
                </Typography>
              </Box>
            </Box>

            {exchange.provider && (
              <>
                <Box sx={{ color: '#6B7280', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-exchange-alt" />
                </Box>

                {/* Provider */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Avatar
                    src={exchange.provider.avatar}
                    sx={{ width: 34, height: 34, fontSize: '0.8rem' }}
                  >
                    {exchange.provider.name[0]}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1,
                        mb: '0.1875rem',
                      }}
                    >
                      Provider
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#1F2937',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {exchange.provider.name}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Zone 3 — Actions */}
        <Box
          sx={{
            background: '#F9FAFB',
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          {canRespond ? (
            <Box
              component="button"
              onClick={() => respondMutation.mutate()}
              disabled={respondMutation.isPending}
              sx={{
                width: '100%',
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: respondMutation.isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: respondMutation.isPending ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <i className="fas fa-handshake" />
              {respondMutation.isPending ? 'Responding...' : 'Respond to Exchange'}
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
              }}
            >
              {exchange.status !== 'open'
                ? `This exchange is ${exchange.status}`
                : 'You posted this exchange'}
            </Typography>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default ExchangeDetail;
