import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Link,
  Stepper,
  Step,
  StepLabel,
  Grid,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth, RegisterData } from '../context/AuthContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

const steps = ['Account Info', 'Your Location'];

interface FormState extends RegisterData {
  confirmPassword: string;
}

// ─── Field-level validators ─────────────────────────────────────────────────
const LETTERS_SPACES = /^[a-zA-Z\u00C0-\u024F\s\-'\.]+$/;
const ALPHANUMERIC    = /^[a-zA-Z0-9\s\-]+$/;

const validators: Record<string, (v: string, form?: FormState) => string> = {
  name: (v) => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (v.trim().length > 100) return 'Name must be 100 characters or fewer';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address (e.g. name@example.com)';
    return '';
  },
  password: (v) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    if (v.length > 128) return 'Password must be 128 characters or fewer';
    return '';
  },
  confirmPassword: (v, form?: FormState) => {
    if (!v) return 'Please re-enter your password to confirm';
    if (form && v !== form.password) return 'Passwords do not match — re-enter to confirm';
    return '';
  },
  city: (v) => {
    if (!v) return '';  // optional
    if (v.length > 100) return 'City must be 100 characters or fewer';
    if (!LETTERS_SPACES.test(v)) return 'City must contain letters only (no numbers or symbols)';
    return '';
  },
  neighbourhood: (v) => {
    if (!v) return '';  // optional
    if (v.length > 100) return 'Neighbourhood must be 100 characters or fewer';
    if (!LETTERS_SPACES.test(v)) return 'Neighbourhood must contain letters only (no numbers or symbols)';
    return '';
  },
  postcode: (v) => {
    if (!v) return '';  // optional
    const trimmed = v.trim();
    if (trimmed.length < 2) return 'Postcode must be at least 2 characters';
    if (trimmed.length > 20) return 'Postcode must be 20 characters or fewer';
    if (!ALPHANUMERIC.test(trimmed)) return 'Postcode must contain only letters, numbers, and spaces';
    return '';
  },
  country: (v) => {
    if (!v) return '';  // optional
    if (v.length < 2) return 'Country name must be at least 2 characters';
    if (v.length > 100) return 'Country must be 100 characters or fewer';
    if (!LETTERS_SPACES.test(v)) return 'Country must contain letters only (no numbers or symbols)';
    return '';
  },
  address: (v) => {
    if (!v) return '';  // optional
    if (v.length > 200) return 'Address must be 200 characters or fewer';
    return '';
  },
};

// Mapbox geocoding types used to validate each location field
const LOCATION_MAPBOX_TYPES: Partial<Record<string, string>> = {
  city:          'place',
  country:       'country',
  postcode:      'postcode',
  neighbourhood: 'neighborhood',
};

