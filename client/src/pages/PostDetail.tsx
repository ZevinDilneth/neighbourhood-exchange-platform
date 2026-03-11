import React from 'react';
import { Box, Avatar, Typography, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Post } from '../types';

const TYPE_FA_ICONS: Record<string, string> = {
  skill: 'fas fa-star',
  tool: 'fas fa-wrench',
  event: 'fas fa-calendar-alt',
  question: 'fas fa-question-circle',
  general: 'fas fa-bullhorn',
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await api.get(`/posts/${id}`);
      return res.data as Post;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <Skeleton variant="rounded" height={400} />
      </Layout>
    );
  }

  if (!post) return null;

  const score = post.upvotes.length - post.downvotes.length;

  return (
    <Layout>
      {/* Back button */}
      <Box
        component="button"
        onClick={() => navigate('/feed')}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'transparent',
          border: 'none',
          color: '#6B7280',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '0.375rem 0',
          mb: '1rem',
          '&:hover': { color: '#4F46E5' },
        }}
      >
        <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} />
        Feed
      </Box>

      {/* Post card */}
      <Box
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Zone 1 — Header */}
        <Box
          sx={{
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            padding: '1.25rem 1.5rem 1rem',
          }}
        >
          {/* Row 1: type badge + tags */}
          <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', mb: '0.875rem' }}>
            {/* Type badge — gradient bg, white text */}
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                color: '#FFFFFF',
                borderRadius: '2rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                textTransform: 'capitalize',
              }}
            >
              <i className={TYPE_FA_ICONS[post.type] ?? 'fas fa-circle'} style={{ fontSize: '0.65rem' }} />
              {post.type}
            </Box>

            {/* Tag pills */}
            {post.tags.map((tag) => (
              <Box
                key={tag}
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#F3F4F6',
                  color: '#6B7280',
                  borderRadius: '2rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                #{tag}
              </Box>
            ))}
          </Box>

          {/* Row 2: avatar + author + time + rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar
              src={post.author.avatar}
              sx={{ width: 36, height: 36, fontSize: '0.875rem', flexShrink: 0 }}
            >
              {post.author.name[0]}
            </Avatar>
            <Box>
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  '&:hover': { color: '#4F46E5' },
                }}
                onClick={() => navigate(`/profile/${post.author._id}`)}
              >
                {post.author.name}
              </Typography>
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {' '}• ⭐ {post.author.rating.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Zone 2 — Content */}
        <Box sx={{ background: '#FFFFFF', padding: '1.5rem' }}>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: '#1F2937',
              lineHeight: 1.3,
              mb: '1rem',
            }}
          >
            {post.title}
          </Typography>

          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9375rem',
              color: '#6B7280',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {post.content}
          </Typography>
        </Box>

        {/* Zone 3 — Stats / Actions */}
        <Box
          sx={{
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '0.875rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Upvote button */}
          <Box
            component="button"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              borderRadius: '0.375rem',
              padding: '0.375rem 0.625rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': { background: '#F3F4F6', color: '#4F46E5', borderColor: '#4F46E5' },
            }}
          >
            <i className="fas fa-chevron-up" style={{ fontSize: '0.7rem' }} />
            {post.upvotes.length}
          </Box>

          {/* Score */}
          <Typography
            component="span"
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#1F2937',
            }}
          >
            {score} point{score !== 1 ? 's' : ''}
          </Typography>

          {/* Downvote button */}
          <Box
            component="button"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              borderRadius: '0.375rem',
              padding: '0.375rem 0.625rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': { background: '#FFF1F2', color: '#EF4444', borderColor: '#EF4444' },
            }}
          >
            <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem' }} />
            {post.downvotes.length}
          </Box>

          {/* Comments */}
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              color: '#6B7280',
              ml: 'auto',
            }}
          >
            <i className="fas fa-comment" style={{ fontSize: '0.75rem' }} />
            {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default PostDetail;
