import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Menu,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

// ── Helpers ─────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  skill: 'Skill Offering',
  tool: 'Tool Available',
  event: 'Event',
  question: 'Question',
  general: 'General Post',
};
const TYPE_ICONS: Record<string, string> = {
  skill: 'fas fa-chalkboard-teacher',
  tool: 'fas fa-tools',
  event: 'fas fa-calendar-alt',
  question: 'fas fa-question-circle',
  general: 'fas fa-bullhorn',
};

// ── Shared styled button ─────────────────────────────────────────────────────
const HtmlBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { sx?: object }) => {
  const { sx, ...rest } = props;
  return <Box component="button" sx={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', ...sx }} {...rest as any} />;
};

// ── Post Card ────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down' | null) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onVote }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    action();
  };

  const score = post.upvotes.length - post.downvotes.length;
  const userVote = post.userVote;
  const typeLabel = TYPE_LABELS[post.type] || post.type;
  const typeIcon = TYPE_ICONS[post.type] || 'fas fa-file-alt';

  return (
    <Box
      sx={{
        background: '#FFFFFF',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#4F46E5',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Post Header */}
      <Box
        sx={{
          p: '1.25rem 1.5rem 1rem',
          borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB',
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/posts/${post._id}`)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category badge */}
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              px: '0.75rem',
              py: '0.25rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: '0.375rem',
            }}
          >
            <i className={typeIcon} style={{ fontSize: '0.75rem' }} />
            {typeLabel}
          </Box>
          {/* Author */}
          <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>
            by{' '}
            <Box component="span" sx={{ fontWeight: 600, color: '#1F2937' }}>
              {post.author.name}
            </Box>
          </Typography>
          {/* Time */}
          <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', ml: 'auto' }}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Typography>
          {/* More options */}
          <HtmlBtn
            onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget as HTMLButtonElement); }}
            sx={{ p: '0.25rem', borderRadius: '0.375rem', color: '#6B7280', '&:hover': { background: '#F3F4F6', color: '#1F2937' } }}
          >
            <i className="fas fa-ellipsis-h" />
          </HtmlBtn>
        </Box>

        <Typography
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#1F2937',
            lineHeight: 1.4,
            '&:hover': { color: '#4F46E5' },
          }}
        >
          {post.title}
        </Typography>
      </Box>

      {/* Post Content */}
      <Box
        sx={{ p: '1.25rem 1.5rem', fontSize: '0.875rem', color: '#1F2937', lineHeight: 1.7, cursor: 'pointer' }}
        onClick={() => navigate(`/posts/${post._id}`)}
      >
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: '#1F2937',
            lineHeight: 1.7,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.content}
        </Typography>

        {/* Tags */}
        {post.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', mt: '0.75rem' }}>
            {post.tags.slice(0, 5).map((tag) => (
              <Box
                key={tag}
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: '0.625rem',
                  py: '0.2rem',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '2rem',
                  fontSize: '0.75rem',
                  color: '#6B7280',
                }}
              >
                #{tag}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Post Stats */}
      <Box
        sx={{
          p: '0.875rem 1.5rem',
          borderTop: '1px solid #E5E7EB',
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Vote controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HtmlBtn
            onClick={() => requireAuth(() => onVote(post._id, userVote === 'up' ? null : 'up'))}
            sx={{
              p: '0.4rem',
              borderRadius: '0.375rem',
              color: userVote === 'up' ? '#FF4500' : '#6B7280',
              '&:hover': { background: '#F3F4F6', color: '#FF4500' },
            }}
          >
            <i className="fas fa-arrow-up" />
          </HtmlBtn>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: userVote === 'up' ? '#FF4500' : userVote === 'down' ? '#7193FF' : '#1F2937',
              minWidth: 24,
              textAlign: 'center',
            }}
          >
            {score}
          </Typography>
          <HtmlBtn
            onClick={() => requireAuth(() => onVote(post._id, userVote === 'down' ? null : 'down'))}
            sx={{
              p: '0.4rem',
              borderRadius: '0.375rem',
              color: userVote === 'down' ? '#7193FF' : '#6B7280',
              '&:hover': { background: '#F3F4F6', color: '#7193FF' },
            }}
          >
            <i className="fas fa-arrow-down" />
          </HtmlBtn>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.375rem', ml: 'auto', flexWrap: 'wrap' }}>
          {[
            { icon: 'fas fa-comment', label: `${post.commentCount} Comments`, action: () => navigate(`/posts/${post._id}`), authRequired: false },
            { icon: 'fas fa-share', label: 'Share', action: () => {}, authRequired: false },
            { icon: 'fas fa-bookmark', label: 'Save', action: () => {}, authRequired: true },
            {
              icon: post.type === 'question' ? 'fas fa-lightbulb' : post.type === 'tool' ? 'fas fa-handshake' : 'fas fa-exchange-alt',
              label: post.type === 'question' ? 'Answer' : post.type === 'tool' ? 'Request Borrow' : 'Request Exchange',
              action: () => {},
              authRequired: true,
            },
          ].map((btn) => (
            <HtmlBtn
              key={btn.label}
              onClick={(e) => { e.stopPropagation(); btn.authRequired ? requireAuth(btn.action) : btn.action(); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                px: '0.75rem',
                py: '0.4rem',
                borderRadius: '0.5rem',
                color: '#6B7280',
                fontSize: '0.8125rem',
                fontWeight: 400,
                '&:hover': { background: '#F3F4F6', color: '#4F46E5' },
              }}
            >
              <i className={btn.icon} style={{ fontSize: '0.8rem' }} />
              {btn.label}
            </HtmlBtn>
          ))}
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {post.author._id === user?._id && (
          <MuiMenuItem onClick={() => setAnchorEl(null)}>Delete post</MuiMenuItem>
        )}
        <MuiMenuItem onClick={() => setAnchorEl(null)}>Report</MuiMenuItem>
        <MuiMenuItem onClick={() => setAnchorEl(null)}>Copy link</MuiMenuItem>
      </Menu>
    </Box>
  );
};

// ── Feed Skeleton ────────────────────────────────────────────────────────────
const FeedSkeleton: React.FC = () => (
  <>
    {[1, 2, 3].map((i) => (
      <Box
        key={i}
        sx={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', overflow: 'hidden', mb: 0 }}
      >
        <Box sx={{ p: '1.25rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <Skeleton width="25%" height={24} sx={{ mb: 1 }} />
          <Skeleton width="70%" height={28} />
        </Box>
        <Box sx={{ p: '1.25rem 1.5rem' }}>
          <Skeleton width="100%" height={16} />
          <Skeleton width="85%" height={16} sx={{ mt: 0.5 }} />
          <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
        </Box>
        <Box sx={{ p: '0.875rem 1.5rem', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 1 }}>
          <Skeleton width={80} height={32} />
          <Skeleton width={100} height={32} />
          <Skeleton width={60} height={32} />
        </Box>
      </Box>
    ))}
  </>
);

// ── Right Panel ──────────────────────────────────────────────────────────────
const RightSidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box sx={{ borderRadius: '0.75rem', p: '1rem', mb: '1.5rem', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
    <Typography
      sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', mb: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

// Shared empty state for right panel sections
const PanelEmpty: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <Box sx={{ textAlign: 'center', py: '1.25rem' }}>
    <Typography sx={{ fontSize: '1.5rem', mb: '0.5rem' }}>{icon}</Typography>
    <Typography sx={{ fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: 1.5 }}>{text}</Typography>
  </Box>
);

const RightPanel: React.FC = () => {
  const STAT_LABELS = ['Active Users', 'Exchanges', 'Questions Today', 'Events This Week'];

  return (
    <>
      {/* Recent Activity */}
      <RightSidebarSection title="Recent Activity">
        <PanelEmpty icon="📭" text="No activity yet — be the first to post!" />
      </RightSidebarSection>

      {/* Online Now */}
      <RightSidebarSection title="Online Now">
        <PanelEmpty icon="👤" text="No members online right now." />
      </RightSidebarSection>

      {/* Community Stats */}
      <RightSidebarSection title="Community Stats">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
          {STAT_LABELS.map((label) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: '0.875rem 0.5rem',
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}
            >
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1 }}>0</Typography>
              <Typography sx={{ fontSize: '0.7rem', opacity: 0.9, mt: '0.25rem' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </RightSidebarSection>

      {/* Trending Now */}
      <RightSidebarSection title="Trending Now">
        <PanelEmpty icon="📈" text="Nothing trending yet — start a conversation!" />
      </RightSidebarSection>
    </>
  );
};

// ── Feed Page ────────────────────────────────────────────────────────────────
const POST_TYPES = [
  { value: '', label: 'All Posts' },
  { value: 'skill', label: 'Skills' },
  { value: 'tool', label: 'Tools' },
  { value: 'event', label: 'Events' },
  { value: 'question', label: 'Questions' },
  { value: 'general', label: 'General' },
];

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [activeType, setActiveType] = useState('');
  const [sortBy, setSortBy] = useState('new');

  const { data, isLoading } = useQuery({
    queryKey: ['feed', activeType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeType) params.set('type', activeType);
      params.set('limit', '30');
      const res = await api.get(`/posts?${params}`);
      return res.data as { posts: Post[]; total: number };
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ postId, vote }: { postId: string; vote: 'up' | 'down' | null }) =>
      api.put(`/posts/${postId}/vote`, { vote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleVote = (postId: string, vote: 'up' | 'down' | null) => {
    voteMutation.mutate({ postId, vote });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <Layout rightPanel={<RightPanel />}>
      {/* Create Post Widget (authenticated) / Guest join banner */}
      {isAuthenticated ? (
        <Box
          sx={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.75rem',
            p: '1.5rem',
            mb: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          {/* Avatar + input row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 46,
                height: 46,
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                fontSize: '1rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>
            <Box
              onClick={() => navigate('/create')}
              sx={{
                flex: 1,
                p: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                background: '#F9FAFB',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#6B7280',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
              }}
            >
              What do you want to share or ask?
            </Box>
          </Box>

          {/* Post type buttons */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
            {[
              { icon: 'fas fa-question-circle', label: 'Ask Question', type: 'question' },
              { icon: 'fas fa-chalkboard-teacher', label: 'Share Skill', type: 'skill' },
              { icon: 'fas fa-tools', label: 'List Tool', type: 'tool' },
              { icon: 'fas fa-calendar-alt', label: 'Create Event', type: 'event' },
            ].map((btn) => (
              <HtmlBtn
                key={btn.type}
                onClick={() => navigate(`/create?type=${btn.type}`)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  p: '0.875rem 0.5rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  color: '#1F2937',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  minHeight: 80,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#4F46E5', background: '#F3F4F6', transform: 'translateY(-2px)' },
                  '& i': { color: '#4F46E5', fontSize: '1.25rem' },
                }}
              >
                <i className={btn.icon} />
                {btn.label}
              </HtmlBtn>
            ))}
          </Box>
        </Box>
      ) : (
        /* Guest join banner */
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4F46E5, #10B981)',
            borderRadius: '0.75rem',
            p: '1.75rem 2rem',
            mb: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(79,70,229,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', mb: '0.375rem', fontFamily: 'Poppins, Inter, sans-serif' }}>
              🤝 Join the Neighbourhood Exchange
            </Typography>
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              Share skills, borrow tools, ask questions and connect with your community.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <HtmlBtn
              onClick={() => navigate('/login')}
              sx={{
                px: '1.25rem',
                py: '0.65rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#4F46E5',
                background: '#fff',
                '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </HtmlBtn>
            <HtmlBtn
              onClick={() => navigate('/register')}
              sx={{
                px: '1.25rem',
                py: '0.65rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                '&:hover': { background: 'rgba(255,255,255,0.3)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s',
              }}
            >
              Join Free
            </HtmlBtn>
          </Box>
        </Box>
      )}

      {/* Filter tabs */}
      <Box
        sx={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          mb: '1.5rem',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: '1rem',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Box sx={{ display: 'flex', overflowX: 'auto' }}>
            {POST_TYPES.map((t) => (
              <HtmlBtn
                key={t.value}
                onClick={() => setActiveType(t.value)}
                sx={{
                  px: '1rem',
                  py: '0.875rem',
                  fontSize: '0.875rem',
                  fontWeight: activeType === t.value ? 600 : 400,
                  color: activeType === t.value ? '#4F46E5' : '#6B7280',
                  borderBottom: activeType === t.value ? '2px solid #4F46E5' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  '&:hover': { color: '#4F46E5' },
                }}
              >
                {t.label}
              </HtmlBtn>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {['new', 'hot', 'top'].map((s) => (
              <HtmlBtn
                key={s}
                onClick={() => setSortBy(s)}
                sx={{
                  px: '0.625rem',
                  py: '0.375rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: sortBy === s ? 600 : 400,
                  color: sortBy === s ? '#4F46E5' : '#6B7280',
                  background: sortBy === s ? '#EEF2FF' : 'transparent',
                  textTransform: 'capitalize',
                  '&:hover': { background: '#F3F4F6', color: '#4F46E5' },
                }}
              >
                <i
                  className={s === 'new' ? 'fas fa-clock' : s === 'hot' ? 'fas fa-fire' : 'fas fa-chart-line'}
                  style={{ marginRight: '0.375rem', fontSize: '0.75rem' }}
                />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </HtmlBtn>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Posts */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <FeedSkeleton />
        ) : data?.posts?.length === 0 ? (
          <Box
            sx={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.75rem',
              p: '4rem 2rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            <Typography sx={{ fontSize: '2.5rem', mb: '0.75rem' }}>🌱</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', mb: '0.5rem', color: '#1F2937' }}>
              No posts yet
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.875rem', mb: '1.5rem' }}>
              {isAuthenticated ? 'Be the first to share something with your community!' : 'Join to be the first to share something with your community!'}
            </Typography>
            <HtmlBtn
              onClick={() => navigate(isAuthenticated ? '/create' : '/register')}
              sx={{
                px: '1.5rem',
                py: '0.75rem',
                background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9375rem',
                '&:hover': { opacity: 0.9 },
              }}
            >
              {isAuthenticated ? 'Create a Post' : 'Join the Community'}
            </HtmlBtn>
          </Box>
        ) : (
          data?.posts?.map((post) => (
            <PostCard key={post._id} post={post} onVote={handleVote} />
          ))
        )}
      </Box>
    </Layout>
  );
};

export default Feed;
