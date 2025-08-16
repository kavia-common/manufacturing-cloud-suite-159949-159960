import React from 'react';
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory2';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const drawerWidth = 240;

// PUBLIC_INTERFACE
export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

 // PUBLIC_INTERFACE
/**
 * Persistent drawer containing primary navigation links.
 * Items are filtered by user roles when requiredRoles is provided.
 * Note: Scheduler requires 'scheduler' or 'admin' role to appear.
 */
const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const location = useLocation();
  const { hasRole } = useAuth();

  const navItems: Array<{ to: string; label: string; icon: React.ReactNode; requiredRoles?: string[] }> = [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/production', label: 'Production', icon: <BuildIcon />, requiredRoles: ['production', 'admin'] },
    { to: '/inventory', label: 'Inventory', icon: <InventoryIcon />, requiredRoles: ['inventory', 'admin'] },
    { to: '/quality', label: 'Quality', icon: <FactCheckIcon />, requiredRoles: ['quality', 'admin'] },
    { to: '/scheduler', label: 'Scheduler', icon: <ScheduleIcon />, requiredRoles: ['scheduler', 'admin'] },
    { to: '/purchasing', label: 'Purchasing', icon: <ShoppingCartIcon />, requiredRoles: ['purchasing', 'admin'] },
    { to: '/reports', label: 'Reports', icon: <AssessmentIcon />, requiredRoles: ['reports', 'admin'] },
    { to: '/admin', label: 'Admin', icon: <AdminPanelSettingsIcon />, requiredRoles: ['admin'] },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon />, requiredRoles: ['admin'] },
  ];

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {navItems
          .filter((item) => !item.requiredRoles || hasRole(item.requiredRoles))
          .map((item) => {
            const selected = location.pathname === item.to;
            return (
              <ListItemButton key={item.to} component={NavLink} to={item.to} selected={selected}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
