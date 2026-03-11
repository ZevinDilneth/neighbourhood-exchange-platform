import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Chip,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/layout/Layout';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

// ─── Types ───────────────────────────────────────────────────────────────────
interface SkillEntry {
  name: string;
  proficiency: string;
  availability: string;
  rate: string;
}

interface InterestEntry {
  name: string;
  description: string;
  level: string;
  willingToPay: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const AVAILABILITY_OPTIONS = ['Flexible', 'Weekdays', 'Weekends', 'Evenings', 'Mornings', 'Anytime', 'By Appointment'];
const INTEREST_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const SKILL_SUGGESTIONS = [
  'Cooking', 'Gardening', 'Photography', 'Coding', 'Music', 'Yoga',
  'Woodworking', 'Sewing', 'Drawing', 'Languages', 'Tutoring', 'Cycling',
  'Carpentry', 'Plumbing', 'Design', 'Writing', 'Baking', 'Painting',
];

const LEARN_SUGGESTIONS = [
  'DIY', 'Sustainability', 'Books', 'Film', 'Hiking', 'Board Games',
  'Community Events', 'Cooking', 'Fitness', 'Technology', 'Art', 'Travel',
  'Pottery', 'Meditation', 'Guitar', 'Spanish', 'Swimming', 'Knitting',
];

// ─── Validators ──────────────────────────────────────────────────────────────
const LETTERS_SPACES = /^[a-zA-Z\u00C0-\u024F\s\-'\.]+$/;
const ALPHANUMERIC   = /^[a-zA-Z0-9\s\-]+$/;

const locationValidators: Record<string, (v: string) => string> = {
  city:          (v) => (!v ? '' : !LETTERS_SPACES.test(v) ? 'Letters only' : v.length > 100 ? 'Max 100 chars' : ''),
  neighbourhood: (v) => (!v ? '' : !LETTERS_SPACES.test(v) ? 'Letters only' : v.length > 100 ? 'Max 100 chars' : ''),
  postcode:      (v) => (!v ? '' : v.trim().length > 20 ? 'Max 20 chars' : !ALPHANUMERIC.test(v.trim()) ? 'Letters & numbers only' : ''),
  country:       (v) => (!v ? '' : !LETTERS_SPACES.test(v) ? 'Letters only' : v.length > 100 ? 'Max 100 chars' : ''),
  address:       (v) => (!v ? '' : v.length > 200 ? 'Max 200 chars' : ''),
};

const MAPBOX_TYPES: Record<string, string> = {
  city: 'place', country: 'country', postcode: 'postcode', neighbourhood: 'neighborhood',
};

// ─── Design tokens ───────────────────────────────────────────────────────────
const GRAD = 'linear-gradient(135deg, #4F46E5, #10B981)';

// ─── Section card ────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ icon: string; title: string; subtitle?: string; children: React.ReactNode }> = ({
  icon, title, subtitle, children,
}) => (
  <Box sx={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden', mb: '1.25rem' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', p: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
      <Box sx={{ width: 38, height: 38, borderRadius: '0.5rem', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fas ${icon}`} style={{ color: '#fff', fontSize: '1rem' }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: '0.9375rem', color: '#1F2937' }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mt: '0.125rem' }}>{subtitle}</Typography>}
      </Box>
    </Box>
    <Box sx={{ p: '1.5rem' }}>{children}</Box>
  </Box>
);

// ─── Skill card (editable) ───────────────────────────────────────────────────
const SkillCard: React.FC<{
  skill: SkillEntry;
  index: number;
  badge?: { label: string; color: string; bg: string };
  onRemove: () => void;
  onChange: (updated: SkillEntry) => void;
}> = ({ skill, badge, onRemove, onChange }) => (
  <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.625rem', p: '1rem', position: 'relative', '&:hover': { borderColor: '#C7D2FE' } }}>
    {/* Remove button */}
    <IconButton
      size="small"
      onClick={onRemove}
      sx={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#9CA3AF', '&:hover': { color: '#EF4444', background: '#FEF2F2' } }}
    >
      <i className="fas fa-times" style={{ fontSize: '0.75rem' }} />
    </IconButton>

    {/* Name row */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.875rem', pr: '1.75rem' }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1F2937', flex: 1 }}>{skill.name}</Typography>
      {badge && (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', px: '0.5rem', py: '0.2rem', background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30`, fontSize: '0.6875rem', fontWeight: 600, borderRadius: '0.375rem', flexShrink: 0 }}>
          {badge.label}
        </Box>
      )}
    </Box>

    {/* CEU Rate */}
    <TextField
      size="small" fullWidth label="CEU Rate" placeholder="e.g. 25/hr or Free"
      value={skill.rate || ''}
      onChange={(e) => onChange({ ...skill, rate: e.target.value })}
      sx={{ mb: '0.625rem', '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.8125rem' } }}
      InputLabelProps={{ sx: { fontSize: '0.8125rem' } }}
    />

    {/* Proficiency + Availability */}
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
      <FormControl size="small" fullWidth>
        <InputLabel sx={{ fontSize: '0.8125rem' }}>Proficiency</InputLabel>
        <Select
          label="Proficiency"
          value={skill.proficiency || 'Intermediate'}
          onChange={(e) => onChange({ ...skill, proficiency: e.target.value })}
          sx={{ borderRadius: '0.5rem', fontSize: '0.8125rem' }}
        >
          {PROFICIENCY_LEVELS.map((l) => (
            <MenuItem key={l} value={l} sx={{ fontSize: '0.8125rem' }}>{l}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel sx={{ fontSize: '0.8125rem' }}>Availability</InputLabel>
        <Select
          label="Availability"
          value={skill.availability || 'Flexible'}
          onChange={(e) => onChange({ ...skill, availability: e.target.value })}
          sx={{ borderRadius: '0.5rem', fontSize: '0.8125rem' }}
        >
          {AVAILABILITY_OPTIONS.map((a) => (
            <MenuItem key={a} value={a} sx={{ fontSize: '0.8125rem' }}>{a}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  </Box>
);

// ─── Add skill input + quick-add ─────────────────────────────────────────────
const AddSkillInput: React.FC<{
  placeholder: string;
  suggestions: string[];
  existing: string[];
  onAdd: (name: string) => void;
}> = ({ placeholder, suggestions, existing, onAdd }) => {
  const [input, setInput] = useState('');

  const handleAdd = (val: string) => {
    const t = val.trim();
    if (!t || existing.includes(t.toLowerCase())) return;
    onAdd(t);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAdd(input); }
  };

  const unused = suggestions.filter((s) => !existing.includes(s.toLowerCase())).slice(0, 8);

  return (
    <Box>
      <TextField
        fullWidth size="small"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) handleAdd(input); }}
        InputProps={{
          endAdornment: input.trim() ? (
            <InputAdornment position="end">
              <Button size="small" onClick={() => handleAdd(input)}
                sx={{ minWidth: 'unset', color: '#4F46E5', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', px: '0.5rem' }}>
                Add
              </Button>
            </InputAdornment>
          ) : undefined,
        }}
        helperText="Type a skill name and press Enter"
        sx={{ mb: '0.875rem', '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
      />
      {unused.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF', mr: '0.25rem' }}>Quick add:</Typography>
          {unused.map((s) => (
            <Chip key={s} label={s} size="small" variant="outlined" onClick={() => handleAdd(s)}
              sx={{ fontSize: '0.6875rem', height: 22, cursor: 'pointer', borderColor: '#D1D5DB', color: '#6B7280',
                    '&:hover': { bgcolor: '#EEF2FF', borderColor: '#4F46E5', color: '#4F46E5' } }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

// ─── Interest tag input ───────────────────────────────────────────────────────
// ─── Interest card (editable) ────────────────────────────────────────────────
const InterestCard: React.FC<{
  entry: InterestEntry;
  onChange: (updated: InterestEntry) => void;
  onRemove: () => void;
}> = ({ entry, onChange, onRemove }) => (
  <Box sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.625rem', p: '1rem', position: 'relative', mb: '0.875rem', '&:hover': { borderColor: '#C7D2FE' } }}>
    {/* Remove button */}
    <IconButton size="small" onClick={onRemove}
      sx={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#9CA3AF', '&:hover': { color: '#EF4444', background: '#FEF2F2' } }}>
      <i className="fas fa-times" style={{ fontSize: '0.75rem' }} />
    </IconButton>

    {/* Name + badge */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.875rem', pr: '1.75rem' }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1F2937', flex: 1 }}>{entry.name}</Typography>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', px: '0.5rem', py: '0.2rem', background: GRAD, color: '#fff', fontSize: '0.6875rem', fontWeight: 500, borderRadius: '0.375rem', flexShrink: 0 }}>
        <i className="fas fa-lightbulb" style={{ fontSize: '0.6rem' }} /> Wanted
      </Box>
    </Box>

    {/* Description */}
    <TextField fullWidth size="small" label="What do you want to learn?" placeholder="e.g. Basic chords and strumming patterns"
      value={entry.description}
      onChange={(e) => onChange({ ...entry, description: e.target.value })}
      sx={{ mb: '0.625rem', '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.8125rem' } }}
      InputLabelProps={{ sx: { fontSize: '0.8125rem' } }}
    />

    {/* Level + Willing to pay */}
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
      <FormControl size="small" fullWidth>
        <InputLabel sx={{ fontSize: '0.8125rem' }}>Your Level</InputLabel>
        <Select label="Your Level" value={entry.level || 'Beginner'}
          onChange={(e) => onChange({ ...entry, level: e.target.value })}
          sx={{ borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
          {INTEREST_LEVELS.map((l) => <MenuItem key={l} value={l} sx={{ fontSize: '0.8125rem' }}>{l}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField size="small" fullWidth label="Willing to pay" placeholder="e.g. 20/hr or Free swap"
        value={entry.willingToPay}
        onChange={(e) => onChange({ ...entry, willingToPay: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.8125rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.8125rem' } }}
      />
    </Box>
  </Box>
);

// ─── Add interest input ───────────────────────────────────────────────────────
const AddInterestInput: React.FC<{
  existing: string[];
  onAdd: (name: string) => void;
}> = ({ existing, onAdd }) => {
  const [input, setInput] = useState('');

  const submit = (val: string) => {
    const t = val.trim();
    if (!t || existing.includes(t.toLowerCase())) return;
    onAdd(t);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(input); }
  };

  const unused = LEARN_SUGGESTIONS.filter((s) => !existing.includes(s.toLowerCase())).slice(0, 8);

  return (
    <Box>
      <TextField fullWidth size="small" placeholder="e.g. Guitar, Knitting, Pottery…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: <InputAdornment position="start"><i className="fas fa-lightbulb" style={{ color: '#10B981', fontSize: '0.8rem' }} /></InputAdornment>,
          endAdornment: input.trim() ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => submit(input)}>
                <i className="fas fa-plus" style={{ fontSize: '0.75rem', color: '#10B981' }} />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
        helperText="Press Enter to add — then fill in details below"
        sx={{ mb: unused.length ? '0.75rem' : 0, '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', '&.Mui-focused fieldset': { borderColor: '#10B981' } } }}
      />
      {unused.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.6875rem', color: '#9CA3AF', mr: '0.25rem' }}>Quick add:</Typography>
          {unused.map((s) => (
            <Chip key={s} label={s} size="small" variant="outlined" onClick={() => submit(s)}
              sx={{ fontSize: '0.6875rem', height: 22, cursor: 'pointer', borderColor: '#D1D5DB', color: '#6B7280',
                    '&:hover': { bgcolor: '#D1FAE5', borderColor: '#10B981', color: '#10B981' } }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

// ─── Two-column grid ─────────────────────────────────────────────────────────
const FieldRow: React.FC<{ children: React.ReactNode; cols?: 1 | 2 }> = ({ children, cols = 1 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: cols === 2 ? '1fr 1fr' : '1fr', gap: '1rem', mb: '1rem' }}>
    {children}
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────
const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);

  // Fields
  const [name, setName]           = useState('');
  const [bio, setBio]             = useState('');
  const [skills, setSkills]       = useState<SkillEntry[]>([]);
  const [interests, setInterests] = useState<InterestEntry[]>([]);

  const [location, setLocation] = useState({
    address: '', neighbourhood: '', city: '', postcode: '', country: '',
  });

  // UI
  const [nameError, setNameError]   = useState('');
  const [locErrors, setLocErrors]   = useState<Record<string, string>>({});
  const [locLoading, setLocLoading] = useState<Record<string, boolean>>({});
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [saved, setSaved]           = useState(false);

  // Pre-fill
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setBio(user.bio ?? '');
    // Handle legacy string[] skills or new object[] skills
    const rawSkills = (user.skills ?? []) as unknown[];
    setSkills(rawSkills.map((s) =>
      typeof s === 'string'
        ? { name: s as string, proficiency: 'Intermediate', availability: 'Flexible', rate: '' }
        : (s as SkillEntry).rate !== undefined ? (s as SkillEntry) : { ...(s as SkillEntry), rate: '' }
    ));
    // Handle legacy string[] interests or new object[] interests
    const rawInterests = (user.interests ?? []) as unknown[];
    setInterests(rawInterests.map((i) =>
      typeof i === 'string'
        ? { name: i as string, description: '', level: 'Beginner', willingToPay: '' }
        : i as InterestEntry
    ));
    setLocation({
      address:       user.location?.address       ?? '',
      neighbourhood: user.location?.neighbourhood ?? '',
      city:          user.location?.city          ?? '',
      postcode:      user.location?.postcode      ?? '',
      country:       user.location?.country       ?? '',
    });
  }, [user]);

  // Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Location helpers
  const setLocField = (field: string, value: string) => {
    setLocation((prev) => ({ ...prev, [field]: value }));
    if (locErrors[field]) setLocErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateLocField = async (field: string, value: string) => {
    const fmtErr = locationValidators[field]?.(value) ?? '';
    if (fmtErr) { setLocErrors((prev) => ({ ...prev, [field]: fmtErr })); return; }
    const mbType = MAPBOX_TYPES[field];
    if (mbType && value.trim() && MAPBOX_TOKEN) {
      setLocLoading((prev) => ({ ...prev, [field]: true }));
      try {
        const res  = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value.trim())}.json?types=${mbType}&access_token=${MAPBOX_TOKEN}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          setLocErrors((prev) => ({ ...prev, [field]: data.features?.length === 0 ? `"${value.trim()}" doesn't look like a valid ${field}` : '' }));
        }
      } catch { /* fail silently */ }
      finally { setLocLoading((prev) => ({ ...prev, [field]: false })); }
    } else {
      setLocErrors((prev) => ({ ...prev, [field]: fmtErr }));
    }
  };

  // Geolocation
  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported.'); return; }
    setGeoLoading(true); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address&language=en`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (data.features?.length) {
            const f    = data.features[0];
            const ctx: Array<{ id: string; text: string }> = f.context ?? [];
            const get  = (p: string) => ctx.find((c) => c.id.startsWith(p))?.text ?? '';
            setLocation({ address: [f.address, f.text].filter(Boolean).join(' '), neighbourhood: get('neighborhood') || get('locality'), postcode: get('postcode'), city: get('place') || get('district'), country: get('country') });
            setLocErrors({});
          }
        } catch { setGeoError('Could not look up your address. Enter manually.'); }
        finally { setGeoLoading(false); }
      },
      () => { setGeoLoading(false); setGeoError('Location denied. Enter manually.'); },
      { timeout: 10000 }
    );
  };

  // Skill helpers
  const addSkill = (name: string) => {
    if (skills.find((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, proficiency: 'Intermediate', availability: 'Flexible', rate: '' }]);
  };

  const removeSkill = (index: number) => setSkills((prev) => prev.filter((_, i) => i !== index));

  const updateSkill = (index: number, updated: SkillEntry) =>
    setSkills((prev) => prev.map((s, i) => (i === index ? updated : s)));

  // Save
  const handleSave = async () => {
    setSaveError(''); setSaved(false);
    if (!name.trim()) { setNameError('Name is required'); return; }
    if (name.trim().length > 100) { setNameError('Name must be 100 characters or fewer'); return; }
    setNameError('');
    if (Object.values(locErrors).some(Boolean)) { setSaveError('Fix location errors before saving.'); return; }
    if (Object.values(locLoading).some(Boolean)) { setSaveError('Still verifying location — please wait.'); return; }

    setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const { data } = await api.put<{ avatar: string }>('/users/me/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser({ avatar: data.avatar });
      }

      const { data: updated } = await api.put('/users/me', {
        name: name.trim(),
        bio:  bio.trim(),
        skills,
        interests,
        location: {
          type: 'Point',
          coordinates: user?.location?.coordinates ?? [0, 0],
          address:       location.address.trim(),
          neighbourhood: location.neighbourhood.trim(),
          city:          location.city.trim(),
          postcode:      location.postcode.trim(),
          country:       location.country.trim(),
        },
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => navigate('/profile/me'), 900);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg || 'Failed to save — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const displayAvatar = avatarPreview ?? user.avatar;
  const wordCount     = bio.trim() === '' ? 0 : bio.trim().split(/\s+/).length;
  const atLimit       = wordCount >= 100;

  return (
    <Layout>
      <Box sx={{ maxWidth: 760, mx: 'auto', py: '1.5rem', px: { xs: '1rem', sm: '1.5rem' } }}>

        {/* ── Gradient header ───────────────────────────────────────────── */}
        <Box sx={{ background: GRAD, borderRadius: '0.875rem', p: '1.5rem 1.75rem', mb: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 20px rgba(79,70,229,0.25)' }}>
          <IconButton onClick={() => navigate('/profile/me')} sx={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem', p: '0.5rem', '&:hover': { background: 'rgba(255,255,255,0.25)' } }}>
            <i className="fas fa-arrow-left" style={{ fontSize: '0.875rem' }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.375rem', color: '#fff' }}>Edit Profile</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', mt: '0.125rem' }}>Your public profile — visible to your neighbours</Typography>
          </Box>
          <Button onClick={handleSave} disabled={saving}
            sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: '0.5rem', px: '1.25rem', py: '0.5rem', border: '1px solid rgba(255,255,255,0.35)', '&:hover': { background: 'rgba(255,255,255,0.3)' }, '&:disabled': { color: 'rgba(255,255,255,0.6)' } }}>
            {saving ? <><CircularProgress size={13} sx={{ mr: '0.375rem', color: 'inherit' }} />Saving…</> : <><i className="fas fa-check" style={{ marginRight: '0.375rem', fontSize: '0.75rem' }} />Save</>}
          </Button>
        </Box>

        {/* ── Feedback ──────────────────────────────────────────────────── */}
        {saveError && <Alert severity="error"   sx={{ mb: '1rem', borderRadius: '0.625rem' }}>{saveError}</Alert>}
        {saved     && <Alert severity="success" sx={{ mb: '1rem', borderRadius: '0.625rem' }}>Profile saved! Redirecting…</Alert>}

        {/* ═══════════════════════════════════════════════════════════════
            1 — Avatar + Basic Info
        ═══════════════════════════════════════════════════════════════ */}
        <SectionCard icon="fa-user" title="Basic Information" subtitle="Your name and bio appear on your public profile">

          {/* Avatar row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5rem', mb: '1.5rem', pb: '1.5rem', borderBottom: '1px solid #F3F4F6' }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar src={displayAvatar} sx={{ width: 88, height: 88, fontSize: '2rem', border: '3px solid #E5E7EB', background: !displayAvatar ? GRAD : undefined }}>
                {!displayAvatar && user.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box onClick={() => fileInputRef.current?.click()}
                sx={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                <i className="fas fa-camera" style={{ color: '#fff', fontSize: '1.25rem' }} />
              </Box>
              <Box onClick={() => fileInputRef.current?.click()}
                sx={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                <i className="fas fa-camera" style={{ color: '#fff', fontSize: '0.6875rem' }} />
              </Box>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1F2937', mb: '0.25rem' }}>Profile Photo</Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#6B7280', mb: '0.5rem' }}>JPEG, PNG, WebP or GIF · max 5 MB</Typography>
              <Button size="small" onClick={() => fileInputRef.current?.click()}
                sx={{ border: '1px solid #E5E7EB', color: '#374151', fontSize: '0.8125rem', textTransform: 'none', borderRadius: '0.5rem', px: '0.875rem', py: '0.3125rem', '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', background: '#F5F3FF' } }}>
                <i className="fas fa-upload" style={{ marginRight: '0.375rem', fontSize: '0.75rem' }} />
                {avatarPreview ? 'Change photo' : 'Upload photo'}
              </Button>
            </Box>
          </Box>

          {/* Name */}
          <TextField
            fullWidth required label="Full name" value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
            onBlur={() => {
              if (!name.trim()) setNameError('Name is required');
              else if (name.trim().length > 100) setNameError('Name must be 100 characters or fewer');
              else setNameError('');
            }}
            error={!!nameError} helperText={nameError}
            inputProps={{ maxLength: 100 }}
            sx={{ mb: '1.25rem', '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
          />

          {/* Bio */}
          <TextField
            fullWidth multiline rows={3} label="Bio"
            placeholder="Tell your neighbours a little about yourself…"
            value={bio}
            onChange={(e) => {
              const val = e.target.value;
              if ((val.trim() === '' ? 0 : val.trim().split(/\s+/).length) <= 100) setBio(val);
            }}
            error={atLimit}
            helperText={
              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{atLimit ? '100 word limit reached' : 'Up to 100 words'}</span>
                <span style={{ color: atLimit ? '#EF4444' : '#9CA3AF' }}>{wordCount}/100 words</span>
              </Box>
            }
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
          />
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════════
            2 — Skills I Offer
        ═══════════════════════════════════════════════════════════════ */}
        <SectionCard icon="fa-chalkboard-teacher" title="Skills I Offer" subtitle="Set your proficiency and availability for each skill">

          {/* Existing skill cards */}
          {skills.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem', mb: '1.25rem' }}>
              {skills.map((skill, idx) => (
                <SkillCard
                  key={`${skill.name}-${idx}`}
                  skill={skill}
                  index={idx}
                  badge={{ label: 'Skill', color: '#4F46E5', bg: 'linear-gradient(135deg,#4F46E5,#10B981)' }}
                  onRemove={() => removeSkill(idx)}
                  onChange={(updated) => updateSkill(idx, updated)}
                />
              ))}
            </Box>
          )}

          <AddSkillInput
            placeholder="e.g. Cooking, Photography, Carpentry…"
            suggestions={SKILL_SUGGESTIONS}
            existing={skills.map((s) => s.name.toLowerCase())}
            onAdd={addSkill}
          />

          {skills.length === 0 && (
            <Box sx={{ mt: '1rem', p: '0.875rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px dashed #E5E7EB', textAlign: 'center' }}>
              <i className="fas fa-star" style={{ color: '#D1D5DB', fontSize: '1.25rem', display: 'block', marginBottom: '0.375rem' }} />
              <Typography sx={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Add skills to let neighbours know how you can help</Typography>
            </Box>
          )}
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════════
            3 — Skills I Want to Learn
        ═══════════════════════════════════════════════════════════════ */}
        <SectionCard icon="fa-graduation-cap" title="Skills I'm Looking to Learn" subtitle="What would you love to learn from your neighbours?">
          {interests.map((entry, idx) => (
            <InterestCard
              key={idx}
              entry={entry}
              onChange={(updated) => setInterests((prev) => prev.map((e, i) => i === idx ? updated : e))}
              onRemove={() => setInterests((prev) => prev.filter((_, i) => i !== idx))}
            />
          ))}

          <AddInterestInput
            existing={interests.map((e) => e.name.toLowerCase())}
            onAdd={(name) => setInterests((prev) => [...prev, { name, description: '', level: 'Beginner', willingToPay: '' }])}
          />

          {interests.length === 0 && (
            <Box sx={{ mt: '1rem', p: '0.875rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px dashed #E5E7EB', textAlign: 'center' }}>
              <i className="fas fa-search" style={{ color: '#D1D5DB', fontSize: '1.25rem', display: 'block', marginBottom: '0.375rem' }} />
              <Typography sx={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Add what you'd like to learn — neighbours may be able to help</Typography>
            </Box>
          )}
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════════
            4 — Location
        ═══════════════════════════════════════════════════════════════ */}
        <SectionCard icon="fa-map-marker-alt" title="Location" subtitle="Helps connect you with nearby neighbours — all optional">
          <Button fullWidth variant="outlined" onClick={handleGeolocate} disabled={geoLoading}
            sx={{ mb: geoError ? '0.875rem' : '1.25rem', py: '0.625rem', borderRadius: '0.5rem', borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 500, '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', background: '#F5F3FF' } }}>
            {geoLoading
              ? <><CircularProgress size={14} sx={{ mr: '0.5rem', color: '#6B7280' }} />Detecting location…</>
              : <><i className="fas fa-location-arrow" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />Use my current location</>}
          </Button>

          {geoError && <Alert severity="warning" sx={{ mb: '1.25rem', borderRadius: '0.5rem' }}>{geoError}</Alert>}

          <FieldRow>
            <TextField fullWidth label="Street address" placeholder="e.g. 42 Baker Street"
              value={location.address}
              onChange={(e) => setLocField('address', e.target.value)}
              onBlur={() => validateLocField('address', location.address)}
              error={!!locErrors.address} helperText={locErrors.address}
              InputProps={{ startAdornment: <InputAdornment position="start"><i className="fas fa-home" style={{ color: '#9CA3AF', fontSize: '0.875rem' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <TextField fullWidth label="Neighbourhood / Area" placeholder="e.g. Shoreditch"
              value={location.neighbourhood}
              onChange={(e) => setLocField('neighbourhood', e.target.value)}
              onBlur={() => validateLocField('neighbourhood', location.neighbourhood)}
              error={!locLoading.neighbourhood && !!locErrors.neighbourhood}
              helperText={locLoading.neighbourhood ? '⏳ Checking…' : locErrors.neighbourhood}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
            <TextField fullWidth label="City / Town" placeholder="e.g. London"
              value={location.city}
              onChange={(e) => setLocField('city', e.target.value)}
              onBlur={() => validateLocField('city', location.city)}
              error={!locLoading.city && !!locErrors.city}
              helperText={locLoading.city ? '⏳ Checking…' : locErrors.city}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <TextField fullWidth label="Postcode / ZIP" placeholder="e.g. EC1A 1BB"
              value={location.postcode}
              onChange={(e) => setLocField('postcode', e.target.value.toUpperCase())}
              onBlur={() => validateLocField('postcode', location.postcode)}
              error={!locLoading.postcode && !!locErrors.postcode}
              helperText={locLoading.postcode ? '⏳ Checking…' : locErrors.postcode}
              sx={{ mb: 0, '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
            <TextField fullWidth label="Country" placeholder="e.g. United Kingdom"
              value={location.country}
              onChange={(e) => setLocField('country', e.target.value)}
              onBlur={() => validateLocField('country', location.country)}
              error={!locLoading.country && !!locErrors.country}
              helperText={locLoading.country ? '⏳ Checking…' : locErrors.country}
              sx={{ mb: 0, '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
          </FieldRow>
        </SectionCard>

        {/* ── Bottom action bar ──────────────────────────────────────────── */}
        <Box sx={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #E5E7EB', p: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.8125rem', color: '#9CA3AF', flex: 1 }}>
            {saving ? 'Saving your changes…' : saved ? '✓ Saved! Redirecting…' : 'All changes are visible to your community'}
          </Typography>
          <Button onClick={() => navigate('/profile/me')} disabled={saving}
            sx={{ border: '1px solid #E5E7EB', color: '#6B7280', textTransform: 'none', borderRadius: '0.5rem', px: '1.25rem', py: '0.5625rem', fontWeight: 500, '&:hover': { borderColor: '#9CA3AF' } }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            sx={{ background: GRAD, color: '#fff', fontWeight: 600, textTransform: 'none', borderRadius: '0.5rem', px: '1.75rem', py: '0.5625rem', boxShadow: '0 2px 12px rgba(79,70,229,0.3)', '&:hover': { opacity: 0.92 }, '&:disabled': { opacity: 0.6, color: '#fff' } }}>
            {saving
              ? <><CircularProgress size={14} sx={{ mr: '0.5rem', color: '#fff' }} />Saving…</>
              : <><i className="fas fa-save" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />Save Changes</>}
          </Button>
        </Box>

      </Box>
    </Layout>
  );
};

export default EditProfile;
