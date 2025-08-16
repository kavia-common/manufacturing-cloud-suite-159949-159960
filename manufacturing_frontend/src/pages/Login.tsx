import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
/**
 * Login page: authenticates a user via backend and establishes the session.
 * - Accepts username and password
 * - Optional tenant ID field for multi-tenant logins
 * - On success, redirects to the page specified in ?next= or to '/'
 */
const Login: React.FC = () => {
  const { login, isAuthenticated, initialized } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tenantId, setTenantId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const nextParam = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  React.useEffect(() => {
    if (initialized && isAuthenticated) {
      navigate(nextParam, { replace: true });
    }
  }, [initialized, isAuthenticated, navigate, nextParam]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password, tenantId || undefined);
      navigate(nextParam, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
      <Paper elevation={2} sx={{ width: '100%', p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={onSubmit}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your Manufacturing Cloud Suite workspace
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email or Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />
          <TextField
            label="Tenant ID"
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Optional (X-Tenant-ID)"
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Login;
