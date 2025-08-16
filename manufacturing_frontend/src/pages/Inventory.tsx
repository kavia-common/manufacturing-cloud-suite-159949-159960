import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Inventory module page placeholder.
 */
const Inventory: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventory
      </Typography>
      <Typography color="text.secondary">Track locations, lots, and movements.</Typography>
    </Box>
  );
};

export default Inventory;
