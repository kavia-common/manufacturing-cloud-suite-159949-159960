import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Production module page placeholder.
 */
const Production: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Production
      </Typography>
      <Typography color="text.secondary">Manage work orders and operations.</Typography>
    </Box>
  );
};

export default Production;
