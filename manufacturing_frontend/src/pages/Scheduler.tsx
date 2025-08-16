import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Scheduler module page placeholder.
 */
const Scheduler: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Scheduler
      </Typography>
      <Typography color="text.secondary">Plan and manage production schedules.</Typography>
    </Box>
  );
};

export default Scheduler;
