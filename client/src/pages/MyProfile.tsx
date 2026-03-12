import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Post, Exchange } from '../types';

// ─── Gradient pool for tool cards ─────────────────────────────────────────────
const TOOL_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1.25rem', textAlign: 'center' }}>
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#4F46E5', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2, mb: '0.25rem' }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>{label}</Typography>
  </Box>
);

const Section: React.FC<{ icon: string; title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ icon, title, action, children }) => (
  <Box sx={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', p: '1.5rem', mb: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1.5rem', pb: '0.75rem', borderBottom: '2px solid #F9FAFB' }}>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Poppins, sans-serif' }}>
        <i className={`fas ${icon}`} style={{ color: '#4F46E5' }} />
        {title}
      </Typography>
      {action && <Box sx={{ display: 'flex', gap: '0.5rem' }}>{action}</Box>}
    </Box>
    {children}
  </Box>
);

const SectionIconBtn: React.FC<{ icon: string; onClick?: () => void }> = ({ icon, onClick }) => (
  <Box component="button" onClick={onClick} sx={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', p: '0.5rem', borderRadius: '0.375rem', fontSize: '0.875rem', transition: 'all 0.2s', '&:hover': { color: '#4F46E5', background: '#F3F4F6' } }}>
    <i className={`fas ${icon}`} />
  </Box>
);

const RankingCard: React.FC<{ icon: string; title: string; tier: string; progress: number; sub: string }> = ({ icon, title, tier, progress, sub }) => (
  <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1.25rem', textAlign: 'center', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', transform: 'translateY(-2px)' } }}>
    <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', mx: 'auto', mb: '1rem' }}>
      <i className={`fas ${icon}`} />
    </Box>
    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', mb: '0.5rem' }}>{title}</Typography>
    <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#4F46E5', mb: '0.5rem' }}>{tier}</Typography>
    <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2, background: '#E5E7EB', '& .MuiLinearProgress-bar': { background: 'linear-gradient(135deg, #4F46E5, #10B981)', borderRadius: 2 } }} />
    <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: '0.5rem' }}>{sub}</Typography>
  </Box>
);

