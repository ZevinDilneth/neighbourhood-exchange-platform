import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const POST_TYPES = [
  {
    value: 'question',
    icon: 'fa-question-circle',
    label: 'Question',
    description: 'Ask the community',
    placeholder: 'e.g. Does anyone know a good plumber nearby?',
  },
  {
    value: 'skill',
    icon: 'fa-chalkboard-teacher',
    label: 'Skill',
    description: 'Share what you offer',
    placeholder: 'e.g. I can teach beginner woodworking...',
  },
  {
    value: 'tool',
    icon: 'fa-tools',
    label: 'Tool',
    description: 'Lend or borrow tools',
    placeholder: 'e.g. Offering a drill press for borrowing...',
  },
  {
    value: 'event',
    icon: 'fa-calendar-alt',
    label: 'Event',
    description: 'Organise a meetup',
    placeholder: 'e.g. Hosting a neighbourhood skill swap this Saturday...',
  },
];

const inputStyle = {
  width: '100%',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  fontFamily: 'Inter, sans-serif',
  color: '#1F2937',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
};

interface FormState {
  type: string;
  title: string;
  content: string;
  tags: string[];
  ceuRate?: string;
  eventDate?: string;
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'question';

  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    type: defaultType,
    title: '',
    content: '',
    tags: [],
    ceuRate: '',
    eventDate: '',
  });

  // Sync the post type whenever the URL ?type= param changes
  // (handles navigation from sidebar quick actions while the component is already mounted)
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && POST_TYPES.some((t) => t.value === typeFromUrl)) {
      setForm((prev) => ({ ...prev, type: typeFromUrl }));
    }
  }, [searchParams]);

  const selectedType = POST_TYPES.find((t) => t.value === form.type) || POST_TYPES[0];

  const mutation = useMutation({
    mutationFn: (data: FormState) => api.post('/posts', data),
    onSuccess: () => navigate('/feed'),
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Post not saved — check your connection and try again.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required — add a title before posting.'); return; }
    if (!form.content.trim()) { setError('Content is required — add some content before posting.'); return; }
    setError('');
    mutation.mutate(form);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const showCeuField = form.type === 'skill' || form.type === 'tool';
  const showEventDate = form.type === 'event';

  return (
    <Layout>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>

        {/* Page Header Card */}
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
            gap: '1rem',
          }}
        >
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
            <i className="fas fa-pen-nib" />
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
              Create Post
            </Box>
            <Box sx={{ color: '#6B7280', fontSize: '0.875rem', mt: '0.25rem' }}>
              Share something with your neighbourhood community
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: '1.25rem', borderRadius: '0.75rem' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>

          {/* Post Type Selector */}
          <Box
            sx={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              padding: '1.5rem',
              mb: '1rem',
            }}
          >
            <Box
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#1F2937',
                mb: '0.875rem',
              }}
            >
              Post Type <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
              }}
            >
              {POST_TYPES.map((t) => {
                const isSelected = form.type === t.value;
                return (
                  <Box
                    key={t.value}
                    onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}
                    sx={{
                      border: isSelected ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      borderRadius: '0.5rem',
                      padding: '1.25rem 0.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: '#4F46E5',
                        background: '#F5F3FF',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '1.5rem',
                        color: '#4F46E5',
                        mb: '0.5rem',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <i className={`fas ${t.icon}`} />
                    </Box>
                    <Box
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        color: '#1F2937',
                        mb: '0.25rem',
                      }}
                    >
                      {t.label}
                    </Box>
                    <Box
                      sx={{
                        fontSize: '0.7rem',
                        color: '#6B7280',
                        lineHeight: 1.3,
                      }}
                    >
                      {t.description}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Form Fields Card */}
          <Box
            sx={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              padding: '1.5rem',
              mb: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Title */}
            <Box>
              <Box
                component="label"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  mb: '0.5rem',
                }}
              >
                Title <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
              </Box>
              <Box
                component="input"
                type="text"
                placeholder={`Give your post a clear title...`}
                value={form.title}
                maxLength={200}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                sx={{
                  ...inputStyle,
                  '&:focus': { borderColor: '#4F46E5' },
                  '&::placeholder': { color: '#9CA3AF' },
                }}
              />
            </Box>

            {/* Content */}
            <Box>
              <Box
                component="label"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  mb: '0.5rem',
                }}
              >
                Content <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
              </Box>
              <Box
                component="textarea"
                placeholder={selectedType.placeholder}
                value={form.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                sx={{
                  ...inputStyle,
                  minHeight: '140px',
                  resize: 'vertical',
                  '&:focus': { borderColor: '#4F46E5' },
                  '&::placeholder': { color: '#9CA3AF' },
                }}
              />
            </Box>

            {/* Tags */}
            <Box>
              <Box
                component="label"
                sx={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  mb: '0.5rem',
                }}
              >
                Tags
                <Box component="span" sx={{ color: '#6B7280', fontWeight: 400, ml: '0.375rem' }}>
                  (press Enter to add, max 8)
                </Box>
              </Box>
              <Box
                component="input"
                type="text"
                placeholder="Add tags and press Enter..."
                value={tagInput}
                disabled={form.tags.length >= 8}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                sx={{
                  ...inputStyle,
                  '&:focus': { borderColor: '#4F46E5' },
                  '&::placeholder': { color: '#9CA3AF' },
                  '&:disabled': { background: '#F9FAFB', cursor: 'not-allowed' },
                }}
              />
              {form.tags.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    mt: '0.75rem',
                  }}
                >
                  {form.tags.map((tag) => (
                    <Box
                      key={tag}
                      sx={{
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE',
                        borderRadius: '2rem',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      #{tag}
                      <Box
                        component="button"
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((t) => t !== tag),
                          }))
                        }
                        sx={{
                          background: 'none',
                          border: 'none',
                          color: '#6366F1',
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 1,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          '&:hover': { color: '#EF4444' },
                        }}
                      >
                        <i className="fas fa-times" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Conditional: CEU Rate for skills/tools */}
            {showCeuField && (
              <Box>
                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#1F2937',
                    mb: '0.5rem',
                  }}
                >
                  CEU Rate
                  <Box component="span" sx={{ color: '#6B7280', fontWeight: 400, ml: '0.375rem' }}>
                    (Community Exchange Units per hour)
                  </Box>
                </Box>
                <Box
                  component="input"
                  type="number"
                  placeholder="e.g. 2"
                  min="0"
                  step="0.5"
                  value={form.ceuRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({ ...prev, ceuRate: e.target.value }))
                  }
                  sx={{
                    ...inputStyle,
                    maxWidth: 200,
                    '&:focus': { borderColor: '#4F46E5' },
                    '&::placeholder': { color: '#9CA3AF' },
                  }}
                />
              </Box>
            )}

            {/* Conditional: Event Date for events */}
            {showEventDate && (
              <Box>
                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#1F2937',
                    mb: '0.5rem',
                  }}
                >
                  Event Date & Time
                </Box>
                <Box
                  component="input"
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({ ...prev, eventDate: e.target.value }))
                  }
                  sx={{
                    ...inputStyle,
                    maxWidth: 300,
                    '&:focus': { borderColor: '#4F46E5' },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Submit Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => navigate('/feed')}
              sx={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#374151',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s',
                '&:hover': { background: '#F3F4F6', borderColor: '#D1D5DB' },
              }}
            >
              <i className="fas fa-times" />
              Cancel
            </Box>
            <Box
              component="button"
              type="submit"
              disabled={mutation.isPending}
              sx={{
                background: mutation.isPending
                  ? '#9CA3AF'
                  : 'linear-gradient(135deg, #4F46E5, #10B981)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: mutation.isPending ? 1 : 0.9 },
              }}
            >
              {mutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  Post to Community
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default CreatePost;
