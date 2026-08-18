import React from 'react';
import { Box } from '@mui/material';
import Aurora from './Aurora/Aurora';

/**
 * PageLayout - Wraps all pages with Aurora background effect
 * Provides consistent animated background across the application
 */
export default function PageLayout({ children, variant = 'default' }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative', bgcolor: 'black' }}>
      {/* Aurora animated background - Fixed position, behind all content */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: variant === 'sidebar' ? 0.3 : 0.4,
        }}
      >
        <Aurora
          colorStops={["#66a1ff", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </Box>
      
      {/* Content wrapper - Appears above Aurora */}
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  );
}
