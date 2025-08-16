import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createRole, createTenant, createUser, deleteRole, deleteTenant, deleteUser, getRoles, getTenants, getUsers, updateUser } from '../api/admin';
import { Tenant, User } from '../types/auth';

// PUBLIC_INTERFACE
/**
 * Admin console page with Users, Roles, and Tenants management.
 * - Users: list, create, edit roles (comma-separated), delete.
 * - Roles: list, create, delete.
 * - Tenants: list, create, delete.
 */
const Admin: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Users" />
        <Tab label="Roles" />
        <Tab label="Tenants" />
      </Tabs>

      {tab === 0 ? <UsersPanel /> : null}
      {tab === 1 ? <RolesPanel /> : null}
      {tab === 2 ? <TenantsPanel /> : null}
    </Box>
  );
};

function UsersPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers });
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [roles, setRoles] = React.useState('');

  const resetForm = () => {
    setEditing(null);
    setEmail('');
    setName('');
    setRoles('');
    setOpen(false);
  };

  const onCreateUpdate = async () => {
    const rolesList = roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    if (editing) {
      await updateUser(editing.id, { email, name, roles: rolesList });
    } else {
      await createUser({ email, name, roles: rolesList });
    }
    await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    resetForm();
  };

  const onDelete = async (u: User) => {
    await deleteUser(u.id);
    await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Users</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setEmail('');
            setName('');
            setRoles('');
            setOpen(true);
          }}
        >
          New User
        </Button>
      </Stack>

      {error ? <Alert severity="error">Failed to load users.</Alert> : null}
      {isLoading ? <Typography color="text.secondary">Loading...</Typography> : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email || '-'}</TableCell>
                <TableCell>{u.name || '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                    {(u.roles || []).map((r) => (
                      <Chip key={r} size="small" label={r} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(u);
                      setEmail(u.email || '');
                      setName(u.name || '');
                      setRoles((u.roles || []).join(', '));
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDelete(u)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">No users found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField
              label="Roles (comma separated)"
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              helperText="Example: admin, inventory, purchasing"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreateUpdate}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function RolesPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'roles'], queryFn: getRoles });
  const [roleName, setRoleName] = React.useState('');

  const onCreate = async () => {
    if (!roleName.trim()) return;
    await createRole({ name: roleName.trim() });
    await qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
    setRoleName('');
  };

  const onDelete = async (name: string) => {
    await deleteRole(name);
    await qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField label="Role name" value={roleName} onChange={(e) => setRoleName(e.target.value)} sx={{ maxWidth: 320 }} />
        <Button variant="contained" onClick={onCreate}>
          Add Role
        </Button>
      </Stack>

      {error ? <Alert severity="error">Failed to load roles.</Alert> : null}
      {isLoading ? <Typography color="text.secondary">Loading...</Typography> : null}

      <Paper variant="outlined">
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ p: 2 }}>
          {(data || []).map((r) => (
            <Chip
              key={r}
              label={r}
              onDelete={() => onDelete(r)}
              deleteIcon={<DeleteIcon />}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
          {(!data || data.length === 0) && <Typography color="text.secondary">No roles configured.</Typography>}
        </Stack>
      </Paper>
    </Stack>
  );
}

function TenantsPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'tenants'], queryFn: getTenants });
  const [open, setOpen] = React.useState(false);
  const [tenantId, setTenantId] = React.useState('');
  const [tenantName, setTenantName] = React.useState('');

  const onCreate = async () => {
    await createTenant({ id: tenantId.trim(), name: tenantName.trim() || undefined });
    await qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    setOpen(false);
    setTenantId('');
    setTenantName('');
  };

  const onDelete = async (t: Tenant) => {
    await deleteTenant(t.id);
    await qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Tenants</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New Tenant
        </Button>
      </Stack>

      {error ? <Alert severity="error">Failed to load tenants.</Alert> : null}
      {isLoading ? <Typography color="text.secondary">Loading...</Typography> : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.name || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => onDelete(t)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary">No tenants found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
            <TextField label="Tenant Name" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={!tenantId.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default Admin;
