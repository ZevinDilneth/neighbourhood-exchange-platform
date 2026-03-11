import React from 'react';
import { Box, Avatar, Typography, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Post } from '../types';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => { const res = await api.get(`/posts/${id}`); return res.data as Post; },
  });

  if (isLoading) return <Layout><Skeleton variant="rounded" height={400} /></Layout>;
  if (!post) return null;

  return (
    <Layout>
      {/* Back button */}
      <Box
        component="button"
        onClick={() => navigate(-1)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'none',
          border: 'none',
          color: '#6B7280',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '0.5rem 0',
          mb: 2,
          '&:hover': { color: '#1F2937' },
        }}
      >
        <i className="fas fa-arrow-left" />
        Back
      </Box>

      {/* Question card */}
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
            padding: '1.25rem 1.5rem 1rem',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {/* Type badge — purple gradient */}
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: '#FFFFFF',
              borderRadius: '2rem',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              mb: '0.75rem',
            }}
          >
            <i className="fas fa-question-circle" />
            Question
          </Box>

          {/* Author row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar src={post.author.avatar} sx={{ width: 40, height: 40 }}>
              {post.author.name[0]}
            </Avatar>
            <Box>
              <Typography
                fontWeight={600}
                fontSize="0.9375rem"
                onClick={() => navigate(`/profile/${post.author._id}`)}
                sx={{
                  cursor: 'pointer',
                  color: '#1F2937',
                  fontFamily: 'Inter, sans-serif',
                  '&:hover': { color: '#4F46E5' },
                }}
              >
                {post.author.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
              >
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Zone 2 — Content */}
        <Box sx={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: '#1F2937',
              mb: '0.75rem',
            }}
          >
            {post.title}
          </Typography>

          <Typography
            sx={{
              color: '#6B7280',
              lineHeight: 1.8,
              fontFamily: 'Inter, sans-serif',
              mb: '1.25rem',
            }}
          >
            {post.content}
          </Typography>

          {post.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {post.tags.map((t) => (
                <Box
                  key={t}
                  component="span"
                  sx={{
                    background: '#F3F4F6',
                    color: '#6B7280',
                    borderRadius: '2rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  #{t}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Zone 3 — Actions */}
        <Box
          sx={{
            padding: '1rem 1.5rem',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Box
            component="button"
            onClick={() => {
              const answerBox = document.getElementById('question-answer-box');
              if (answerBox) answerBox.scrollIntoView({ behavior: 'smooth' });
            }}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': { opacity: 0.92 },
            }}
          >
            <i className="fas fa-reply" />
            Answer This Question
          </Box>

          {/* Vote count & answer count */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#6B7280',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <i className="fas fa-arrow-up" style={{ color: '#4F46E5' }} />
              {(post.upvotes?.length ?? 0) - (post.downvotes?.length ?? 0)} votes
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <i className="fas fa-comment-alt" style={{ color: '#10B981' }} />
              {post.commentCount ?? 0} answers
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Answer box */}
      <Box
        id="question-answer-box"
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Answer box header */}
        <Box
          sx={{
            padding: '1rem 1.5rem',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#1F2937',
            }}
          >
            {post.commentCount ?? 0} Answers
          </Typography>
        </Box>

        {/* Answer textarea */}
        <Box sx={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <Box
            component="textarea"
            rows={4}
            placeholder="Share your answer with the community..."
            sx={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              color: '#1F2937',
              background: '#FFFFFF',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              mb: '1rem',
              '&:focus': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.12)' },
            }}
          />

          <Box
            component="button"
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&:hover': { opacity: 0.92 },
            }}
          >
            <i className="fas fa-reply" />
            Post Answer
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default QuestionDetail;
