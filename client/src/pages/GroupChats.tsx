import React, { useState, useEffect, useRef } from 'react';
import { Box, Avatar, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Message, Group } from '../types';

const GRADIENT = 'linear-gradient(135deg, #4F46E5, #10B981)';

const toolBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  background: '#FFFFFF',
  color: '#6B7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  flexShrink: 0,
};

const headerBtnStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  background: '#FFFFFF',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'background 0.15s, border-color 0.15s',
};

const GroupChats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState<{ userId: string; name?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: group } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => { const res = await api.get(`/groups/${id}`); return res.data as Group; },
  });

  const { isLoading } = useQuery({
    queryKey: ['groupMessages', id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/messages`);
      setMessages(res.data);
      return res.data as Message[];
    },
  });

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-group', id);

    socket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?._id) {
        setIsTyping(data.isTyping ? data : null);
      }
    });

    return () => {
      socket.emit('leave-group', id);
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [id, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('send-message', { groupId: id, content: input.trim() });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    const socket = getSocket();
    socket.emit('typing', { groupId: id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { groupId: id, isTyping: false });
    }, 2000);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMine = (msg: Message) => msg.sender._id === user?._id;

  // Determine member role label for a sender
  const getSenderRole = (msg: Message): string | null => {
    if (!group) return null;
    if (group.admin._id === msg.sender._id) return 'Admin';
    const isMod = group.moderators.some(m => m._id === msg.sender._id);
    if (isMod) return 'Moderator';
    return null;
  };

  return (
    <Layout hideSidebar={false}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 56px)',
          overflow: 'hidden',
        }}
      >
        {/* ── Chat Header ── */}
        <Box
          sx={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Left: group info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Back button */}
            <button
              style={{
                ...headerBtnStyle,
                padding: '0.5rem 0.75rem',
              }}
              onClick={() => navigate(`/groups/${id}`)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F46E5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              }}
            >
              <i className="fas fa-arrow-left" style={{ color: '#4F46E5' }} />
            </button>

            {/* Group avatar */}
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '0.75rem',
                background: group?.avatar ? 'none' : GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.125rem',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {group?.avatar ? (
                <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                group?.name?.[0]?.toUpperCase() ?? 'G'
              )}
            </Box>

            <Box>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  lineHeight: 1.25,
                }}
              >
                {group?.name || 'Group Chat'}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  marginTop: '0.25rem',
                }}
              >
                {group?.memberCount ?? '—'} members
              </div>
            </Box>
          </Box>

          {/* Right: action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              style={headerBtnStyle}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F46E5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              }}
              onClick={() => navigate(`/groups/${id}`)}
            >
              <i className="fas fa-users" style={{ color: '#4F46E5' }} />
              Members
            </button>
            <button
              style={headerBtnStyle}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#4F46E5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              }}
              onClick={() => navigate(`/groups/${id}/settings`)}
            >
              <i className="fas fa-cog" style={{ color: '#4F46E5' }} />
              Settings
            </button>
          </Box>
        </Box>

        {/* ── Messages Area ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: '#FFFFFF',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: i % 2 ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                }}
              >
                {i % 2 === 0 && <Skeleton variant="circular" width={32} height={32} />}
                <Skeleton variant="rounded" width={200} height={60} sx={{ borderRadius: '1rem' }} />
              </Box>
            ))
          ) : (
            messages.map((msg) => {
              const mine = isMine(msg);
              const roleLabel = !mine ? getSenderRole(msg) : null;
              return (
                <Box
                  key={msg._id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                  }}
                >
                  {/* Row: avatar + bubble */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-end',
                      flexDirection: mine ? 'row-reverse' : 'row',
                    }}
                  >
                    {/* Avatar (other messages only) */}
                    {!mine && (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: msg.sender.avatar ? 'none' : GRADIENT,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {msg.sender.avatar ? (
                          <img
                            src={msg.sender.avatar}
                            alt={msg.sender.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          msg.sender.name[0]?.toUpperCase()
                        )}
                      </Box>
                    )}

                    {/* Bubble */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                      {/* Sender name + role badge (other messages) */}
                      {!mine && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            mb: '0.25rem',
                            ml: '0.25rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#1F2937',
                            }}
                          >
                            {msg.sender.name}
                          </span>
                          {roleLabel && (
                            <span
                              style={{
                                background: GRADIENT,
                                color: '#FFFFFF',
                                fontSize: '0.75rem',
                                borderRadius: '2rem',
                                padding: '0.1rem 0.5rem',
                                fontWeight: 500,
                              }}
                            >
                              {roleLabel}
                            </span>
                          )}
                        </Box>
                      )}

                      {/* Message content bubble */}
                      <Box
                        sx={{
                          background: mine ? '#E0F2FE' : '#F3F4F6',
                          borderRadius: mine
                            ? '1rem 1rem 0.375rem 1rem'
                            : '1rem 1rem 1rem 0.375rem',
                          padding: '0.75rem 1rem',
                          color: '#1F2937',
                          fontSize: '0.875rem',
                          wordBreak: 'break-word',
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content}
                      </Box>

                      {/* Timestamp */}
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          marginTop: '0.25rem',
                          textAlign: mine ? 'right' : 'left',
                          paddingLeft: mine ? 0 : '0.25rem',
                          paddingRight: mine ? '0.25rem' : 0,
                        }}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </div>
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <Box
              sx={{
                alignSelf: 'flex-start',
                background: '#F3F4F6',
                borderRadius: '1rem 1rem 1rem 0.375rem',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                color: '#6B7280',
              }}
            >
              typing...
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* ── Input Area ── */}
        <Box
          sx={{
            background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          {/* Tools row */}
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { icon: 'fas fa-smile', label: 'Emoji' },
              { icon: 'fas fa-paperclip', label: 'Attach' },
              { icon: 'fas fa-map-marker-alt', label: 'Location' },
              { icon: 'fas fa-chart-bar', label: 'Poll' },
            ].map(({ icon, label }) => (
              <button
                key={label}
                title={label}
                style={toolBtnStyle}
                onMouseEnter={e => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.background = '#F3F4F6';
                  btn.style.color = '#4F46E5';
                  btn.style.borderColor = '#4F46E5';
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.background = '#FFFFFF';
                  btn.style.color = '#6B7280';
                  btn.style.borderColor = '#E5E7EB';
                }}
              >
                <i className={icon} />
              </button>
            ))}
          </Box>

          {/* Input row */}
          <Box sx={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              placeholder="Message the group..."
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                background: '#F9FAFB',
                resize: 'none',
                minHeight: 44,
                maxHeight: 120,
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                overflowY: 'auto',
                color: '#1F2937',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: 44,
                height: 44,
                background: input.trim() ? GRADIENT : '#E5E7EB',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '1.25rem',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                opacity: input.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => {
                if (input.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              <i className="fas fa-paper-plane" />
            </button>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default GroupChats;
