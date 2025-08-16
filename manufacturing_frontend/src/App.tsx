import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Inventory from './pages/Inventory';
import Quality from './pages/Quality';
import Scheduler from './pages/Scheduler';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './auth/AuthContext';

// PUBLIC_INTERFACE
/**
 * Root application shell with persistent sidebar and topbar.
 * Provides primary navigation and renders routed pages in the main content area.
 * Adds authentication-aware layout (hides sidebar when not authenticated).
 */
const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const toggleDrawer = () => setDrawerOpen((o) => !o);

  const isLoginRoute = location.pathname === '/login';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar onMenuClick={toggleDrawer} />
      {isAuthenticated && !isLoginRoute ? <Sidebar open={drawerOpen} onClose={toggleDrawer} /> : null}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          width: '100%',
        }}
      >
        {/* Push content below the Topbar */}
        <Toolbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/production"
            element={
              <ProtectedRoute>
                <Production />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quality"
            element={
              <ProtectedRoute>
                <Quality />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduler"
            element={
              <ProtectedRoute>
                <Scheduler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;
