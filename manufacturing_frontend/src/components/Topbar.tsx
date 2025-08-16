import React from 'react';
import {
  AppBar,
  Box,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
export interface TopbarProps {
  /** Triggered when the menu icon is clicked to toggle the sidebar */
  onMenuClick: () => void;
}

// PUBLIC_INTERFACE
/**
 * Application top bar containing the title and global actions:
 * - Tenant selector (X-Tenant-ID)
 * - Sign in / Sign out controls
 */
const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { isAuthenticated, user, tenants, tenantId, setTenant, logout } = useAuth();

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <IconButton onClick={onMenuClick} color="inherit" edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Manufacturing Cloud Suite
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {isAuthenticated && tenants && tenants.length > 0 ? (
            <Select
              size="small"
              value={tenantId || tenants[0]?.id || ''}
              onChange={(e) => setTenant(String(e.target.value))}
              displayEmpty
              sx={{ minWidth: 160 }}
            >
              {tenants.map((t) => (
                <MenuItem value={t.id} key={t.id}>
                  {t.name || t.id}
                </MenuItem>
              ))}
            </Select>
          ) : null}
          {isAuthenticated ? (
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={() => {
                void logout(true);
              }}
            >
              {user?.name || user?.email || 'Sign out'}
            </Button>
          ) : (
            <Box />
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
