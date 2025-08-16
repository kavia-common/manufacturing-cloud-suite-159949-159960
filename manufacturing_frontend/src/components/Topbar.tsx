import React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// PUBLIC_INTERFACE
export interface TopbarProps {
  /** Triggered when the menu icon is clicked to toggle the sidebar */
  onMenuClick: () => void;
}

// PUBLIC_INTERFACE
/**
 * Application top bar containing the title and global actions.
 */
const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <IconButton onClick={onMenuClick} color="inherit" edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Manufacturing Cloud Suite
        </Typography>
        <Box>
          {/* Placeholder for user menu, notifications, tenant switcher, etc. */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
