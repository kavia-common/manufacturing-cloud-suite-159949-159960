import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Quality module page placeholder.
 */
const Quality: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quality
      </Typography>
      <Typography color="text.secondary">Inspections and nonconformances.</Typography>
    </Box>
  );
};

export default Quality;
