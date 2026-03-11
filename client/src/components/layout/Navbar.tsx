import React, { useState, useEffect } from 'react';
import {
  Box,
  InputBase,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SearchBar = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '0.75rem',
  padding: '0.5rem 1rem',
  transition: 'all 0.2s',
  flex: 1,
  maxWidth: 600,
  margin: '0 2rem',
  '&:focus-within': {
    borderColor: '#4F46E5',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
  },
  '& i': {
    color: '#6B7280',
    marginRight: '0.75rem',
  },
}));

const StyledInput = styled(InputBase)(() => ({
  flex: 1,
  '& .MuiInputBase-input': {
    fontSize: '0.875rem',
    color: '#1F2937',
    '&::placeholder': { color: '#6B7280' },
  },
}));

const NavIconBtn = styled('button')(() => ({
  position: 'relative',
  color: '#6B7280',
  background: 'none',
  border: 'none',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    background: '#F3F4F6',
    color: '#4F46E5',
  },
}));

const NotifBadge = styled('span')(() => ({
  position: 'absolute',
  top: 0,
  right: 0,
  background: '#FF4500',
  color: 'white',
  fontSize: '0.65rem',
  width: 16,
  height: 16,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
}));

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl]   = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <Box
      component="header"
      sx={{
        background: scrolled ? 'rgba(255,255,255,0.9)' : '#FFFFFF',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: '1px solid #E5E7EB',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        boxShadow: scrolled
          ? '0 4px 20px rgba(0,0,0,0.10)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        gridColumn: '1 / -1',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.25s ease',
      }}
    >
      <Box
        sx={{
          width: '100%',
          px: 2,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Box
          component="a"
          href="/feed"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: '#1F2937',
            transition: 'transform 0.2s',
            flexShrink: 0,
            '&:hover': { transform: 'translateY(-2px)' },
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #10B981)',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
              flexShrink: 0,
            }}
          >
            <i className="fas fa-hands-helping" />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography
              sx={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '1.1rem',
                lineHeight: 1.2,
                color: '#1F2937',
              }}
            >
              Neighborhood Exchange
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1 }}>
              Share Skills • Build Community
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        {!isMobile && (
          <SearchBar>
            <i className="fas fa-search" style={{ fontSize: '0.875rem' }} />
            <StyledInput placeholder="Search skills, tools, questions..." />
          </SearchBar>
        )}

        {/* Nav Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {isMobile && (
            <NavIconBtn>
              <i className="fas fa-search" />
            </NavIconBtn>
          )}

          <NavIconBtn onClick={() => navigate('/feed')} title="Home Feed">
            <i className="fas fa-home" style={{ color: location.pathname === '/feed' ? '#4F46E5' : undefined }} />
          </NavIconBtn>

          {isAuthenticated && (
            <>
              <NavIconBtn onClick={() => navigate('/create')} title="Create Post">
                <i className="fas fa-plus" />
              </NavIconBtn>

              <NavIconBtn onClick={() => navigate('/groups')} title="My Groups">
                <i className="fas fa-users" />
              </NavIconBtn>

              <NavIconBtn title="Messages">
                <i className="fas fa-comment-alt" />
              </NavIconBtn>

              <NavIconBtn title="Notifications" sx={{ mr: '0.5rem' }}>
                <i className="fas fa-bell" />
              </NavIconBtn>
            </>
          )}

          {isAuthenticated ? (
            /* User Menu */
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
                '&:hover': { background: '#F3F4F6' },
              }}
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.2, color: '#1F2937' }}>
                  {user?.name?.split(' ')[0] || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <i className="fas fa-coins" style={{ color: '#10B981', fontSize: '0.7rem' }} />
                  {user?.exchangeCount || 0} Exchanges
                </Typography>
              </Box>
              <i className="fas fa-chevron-down" style={{ color: '#6B7280', fontSize: '0.75rem' }} />
            </Box>
          ) : (
            /* Guest auth buttons */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ml: '0.25rem' }}>
              <Box
                component="button"
                onClick={() => navigate('/login')}
                sx={{
                  px: { xs: '0.75rem', sm: '1rem' },
                  py: '0.4rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  '&:hover': { background: '#F3F4F6', borderColor: '#4F46E5', color: '#4F46E5' },
                }}
              >
                Sign In
              </Box>
              <Box
                component="button"
                onClick={() => navigate('/register')}
                sx={{
                  px: { xs: '0.75rem', sm: '1rem' },
                  py: '0.4rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5, #10B981)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.9 },
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Join Free
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {isAuthenticated && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={600} fontSize="0.9rem" color="#1F2937">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate(`/profile/${user?._id}`); }}>
            <i className="fas fa-user" style={{ marginRight: 10, color: '#4F46E5', width: 16 }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/my-exchanges'); }}>
            <i className="fas fa-exchange-alt" style={{ marginRight: 10, color: '#4F46E5', width: 16 }} />
            My Exchanges
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/my-content'); }}>
            <i className="fas fa-file-alt" style={{ marginRight: 10, color: '#4F46E5', width: 16 }} />
            My Content
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#EF4444' }}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: 10, width: 16 }} />
            Sign Out
          </MenuItem>
        </Menu>
      )}
    </Box>
  );
};

export default Navbar;