const BadgeCard: React.FC<{ icon: string; name: string; desc: string }> = ({ icon, name, desc }) => (
  <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', transform: 'translateY(-2px)' } }}>
    <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', mx: 'auto', mb: '0.75rem' }}>
      <i className={`fas ${icon}`} />
    </Box>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1F2937', mb: '0.25rem' }}>{name}</Typography>
    <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>{desc}</Typography>
  </Box>
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Compute tier label + progress % for a numeric value against thresholds */
const getTier = (count: number, silver: number, gold: number): { tier: string; progress: number } => {
  if (count >= gold)   return { tier: 'Gold Tier',   progress: 100 };
  if (count >= silver) return { tier: 'Silver Tier', progress: Math.round((count / gold) * 100) };
  return { tier: 'Bronze Tier', progress: Math.round((count / silver) * 100) };
};

// ─── Build personalised phases for a given user ────────────────────────────────
const buildPhases = (userName: string, skills: { name: string }[], interests: { name: string }[]) => {
  const skillList  = skills.slice(0, 3).map((s) => s.name).join(', ') || 'my skills';
  const wantList   = interests.slice(0, 2).map((i) => i.name).join(' and ') || 'learning new skills';
  return [
    {
      duration: 4,
      instruction: 'Look directly at the camera',
      subtext: 'Hold still — make sure your face is well-lit and clearly visible.',
      icon: 'fa-eye',
    },
    {
      duration: 7,
      instruction: 'Introduce yourself',
      subtext: '',
      icon: 'fa-user',
      quote: true,
      quoteText: `"Hi, my name is ${userName}. I'm a real person and I'm here to share and learn with my neighbours."`,
    },
    {
      duration: 6,
      instruction: 'Describe what you offer',
      subtext: '',
      icon: 'fa-hands-helping',
      quote: true,
      quoteText: `"I can offer ${skillList}."`,
    },
    {
      duration: 5,
      instruction: 'Share what you want to learn',
      subtext: '',
      icon: 'fa-graduation-cap',
      quote: true,
      quoteText: `"I'm looking to learn ${wantList}."`,
    },
    {
      duration: 3,
      instruction: 'Slowly turn your head to the LEFT',
      subtext: 'Keep your face visible — this confirms you are physically present.',
      icon: 'fa-arrow-left',
    },
    {
      duration: 3,
      instruction: 'Slowly turn your head to the RIGHT',
      subtext: 'Return back through center.',
      icon: 'fa-arrow-right',
    },
    {
      duration: 3,
      instruction: 'Face forward and smile',
      subtext: 'Almost done — thank you for verifying!',
      icon: 'fa-smile',
    },
  ];
};

// ─── VideoIntroModal ────────────────────────────────────────────────────────────
const VideoIntroModal: React.FC<{
  open: boolean;
  onClose: () => void;
  userName: string;
  userSkills: { name: string }[];
  userInterests: { name: string }[];
  onSaved: (url: string) => void;
}> = ({ open, onClose, userName, userSkills, userInterests, onSaved }) => {
  const PHASES = buildPhases(userName, userSkills, userInterests);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const previewRef  = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stage, setStage]         = useState<'ready' | 'recording' | 'review' | 'uploading'>('ready');
  const [phase, setPhase]         = useState(0);           // 0-based index into PHASES
  const [countdown, setCountdown] = useState(0);
  const [blob, setBlob]           = useState<Blob | null>(null);
  const [camError, setCamError]   = useState('');
  const [uploadError, setUploadError] = useState('');

  const totalDuration = PHASES.reduce((s, p) => s + p.duration, 0);
  type PhaseType = (typeof PHASES)[number];
  const elapsedDuration = PHASES.slice(0, phase).reduce((s, p) => s + p.duration, 0);
  const overallProgress = Math.round(((elapsedDuration + (PHASES[phase]?.duration ?? 0) - countdown) / totalDuration) * 100);

  // Start camera when modal opens
  useEffect(() => {
    if (!open) return;
    setStage('ready');
    setPhase(0);
    setCountdown(0);
    setBlob(null);
    setCamError('');
    setUploadError('');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setCamError('Camera access denied. Please allow camera and microphone access in your browser settings.'));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open]);

  // Stop stream on close
  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  }, [onClose]);

  // Advance through phases automatically
  const startPhase = useCallback((idx: number) => {
    if (idx >= PHASES.length) {
      // All phases done — stop recording
      recorderRef.current?.stop();
      setStage('review');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setPhase(idx);
    setCountdown(PHASES[idx].duration);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          startPhase(idx + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType });
      setBlob(recorded);
      // Show preview
      const url = URL.createObjectURL(recorded);
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.src = url;
          previewRef.current.load();
        }
      }, 100);
    };

    recorder.start(100);
    setStage('recording');
    startPhase(0);
  }, [startPhase]);

  const handleUpload = useCallback(async () => {
    if (!blob) return;
    setStage('uploading');
    setUploadError('');
    try {
      const ext  = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const form = new FormData();
      form.append('video', blob, `video-intro.${ext}`);
      const res = await api.put('/users/me/video-intro', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(res.data.videoIntro);
      handleClose();
    } catch {
      setUploadError('Upload failed. Please try again.');
      setStage('review');
    }
  }, [blob, onSaved, handleClose]);

  const currentPhase = PHASES[phase];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '0.75rem', overflow: 'hidden', background: '#111827' } }}>
      {/* Header */}
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', py: '1rem', px: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="fas fa-video" style={{ fontSize: '1.125rem' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Poppins, sans-serif' }}>Identity Verification Video</Typography>
            <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>Follow the on-screen instructions to verify your identity</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
          <i className="fas fa-times" style={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, minHeight: 400 }}>

          {/* ── Left: camera / preview ── */}
          <Box sx={{ position: 'relative', background: '#000', minHeight: 360 }}>
            {camError ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, gap: 2 }}>
                <i className="fas fa-camera-slash" style={{ fontSize: '3rem', color: '#EF4444' }} />
                <Typography sx={{ color: '#F9FAFB', textAlign: 'center', fontSize: '0.9375rem' }}>{camError}</Typography>
              </Box>
            ) : (
              <>
                {/* Live camera */}
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: stage === 'review' || stage === 'uploading' ? 'none' : 'block' }} />
                {/* Recorded preview */}
                <video ref={previewRef} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: stage === 'review' || stage === 'uploading' ? 'block' : 'none', background: '#000' }} />

                {/* Phase overlay — shown while recording */}
                {stage === 'recording' && currentPhase && (
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', p: '1.5rem 1.25rem 1.25rem' }}>
                    {/* Overall progress bar */}
                    <LinearProgress variant="determinate" value={overallProgress} sx={{ mb: '1rem', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(135deg, #4F46E5, #10B981)' } }} />

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`fas ${currentPhase.icon}`} style={{ color: '#fff', fontSize: '1.125rem' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', mb: '0.25rem', fontFamily: 'Poppins, sans-serif' }}>
                          {currentPhase.instruction}
                        </Typography>
                        {currentPhase.quote ? (
                          <Typography sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.9375rem', fontStyle: 'italic', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.375rem', px: '0.75rem', py: '0.375rem', display: 'block', mt: '0.375rem', lineHeight: 1.6 }}>
                            {(currentPhase as { quoteText?: string }).quoteText}
                          </Typography>
                        ) : (
                          <Typography sx={{ color: '#D1D5DB', fontSize: '0.8125rem' }}>{currentPhase.subtext}</Typography>
                        )}
                      </Box>
                      {/* Countdown bubble */}
                      <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif' }}>{countdown}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Recording indicator */}
                {stage === 'recording' && (
                  <Box sx={{ position: 'absolute', top: '0.875rem', left: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.9)', px: '0.75rem', py: '0.375rem', borderRadius: '2rem' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
                    <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>REC</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* ── Right: steps panel ── */}
          <Box sx={{ background: '#1F2937', p: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Typography sx={{ color: '#F9FAFB', fontWeight: 600, fontSize: '0.9375rem', fontFamily: 'Poppins, sans-serif', mb: '0.25rem' }}>Verification Steps</Typography>

            {PHASES.map((p, idx) => {
              const isDone    = stage === 'recording' && idx < phase;
              const isActive  = stage === 'recording' && idx === phase;
              const isPending = stage === 'recording' && idx > phase;
              const isReady   = stage === 'ready';
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', opacity: isPending ? 0.4 : 1, transition: 'opacity 0.3s' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', background: isDone ? '#10B981' : isActive ? 'linear-gradient(135deg, #4F46E5, #10B981)' : 'rgba(255,255,255,0.1)', border: isActive ? 'none' : isDone ? 'none' : '1px solid rgba(255,255,255,0.2)', transition: 'all 0.3s' }}>
                    {isDone ? (
                      <i className="fas fa-check" style={{ color: '#fff' }} />
                    ) : (
                      <i className={`fas ${p.icon}`} style={{ color: isActive ? '#fff' : '#9CA3AF' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: isDone ? '#10B981' : isActive ? '#fff' : '#9CA3AF', fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, lineHeight: 1.4 }}>
                      {p.instruction}
                    </Typography>
                    <Typography sx={{ color: '#6B7280', fontSize: '0.75rem' }}>{p.duration}s</Typography>
                  </Box>
                </Box>
              );
            })}

            {/* Action buttons */}
            <Box sx={{ mt: 'auto', pt: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {(stage === 'ready' || stage === 'recording') && !camError && (
                <Button onClick={startRecording} disabled={stage === 'recording'} sx={{ background: stage === 'recording' ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: '0.5rem', py: '0.75rem', '&:hover': { opacity: 0.9 }, '&:disabled': { color: '#EF4444', border: '1px solid #EF4444' } }}>
                  {stage === 'recording' ? (
                    <><i className="fas fa-circle" style={{ marginRight: '0.5rem', color: '#EF4444', animation: 'pulse 1s infinite' }} /> Recording… follow instructions</>
                  ) : (
                    <><i className="fas fa-play" style={{ marginRight: '0.5rem' }} /> Start Recording</>
                  )}
                </Button>
              )}

              {stage === 'review' && (
                <>
                  {uploadError && <Typography sx={{ color: '#EF4444', fontSize: '0.8125rem', textAlign: 'center' }}>{uploadError}</Typography>}
                  <Button onClick={handleUpload} sx={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: '0.5rem', py: '0.75rem', '&:hover': { opacity: 0.9 } }}>
                    <i className="fas fa-cloud-upload-alt" style={{ marginRight: '0.5rem' }} /> Save Verification Video
                  </Button>
                  <Button onClick={() => { setStage('ready'); setBlob(null); }} sx={{ color: '#9CA3AF', fontWeight: 500, textTransform: 'none', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', py: '0.625rem', '&:hover': { borderColor: '#9CA3AF', background: 'rgba(255,255,255,0.05)' } }}>
                    <i className="fas fa-redo" style={{ marginRight: '0.5rem' }} /> Record Again
                  </Button>
                </>
              )}

              {stage === 'uploading' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', py: '0.5rem' }}>
                  <CircularProgress size={32} sx={{ color: '#10B981' }} />
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Uploading verification video…</Typography>
                </Box>
              )}

              <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.5 }}>
                Total recording time: ~{totalDuration}s. Your video is stored securely and used only for identity verification.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </Dialog>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const MyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [savedVideoUrl, setSavedVideoUrl]   = useState<string | null>(null);

  const profileId = (!id || id === 'me') ? currentUser?._id : id;
  const isOwnProfile = !id || id === 'me' || id === currentUser?._id;

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery<User>({
    queryKey: ['profile', profileId],
    queryFn: () => api.get(`/users/${profileId}`).then((r) => r.data),
    enabled: !!profileId,
  });

  const { data: postsData } = useQuery<{ posts: Post[] }>({
    queryKey: ['userPosts', profileId],
    queryFn: () => api.get(`/users/${profileId}/posts`).then((r) => r.data),
    enabled: !!profileId,
  });

  const { data: exchangesData } = useQuery<{ exchanges: Exchange[] }>({
    queryKey: ['userExchanges', profileId],
    queryFn: () => api.get(`/users/${profileId}/exchanges`).then((r) => r.data),
    enabled: !!profileId,
  });

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (profileLoading || !profile) {
    return (
      <Layout>
        <Box sx={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', p: '2rem', mb: '1.5rem' }}>
          <Box sx={{ display: 'flex', gap: '1.5rem', mb: '2rem' }}>
            <Skeleton variant="circular" width={120} height={120} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="text" width="25%" height={24} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={80} />)}
          </Box>
        </Box>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={200} sx={{ mb: '1.5rem', borderRadius: '0.75rem' }} />)}
      </Layout>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const toolPosts        = postsData?.posts?.filter((p) => p.type === 'tool') ?? [];
  const allPosts         = postsData?.posts ?? [];
  const allExchanges     = exchangesData?.exchanges ?? [];
  const completedExchanges = allExchanges.filter((e) => e.status === 'completed');
  const hasLocation      = profile.location?.city || profile.location?.neighbourhood;

  const memberSince = profile.createdAt
    ? format(new Date(profile.createdAt as unknown as string), 'MMMM yyyy')
    : null;

  // ── Ranking data — only show cards with actual data ───────────────────────────
  const rankingCards: Array<{ icon: string; title: string; tier: string; progress: number; sub: string }> = [];

  if (profile.exchangeCount > 0) {
    const r = getTier(profile.exchangeCount, 10, 20);
    rankingCards.push({ icon: 'fa-medal', title: 'Overall Rank', tier: r.tier, progress: r.progress, sub: `${profile.exchangeCount} exchanges completed` });
  }
  if (profile.skills.length > 0) {
    const r = getTier(profile.skills.length, 3, 5);
    rankingCards.push({ icon: 'fa-chalkboard-teacher', title: 'Skill Teacher', tier: r.tier, progress: r.progress, sub: `${profile.skills.length} skill${profile.skills.length !== 1 ? 's' : ''} listed` });
  }
  if (toolPosts.length > 0) {
    const r = getTier(toolPosts.length, 2, 5);
    rankingCards.push({ icon: 'fa-tools', title: 'Tool Lender', tier: r.tier, progress: r.progress, sub: `${toolPosts.length} tools listed` });
  }
  if (profile.trustScore > 0) {
    const r = getTier(profile.trustScore, 50, 80);
    rankingCards.push({ icon: 'fa-comments', title: 'Q&A Contributor', tier: r.tier, progress: r.progress, sub: `${profile.trustScore}% trust score` });
  }

  // ── Earned badges ─────────────────────────────────────────────────────────────
  const earnedBadges: Array<{ icon: string; name: string; desc: string }> = [];
  if (profile.isVerified)              earnedBadges.push({ icon: 'fa-check-circle',   name: 'Verified User',    desc: 'Email verified' });
  if (profile.exchangeCount >= 1)      earnedBadges.push({ icon: 'fa-handshake',      name: 'First Exchange',   desc: 'Completed 1st exchange' });
  if (profile.exchangeCount >= 10)     earnedBadges.push({ icon: 'fa-star',           name: 'Community Star',   desc: '10+ exchanges' });
  if (profile.skills.length >= 3)      earnedBadges.push({ icon: 'fa-graduation-cap', name: 'Skill Expert',     desc: '3+ skills listed' });
  if (toolPosts.length >= 1)           earnedBadges.push({ icon: 'fa-tools',          name: 'Tool Sharer',      desc: 'Listed a tool' });
  if (profile.trustScore >= 80)        earnedBadges.push({ icon: 'fa-shield-alt',     name: 'Trusted Member',   desc: '80%+ trust score' });

  // ── Recent Activity timeline ─────────────────────────────────────────────────
  type ActivityItem = {
    id: string;
    icon: string;
    title: string;
    description: string;
    date: Date;
  };

  const activityItems: ActivityItem[] = [
    ...allExchanges.slice(0, 10).map((ex) => {
      const other = (ex.requester as unknown as User)?._id === profileId
        ? (ex.provider as unknown as User)?.name ?? 'someone'
        : (ex.requester as unknown as User)?.name ?? 'someone';
      const statusLabel = ex.status === 'completed' ? 'Completed exchange' : ex.status === 'active' ? 'Exchange in progress' : 'Exchange requested';
      const icon = ex.status === 'completed' ? 'fa-exchange-alt' : ex.status === 'active' ? 'fa-check' : 'fa-paper-plane';
      return {
        id: `ex-${ex._id}`,
        icon,
        title: statusLabel,
        description: `${ex.title ?? 'Exchange'} with ${other}.`,
        date: new Date(ex.updatedAt as unknown as string ?? ex.createdAt as unknown as string),
      };
    }),
    ...allPosts.slice(0, 10).map((post) => {
      const typeLabels: Record<string, string> = { skill: 'Posted a skill', tool: 'Listed a tool', event: 'Created an event', question: 'Posted a question', offer: 'Posted an offer' };
      const typeIcons: Record<string, string>  = { skill: 'fa-graduation-cap', tool: 'fa-tools', event: 'fa-calendar', question: 'fa-question-circle', offer: 'fa-tag' };
      return {
        id: `post-${post._id}`,
        icon: typeIcons[post.type] ?? 'fa-file-alt',
        title: typeLabels[post.type] ?? 'New post',
        description: post.title,
        date: new Date(post.createdAt as unknown as string),
      };
    }),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

  // ── CEU transaction list built from completed exchanges ──────────────────────
  const ceuTransactions = completedExchanges.slice(0, 4).map((ex) => {
    const other = (ex.requester as unknown as User)?._id === profileId
      ? (ex.provider as unknown as User)?.name ?? 'Neighbour'
      : (ex.requester as unknown as User)?.name ?? 'Neighbour';
    const icon = ex.title?.toLowerCase().includes('tool') ? 'fa-tools' : 'fa-exchange-alt';
    return {
      id: ex._id,
      icon,
      title: `${ex.title ?? 'Exchange'} — ${other}`,
      time: formatDistanceToNow(new Date(ex.updatedAt as unknown as string ?? ex.createdAt as unknown as string), { addSuffix: true }),
      amount: '+' + ((ex.ceuValue ?? 20)) + ' CEU',
      positive: true,
    };
  });

  // ── Button styles ─────────────────────────────────────────────────────────────
  const gradientBtn = {
    background: 'linear-gradient(135deg, #4F46E5, #10B981)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.875rem',
    px: '1.5rem',
    py: '0.75rem',
    borderRadius: '0.5rem',
    textTransform: 'none' as const,
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  };
  const outlinedBtn = {
    background: '#F9FAFB',
    color: '#1F2937',
    fontWeight: 500,
    fontSize: '0.875rem',
    px: '1.5rem',
    py: '0.75rem',
    borderRadius: '0.5rem',
    textTransform: 'none' as const,
    border: '1px solid #E5E7EB',
    '&:hover': { background: '#F3F4F6', borderColor: '#4F46E5' },
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
    <Layout>

      {/* ═══════════════════════════════════════════════
          PROFILE HEADER CARD
      ═══════════════════════════════════════════════ */}
      <Box sx={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '0.75rem', p: '2rem', mb: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
        {/* Top row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '2rem', flexWrap: 'wrap', gap: 2 }}>

          {/* Avatar + details */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
            {/* Avatar */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Box sx={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid #FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3rem', fontWeight: 700 }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Box>
              {isOwnProfile && (
                <Box onClick={() => navigate('/profile/edit')} sx={{ position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: '50%', background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', fontSize: '0.75rem', transition: 'background 0.2s', '&:hover': { background: '#4338CA' } }}>
                  <i className="fas fa-camera" />
                </Box>
              )}
            </Box>

            {/* Name + badges + meta */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937', mb: '0.5rem', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
                {profile.name}
              </Typography>

              {/* Inline badges */}
              <Box sx={{ display: 'flex', gap: '0.5rem', mb: '1rem', flexWrap: 'wrap' }}>
                {profile.isVerified && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', px: '0.75rem', py: '0.375rem', borderRadius: '2rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', fontWeight: 500 }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '0.875rem' }} /> Verified User
                  </Box>
                )}
                {profile.exchangeCount >= 10 && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', px: '0.75rem', py: '0.375rem', borderRadius: '2rem', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', fontWeight: 500 }}>
                    <i className="fas fa-star" style={{ fontSize: '0.875rem' }} /> Active Member
                  </Box>
                )}
                {profile.skills.length >= 3 && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', px: '0.75rem', py: '0.375rem', borderRadius: '2rem', background: 'rgba(79,70,229,0.1)', color: '#4F46E5', border: '1px solid rgba(79,70,229,0.2)', fontSize: '0.75rem', fontWeight: 500 }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '0.875rem' }} /> Skill Expert
                  </Box>
                )}
              </Box>

              {/* Meta row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {hasLocation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    <i className="fas fa-map-marker-alt" style={{ color: '#4F46E5' }} />
                    <span>{[profile.location?.neighbourhood, profile.location?.city].filter(Boolean).join(', ')}</span>
                  </Box>
                )}
                {memberSince && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    <i className="fas fa-calendar-alt" style={{ color: '#4F46E5' }} />
                    <span>Member since {memberSince}</span>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                  <i className="fas fa-shield-alt" style={{ color: '#4F46E5' }} />
                  <span>Trust score: {profile.trustScore}%</span>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isOwnProfile ? (
              <>
                <Button onClick={() => navigate('/profile/edit')} sx={gradientBtn}>
                  <i className="fas fa-edit" style={{ marginRight: '0.5rem' }} /> Edit Profile
                </Button>
                <Button sx={outlinedBtn}>
                  <i className="fas fa-share-alt" style={{ marginRight: '0.5rem' }} /> Share Profile
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/exchanges/create')} sx={gradientBtn}>
                  <i className="fas fa-exchange-alt" style={{ marginRight: '0.5rem' }} /> Request Exchange
                </Button>
                <Button sx={outlinedBtn}>
                  <i className="fas fa-comment-alt" style={{ marginRight: '0.5rem' }} /> Message
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Stat cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', '@media (max-width: 768px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, '@media (max-width: 480px)': { gridTemplateColumns: '1fr' } }}>
          <StatCard value="0 CEU" label="CEU Balance" />
          <StatCard value={profile.exchangeCount ?? 0} label="Completed Exchanges" />
          <StatCard value={profile.skills.length} label="Skills Offered" />
          <StatCard value={toolPosts.length} label="Tools Available" />
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════
          BIO & INTRODUCTION
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-user-circle"
        title="Bio & Introduction"
        action={isOwnProfile ? <SectionIconBtn icon="fa-edit" onClick={() => navigate('/profile/edit')} /> : undefined}
      >
        {/* Bio text */}
        {profile.bio ? (
          <Typography sx={{ lineHeight: 1.8, color: '#1F2937' }}>{profile.bio}</Typography>
        ) : (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            No bio yet.{isOwnProfile ? ' Add one from your Edit Profile page.' : ''}
          </Typography>
        )}

        {/* ── Video Introduction ── */}
        {(savedVideoUrl || profile.videoIntro) ? (
          /* Completed video — shown directly under bio */
          <Box sx={{ mt: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#000', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {/* Label bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '1rem', py: '0.625rem', background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(16,185,129,0.06))', borderBottom: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4F46E5,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-video" style={{ color: '#fff', fontSize: '0.75rem' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F2937', lineHeight: 1.2 }}>Video Introduction</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#6B7280' }}>Identity verified · recorded by {profile.name.split(' ')[0]}</Typography>
                </Box>
              </Box>
              {isOwnProfile && (
                <Button onClick={() => setVideoModalOpen(true)} size="small"
                  sx={{ color: '#6B7280', textTransform: 'none', fontSize: '0.75rem', borderRadius: '0.375rem', px: '0.625rem', py: '0.25rem', border: '1px solid #E5E7EB', '&:hover': { color: '#4F46E5', borderColor: '#4F46E5', background: '#F5F3FF' } }}>
                  <i className="fas fa-redo" style={{ marginRight: '0.3rem', fontSize: '0.6875rem' }} /> Re-record
                </Button>
              )}
            </Box>
            {/* Video player */}
            <video
              src={savedVideoUrl ?? profile.videoIntro}
              controls
              playsInline
              style={{ width: '100%', maxHeight: 340, display: 'block', objectFit: 'cover' }}
            />
          </Box>
        ) : isOwnProfile ? (
          /* No video yet — compact prompt for own profile */
          <Box
            onClick={() => setVideoModalOpen(true)}
            sx={{ mt: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', p: '0.875rem 1rem', background: 'linear-gradient(135deg, rgba(79,70,229,0.04), rgba(16,185,129,0.04))', border: '1.5px dashed #C7D2FE', borderRadius: '0.625rem', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(16,185,129,0.08))' } }}
          >
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(16,185,129,0.12))', border: '1.5px dashed #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fas fa-video" style={{ color: '#4F46E5', fontSize: '1.125rem' }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F2937' }}>Add a Video Introduction</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>Record a short intro — share your name, skills, and what you're looking for</Typography>
            </Box>
            <Box sx={{ ml: 'auto', flexShrink: 0 }}>
              <i className="fas fa-chevron-right" style={{ color: '#9CA3AF', fontSize: '0.875rem' }} />
            </Box>
          </Box>
        ) : null}
      </Section>

      {/* ═══════════════════════════════════════════════
          SKILLS OFFERED
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-chalkboard-teacher"
        title="Skills Offered"
        action={isOwnProfile ? (
          <>
            <SectionIconBtn icon="fa-plus" onClick={() => navigate('/create?type=skill')} />
            <SectionIconBtn icon="fa-edit" onClick={() => navigate('/profile/edit')} />
          </>
        ) : undefined}
      >
        {profile.skills.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            No skills listed yet.{isOwnProfile ? ' Add skills from your Edit Profile page.' : ''}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {profile.skills.map((skill) => {
              const skillTypeIcon: Record<string, string> = { Teaching: 'fa-chalkboard-teacher', Exchange: 'fa-exchange-alt', Both: 'fa-hands-helping', Other: 'fa-star' };
              const icon = skillTypeIcon[skill.type] || 'fa-chalkboard-teacher';
              return (
                <Box key={skill.name} sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1.25rem', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', transform: 'translateY(-2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '1rem' }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{skill.name}</Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', px: '0.5rem', py: '0.25rem', background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', fontSize: '0.75rem', fontWeight: 500, borderRadius: '0.375rem', flexShrink: 0, ml: '0.5rem', whiteSpace: 'nowrap' }}>
                      <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} /> {skill.type || 'Teaching'}
                    </Box>
                  </Box>
                  {/* Description */}
                  {skill.description && (
                    <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {skill.description}
                    </Typography>
                  )}
                  {/* Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', mt: '1rem' }}>
                    {skill.rate && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>CEU Rate:</Typography>
                        <Typography component="span" sx={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.875rem' }}>{skill.rate}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Proficiency:</Typography>
                      <Typography component="span" sx={{ color: '#1F2937', fontWeight: 500, fontSize: '0.875rem' }}>{skill.proficiency || 'Intermediate'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Availability:</Typography>
                      <Typography component="span" sx={{ color: '#1F2937', fontWeight: 500, fontSize: '0.875rem' }}>{skill.availability || 'Flexible'}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          SKILLS I WANT TO LEARN
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-lightbulb"
        title="Skills I Want to Learn"
        action={isOwnProfile ? <SectionIconBtn icon="fa-edit" onClick={() => navigate('/profile/edit')} /> : undefined}
      >
        {profile.interests.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            Nothing listed yet.{isOwnProfile ? ' Add interests from your Edit Profile page.' : ''}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {profile.interests.map((interest, idx) => {
              const catIcon: Record<string, string> = { Music: 'fa-music', Gardening: 'fa-seedling', Cooking: 'fa-utensils', Art: 'fa-paint-brush', Technology: 'fa-laptop-code', Fitness: 'fa-dumbbell', Languages: 'fa-language', Photography: 'fa-camera', Crafts: 'fa-cut', Sports: 'fa-running', Other: 'fa-lightbulb' };
              const icon = catIcon[interest.category] || 'fa-lightbulb';
              const label = interest.category || 'Other';
              return (
                <Box key={idx} sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1.25rem', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', transform: 'translateY(-2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '1rem' }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{interest.name}</Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', px: '0.5rem', py: '0.25rem', background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', fontSize: '0.75rem', fontWeight: 500, borderRadius: '0.375rem', flexShrink: 0, ml: '0.5rem', whiteSpace: 'nowrap' }}>
                      <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} /> {label}
                    </Box>
                  </Box>
                  {/* Description */}
                  {interest.description && (
                    <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {interest.description}
                    </Typography>
                  )}
                  {/* Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', mt: '1rem' }}>
                    {interest.willingToPay && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Willing to pay:</Typography>
                        <Typography component="span" sx={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.875rem' }}>{interest.willingToPay}</Typography>
                      </Box>
                    )}
                    {interest.level && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Level:</Typography>
                        <Typography component="span" sx={{ color: '#1F2937', fontWeight: 500, fontSize: '0.875rem' }}>{interest.level}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          TOOLS AVAILABLE
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-tools"
        title="Tools Available"
        action={isOwnProfile ? (
          <>
            <SectionIconBtn icon="fa-plus" onClick={() => navigate('/create?type=tool')} />
            <SectionIconBtn icon="fa-edit" onClick={() => navigate('/create')} />
          </>
        ) : undefined}
      >
        {toolPosts.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            No tools listed yet.{isOwnProfile ? ' List a tool from the Create Post page.' : ''}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {toolPosts.map((tool, idx) => (
              <Box key={tool._id} onClick={() => navigate(`/posts/${tool._id}`)} sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', transform: 'translateY(-2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } }}>
                <Box sx={{ height: 140, background: TOOL_GRADIENTS[idx % TOOL_GRADIENTS.length], position: 'relative' }}>
                  {tool.images?.[0] ? (
                    <img src={tool.images[0]} alt={tool.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-tools" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.6)' }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', top: '0.75rem', right: '0.75rem', px: '0.5rem', py: '0.25rem', background: 'rgba(255,255,255,0.9)', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500, color: '#10B981' }}>
                    Available
                  </Box>
                </Box>
                <Box sx={{ p: '1.25rem' }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', mb: '0.5rem' }}>{tool.title}</Typography>
                  {tool.content && (
                    <Typography sx={{ fontSize: '0.875rem', color: '#6B7280', mb: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {tool.content}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography component="span" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Listed:</Typography>
                    <Typography component="span" sx={{ color: '#1F2937', fontWeight: 500, fontSize: '0.875rem' }}>
                      {formatDistanceToNow(new Date(tool.createdAt as unknown as string), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          CEU BALANCE & HISTORY
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-coins"
        title="CEU Balance & History"
        action={
          <>
            <SectionIconBtn icon="fa-exchange-alt" />
            <SectionIconBtn icon="fa-history" />
          </>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: '1.5rem' }}>
          {/* Balance card */}
          <Box sx={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', borderRadius: '0.75rem', p: '2rem', color: '#fff', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.875rem', opacity: 0.9, mb: '0.5rem' }}>Current Balance</Typography>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, mb: '1.5rem', fontFamily: 'Poppins, sans-serif' }}>0 CEU</Typography>
            <Box sx={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Button size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', textTransform: 'none', fontSize: '0.8125rem', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}>
                <i className="fas fa-arrow-down" style={{ marginRight: '0.375rem' }} /> Add CEU
              </Button>
              <Button size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', textTransform: 'none', fontSize: '0.8125rem', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}>
                <i className="fas fa-gift" style={{ marginRight: '0.375rem' }} /> Send Gift
              </Button>
            </Box>
          </Box>

          {/* Transaction history */}
          <Box sx={{ background: '#F9FAFB', borderRadius: '0.5rem', p: '1.5rem' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', mb: '1rem' }}>Recent Transactions</Typography>
            {ceuTransactions.length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
                No transactions yet — complete exchanges to earn CEU.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {ceuTransactions.map((tx) => (
                  <Box key={tx.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '0.75rem', borderBottom: '1px solid #E5E7EB', '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                        <i className={`fas ${tx.icon}`} style={{ fontSize: '0.875rem' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1F2937' }}>{tx.title}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>{tx.time}</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: tx.positive ? '#10B981' : '#EF4444', fontSize: '0.9375rem', flexShrink: 0 }}>
                      {tx.amount}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Section>

      {/* ═══════════════════════════════════════════════
          RANKING & BADGES
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-trophy"
        title="Ranking & Badges"
        action={<SectionIconBtn icon="fa-chart-line" />}
      >
        {/* Rankings grid — only show earned rankings */}
        {rankingCards.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem', mb: '2rem' }}>
            No rankings earned yet — complete exchanges, list skills and tools to earn ranks.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', mb: '2rem' }}>
            {rankingCards.map((card) => (
              <RankingCard key={card.title} icon={card.icon} title={card.title} tier={card.tier} progress={card.progress} sub={card.sub} />
            ))}
          </Box>
        )}

        {/* Badges earned */}
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1rem' }}>
            <i className="fas fa-award" style={{ color: '#4F46E5' }} /> Badges Earned
          </Typography>
          {earnedBadges.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.875rem' }}>
              No badges yet — complete exchanges and build your profile to earn them!
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
              {earnedBadges.map((b) => (
                <BadgeCard key={b.name} icon={b.icon} name={b.name} desc={b.desc} />
              ))}
            </Box>
          )}
        </Box>
      </Section>

      {/* ═══════════════════════════════════════════════
          REVIEWS RECEIVED
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-star"
        title="Reviews Received"
        action={completedExchanges.length > 0 ? (
          <>
            <SectionIconBtn icon="fa-filter" />
            <SectionIconBtn icon="fa-sort" />
          </>
        ) : undefined}
      >
        {completedExchanges.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            No reviews yet — complete exchanges to receive feedback from your neighbours.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {completedExchanges.slice(0, 5).map((exchange) => {
              const other = (exchange.requester as unknown as User)?._id === profileId
                ? exchange.provider as unknown as User
                : exchange.requester as unknown as User;
              const otherName = (other as User)?.name ?? 'Neighbour';
              return (
                <Box key={exchange._id} sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1.25rem', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                        {otherName.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>{otherName}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>{exchange.title ?? 'Exchange'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: '0.125rem' }}>
                      {[1,2,3,4,5].map((s) => (
                        <i key={s} className="fas fa-star" style={{ color: '#FFD700', fontSize: '0.875rem' }} />
                      ))}
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.875rem', color: '#1F2937', lineHeight: 1.6 }}>
                    Exchange completed successfully.
                  </Typography>
                  {exchange.updatedAt && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF', mt: '0.75rem' }}>
                      {formatDistanceToNow(new Date(exchange.updatedAt as unknown as string), { addSuffix: true })}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════
          RECENT ACTIVITY (TIMELINE)
      ═══════════════════════════════════════════════ */}
      <Section
        icon="fa-history"
        title="Recent Activity"
        action={<SectionIconBtn icon="fa-expand" />}
      >
        {activityItems.length === 0 ? (
          <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.9375rem' }}>
            No activity yet — start exchanging skills and posting to see your activity here.
          </Typography>
        ) : (
          <Box sx={{ position: 'relative', pl: '2rem' }}>
            {/* Vertical line */}
            <Box sx={{ position: 'absolute', left: '0.75rem', top: 0, bottom: 0, width: '2px', background: '#E5E7EB' }} />

            {activityItems.map((item, idx) => (
              <Box key={item.id} sx={{ position: 'relative', mb: idx < activityItems.length - 1 ? '1.5rem' : 0 }}>
                {/* Dot */}
                <Box sx={{ position: 'absolute', left: '-1.75rem', top: '0.125rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #10B981)', border: '3px solid #fff', boxShadow: '0 0 0 2px #E5E7EB' }} />

                {/* Content card */}
                <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', p: '1rem', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '0.5rem' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className={`fas ${item.icon}`} style={{ color: '#4F46E5' }} />
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', flexShrink: 0, ml: 1 }}>
                      {formatDistanceToNow(item.date, { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Section>

    </Layout>

    {/* Video intro recording modal */}
    {isOwnProfile && (
      <VideoIntroModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        userName={profile.name}
        userSkills={profile.skills}
        userInterests={profile.interests}
        onSaved={(url) => {
          setSavedVideoUrl(url);
          queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
        }}
      />
    )}
    </>
  );
};

export default MyProfile;
