import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Dashboard landing page placeholder. Use charts and KPIs here.
 */
const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Welcome to the Manufacturing Cloud Suite. This dashboard will show real-time KPIs.
      </Typography>
    </Box>
  );
};

export default Dashboard;