// ──────────────────────────────────────────────────────────────────────────────

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, cookies: false });
  const [agreementError, setAgreementError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [locationLoading, setLocationLoading] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    neighbourhood: '',
    city: '',
    postcode: '',
    country: '',
  });

  // Per-field error messages shown inline
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const setFieldError = (field: keyof FormState, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    // Clear error while typing (re-validate on blur)
    if (fieldErrors[field]) setFieldError(field, '');
  };

  // ─── Mapbox place validation ───────────────────────────────────────────────
  const validateWithMapbox = async (field: keyof FormState, value: string): Promise<void> => {
    const type = LOCATION_MAPBOX_TYPES[field];
    if (!type || !value.trim() || !MAPBOX_TOKEN) return;

    setLocationLoading((prev) => ({ ...prev, [field]: true }));
    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(value.trim())}.json` +
        `?types=${type}&access_token=${MAPBOX_TOKEN}&limit=1`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Geocoding API error');
      const data = await res.json();

      if (Array.isArray(data.features) && data.features.length === 0) {
        const label =
          field === 'city'          ? 'city or town'        :
          field === 'country'       ? 'country'             :
          field === 'postcode'      ? 'postcode or ZIP code' :
          'neighbourhood or area';
        setFieldError(field, `"${value.trim()}" doesn't appear to be a valid ${label} — check your spelling`);
      } else {
        // Valid — clear any previous Mapbox error for this field
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    } catch {
      // Network / API unavailable — fail silently so it never blocks the user
    } finally {
      setLocationLoading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleBlur = (field: keyof FormState) => async () => {
    const val = form[field] as string;
    const validate = validators[field];
    if (!validate) return;

    const formatError = validate(val, form);
    setFieldError(field, formatError);

    // For location fields: if the format is fine and there is a value, also
    // verify against the Mapbox geocoding API to confirm it's a real place.
    if (!formatError && val.trim() && LOCATION_MAPBOX_TYPES[field]) {
      await validateWithMapbox(field, val);
    }
  };

  // ─── Step 1 validation ────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const fields: Array<keyof FormState> = ['name', 'email', 'password', 'confirmPassword'];
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    let valid = true;

    fields.forEach((field) => {
      const validate = validators[field];
      const msg = validate ? validate(form[field] as string, form) : '';
      newErrors[field] = msg; // Always set — empty string clears a previous error
      if (msg) valid = false;
    });

    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateStep1()) return;
      if (!agreed.terms || !agreed.privacy || !agreed.cookies) {
        setAgreementError('Please accept all agreements to continue.');
        return;
      }
      setAgreementError('');
    }
    setError('');
    setActiveStep(1);
  };

  // ─── Step 2 location validation ───────────────────────────────────────────
  const validateStep2 = (): boolean => {
    // Block submission while any async Mapbox check is still running
    if (Object.values(locationLoading).some(Boolean)) {
      setError('Please wait — still verifying your location details...');
      return false;
    }

    const fields: Array<keyof FormState> = ['address', 'neighbourhood', 'city', 'postcode', 'country'];
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    let valid = true;

    fields.forEach((field) => {
      const validate = validators[field];
      const formatMsg = validate ? validate(form[field] as string) : '';
      // Preserve any Mapbox error that was set on blur — don't clear it with
      // an empty format result when the format happens to be valid.
      const existing = fieldErrors[field] || '';
      const msg = formatMsg || existing;
      newErrors[field] = msg;
      if (msg) valid = false;
    });

    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  // ─── Geolocation ──────────────────────────────────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));

        try {
          const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${longitude},${latitude}.json` +
            `?access_token=${MAPBOX_TOKEN}&types=address&language=en`;

          const res = await fetch(url);
          if (!res.ok) throw new Error('Geocoding failed');
          const data = await res.json();

          if (data.features?.length > 0) {
            const feature = data.features[0];
            const streetAddress = [feature.address, feature.text].filter(Boolean).join(' ');
            const ctx: Array<{ id: string; text: string }> = feature.context || [];

            const neighbourhood =
              ctx.find((c) => c.id.startsWith('neighborhood'))?.text ||
              ctx.find((c) => c.id.startsWith('locality'))?.text || '';
            const postcode = ctx.find((c) => c.id.startsWith('postcode'))?.text || '';
            const city =
              ctx.find((c) => c.id.startsWith('place'))?.text ||
              ctx.find((c) => c.id.startsWith('district'))?.text || '';
            const country = ctx.find((c) => c.id.startsWith('country'))?.text || '';

            setForm((prev) => ({
              ...prev,
              address:       streetAddress  || prev.address,
              neighbourhood: neighbourhood  || prev.neighbourhood,
              postcode:      postcode       || prev.postcode,
              city:          city           || prev.city,
              country:       country        || prev.country,
            }));
            // Clear any field errors on auto-filled values
            setFieldErrors((prev) => ({
              ...prev, address: '', neighbourhood: '', postcode: '', city: '', country: '',
            }));
          } else {
            setGeoError('No address found for your location. Please fill in manually.');
          }
        } catch {
          setGeoError('Could not look up your address. Please fill in manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access denied. Please enter your address manually.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location unavailable. Please enter your address manually.');
        } else {
          setGeoError('Could not get your location. Please enter your address manually.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) return;

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _c, ...data } = form;
      await register(data as RegisterData);
      // Navigate to verify-email and pass email for the "check your inbox" message
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err: unknown) {
      const respData = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      // Prefer the first specific Joi error, then the message field, then a fallback
      const msg = respData?.errors?.[0] || respData?.message;
      setError(msg || 'Account creation failed — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4F46E510, #10B98110)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        {/* ── Logo ── */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              width: 56,
              height: 56,
              borderRadius: 2,
              mb: 1.5,
              boxShadow: '0 8px 16px rgba(79,70,229,0.2)',
            }}
          >
            <i className="fas fa-hands-helping" style={{ color: '#fff', fontSize: '1.5rem' }} />
          </Box>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Neighborhood Exchange
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Join your community today
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontFamily="Poppins, sans-serif" fontWeight={600} fontSize="1.25rem" mb={0.5}>
              Create your account
            </Typography>
            <Typography color="text.secondary" variant="body2" mb={2.5}>
              Start sharing skills with your neighborhood
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* ─────────────────────────────────────
                  Step 1 — Account Info
              ───────────────────────────────────── */}
              {activeStep === 0 && (
                <>
                  <TextField
                    fullWidth required
                    label="Full name"
                    value={form.name}
                    onChange={handleChange('name')}
                    onBlur={handleBlur('name')}
                    error={!!fieldErrors.name}
                    helperText={fieldErrors.name}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth required
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    onBlur={handleBlur('email')}
                    error={!!fieldErrors.email}
                    helperText={fieldErrors.email}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth required
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    onBlur={handleBlur('password')}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password || 'Minimum 6 characters'}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth required
                    label="Confirm password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    error={!!fieldErrors.confirmPassword}
                    helperText={fieldErrors.confirmPassword}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* ── Agreements ── */}
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: agreementError ? 'error.main' : 'divider',
                      borderRadius: 2,
                      p: 1.5,
                      mb: 2.5,
                      bgcolor: agreementError ? '#FFF5F5' : '#F9FAFB',
                    }}
                  >
                    {[
                      { key: 'terms',   label: 'User Agreement',  href: '/terms' },
                      { key: 'privacy', label: 'Privacy Policy',  href: '/privacy' },
                      { key: 'cookies', label: 'Cookie Policy',   href: '/cookies' },
                    ].map(({ key, label, href }) => (
                      <FormControlLabel
                        key={key}
                        sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5, '&:last-child': { mb: 0 } }}
                        control={
                          <Checkbox
                            size="small"
                            checked={agreed[key as keyof typeof agreed]}
                            onChange={(e) => {
                              setAgreed((prev) => ({ ...prev, [key]: e.target.checked }));
                              if (agreementError) setAgreementError('');
                            }}
                            sx={{ pt: 0.25 }}
                          />
                        }
                        label={
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            I agree to the{' '}
                            <Link
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary.main"
                              fontWeight={600}
                              underline="hover"
                            >
                              {label}
                            </Link>
                          </Typography>
                        }
                      />
                    ))}
                    {agreementError && (
                      <FormHelperText error sx={{ mx: 0, mt: 0.5 }}>
                        {agreementError}
                      </FormHelperText>
                    )}
                  </Box>

                  <Button fullWidth variant="contained" size="large" onClick={handleNext} sx={{ py: 1.25 }}>
                    Continue
                  </Button>
                </>
              )}

              {/* ─────────────────────────────────────
                  Step 2 — Your Location
              ───────────────────────────────────── */}
              {activeStep === 1 && (
                <>
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
                    Your location helps connect you with nearby neighbours. All fields are optional and can be updated later.
                  </Alert>

                  {/* Auto-locate button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={
                      geoLoading
                        ? <CircularProgress size={16} color="inherit" />
                        : <MyLocationIcon />
                    }
                    onClick={handleGeolocate}
                    disabled={geoLoading}
                    sx={{ mb: geoError ? 1.5 : 2.5 }}
                  >
                    {geoLoading ? 'Detecting your location…' : 'Use my current location'}
                  </Button>

                  {geoError && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>{geoError}</Alert>
                  )}

                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    {/* Street address — full width */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street address"
                        placeholder="e.g. 42 Baker Street"
                        value={form.address}
                        onChange={handleChange('address')}
                        onBlur={handleBlur('address')}
                        error={!!fieldErrors.address}
                        helperText={fieldErrors.address}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Neighbourhood */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Neighbourhood / Area"
                        placeholder="e.g. Shoreditch"
                        value={form.neighbourhood}
                        onChange={handleChange('neighbourhood')}
                        onBlur={handleBlur('neighbourhood')}
                        error={!locationLoading.neighbourhood && !!fieldErrors.neighbourhood}
                        helperText={locationLoading.neighbourhood ? 'Checking neighbourhood…' : fieldErrors.neighbourhood}
                      />
                    </Grid>

                    {/* City */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City / Town"
                        placeholder="e.g. London"
                        value={form.city}
                        onChange={handleChange('city')}
                        onBlur={handleBlur('city')}
                        error={!locationLoading.city && !!fieldErrors.city}
                        helperText={locationLoading.city ? 'Checking city…' : fieldErrors.city}
                      />
                    </Grid>

                    {/* Postcode */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Postcode / ZIP"
                        placeholder="e.g. EC1A 1BB"
                        value={form.postcode}
                        onChange={handleChange('postcode')}
                        onBlur={handleBlur('postcode')}
                        error={!locationLoading.postcode && !!fieldErrors.postcode}
                        helperText={locationLoading.postcode ? 'Checking postcode…' : fieldErrors.postcode}
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                      />
                    </Grid>

                    {/* Country */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        placeholder="e.g. United Kingdom"
                        value={form.country}
                        onChange={handleChange('country')}
                        onBlur={handleBlur('country')}
                        error={!locationLoading.country && !!fieldErrors.country}
                        helperText={locationLoading.country ? 'Checking country…' : fieldErrors.country}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setActiveStep(0)}
                      sx={{ py: 1.25 }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading || Object.values(locationLoading).some(Boolean)}
                      sx={{ py: 1.25 }}
                    >
                      {loading
                        ? 'Creating account…'
                        : Object.values(locationLoading).some(Boolean)
                        ? 'Verifying location…'
                        : 'Create Account'}
                    </Button>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
                    All location fields are optional
                  </Typography>
                </>
              )}
            </Box>

            <Typography textAlign="center" variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary.main" fontWeight={600} underline="hover">
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
