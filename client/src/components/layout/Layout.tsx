import React from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  hideSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, rightPanel, hideSidebar }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F9FAFB',
        display: 'grid',
        gridTemplateColumns: hideSidebar
          ? '1fr'
          : rightPanel
          ? { xs: '1fr', md: '280px 1fr', lg: '280px 1fr 360px' }
          : { xs: '1fr', md: '280px 1fr' },
        gridTemplateRows: '56px 1fr',
      }}
    >
      {/* Fixed navbar — placeholder row keeps grid layout intact */}
      <Box sx={{ gridColumn: '1 / -1', gridRow: 1, height: 56 }}>
        <Navbar />
      </Box>

      {/* Sidebar */}
      {!hideSidebar && (
        <Box sx={{ gridRow: 2, display: { xs: 'none', md: 'block' } }}>
          <Sidebar />
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          gridRow: 2,
          minWidth: 0,
          p: { xs: 1.5, sm: 2 },
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Right Panel */}
      {rightPanel && (
        <Box
          sx={{
            gridRow: 2,
            display: { xs: 'none', lg: 'block' },
            position: 'sticky',
            top: 56,
            height: 'calc(100vh - 56px)',
            overflowY: 'auto',
            background: '#FFFFFF',
            borderLeft: '1px solid #E5E7EB',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
            p: '1.5rem 1rem',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F9FAFB', borderRadius: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#E5E7EB', borderRadius: 4 },
          }}
        >
          {rightPanel}
        </Box>
      )}
    </Box>
  );
};

export default Layout;
