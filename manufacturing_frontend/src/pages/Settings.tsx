import React from 'react';
import { Box, Typography } from '@mui/material';

// PUBLIC_INTERFACE
/**
 * Settings page placeholder.
 */
const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary">Application and tenant configuration.</Typography>
    </Box>
  );
};

export default Settings;
