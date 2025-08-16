import React from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { IssueTxnInput, MoveTxnInput, ReceiveTxnInput } from '../types/mes';

// PUBLIC_INTERFACE
export interface InventoryTransactionFormsProps {
  onReceive: any;
  onIssue: any;
  onMove: any;
}

/**
 * Three compact forms for inventory transactions, optimized for touch and scanning.
 */
const InventoryTransactionForms: React.FC<InventoryTransactionFormsProps> = ({ onReceive, onIssue, onMove }) => {
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const clearAlerts = () => {
    setMessage(null);
    setError(null);
  };

  const handle = async (fn: () => Promise<void>) => {
    clearAlerts();
    try {
      await fn();
      setMessage('Transaction submitted.');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit transaction');
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Receive</Typography>
          <ReceiveForm
            onSubmit={(i) =>
              handle(async () => {
                await onReceive(i);
              })
            }
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Issue</Typography>
          <IssueForm
            onSubmit={(i) =>
              handle(async () => {
                await onIssue(i);
              })
            }
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Move</Typography>
          <MoveForm
            onSubmit={(i) =>
              handle(async () => {
                await onMove(i);
              })
            }
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Grid>
    </Grid>
  );
};

const ReceiveForm: React.FC<{ onSubmit: any }> = ({ onSubmit }) => {
  const [form, setForm] = React.useState<ReceiveTxnInput>({ item: '', lot: '', quantity: 0, uom: 'ea', location: '' });
  return (
    <Stack spacing={1.5} component="form" onSubmit={(e: any) => e.preventDefault()}>
      <TextField label="Item" value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} />
      <TextField label="Lot" value={form.lot || ''} onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))} />
      <Stack direction="row" spacing={1}>
        <TextField
          label="Qty"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          sx={{ flex: 1 }}
        />
        <TextField
          label="UoM"
          select
          value={form.uom}
          onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))}
          sx={{ width: 120 }}
        >
          <MenuItem value="ea">ea</MenuItem>
          <MenuItem value="kg">kg</MenuItem>
          <MenuItem value="m">m</MenuItem>
        </TextField>
      </Stack>
      <TextField
        label="Location"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
      />
      <TextField
        label="Reference (PO/WO)"
        value={form.reference || ''}
        onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
      />
      <Box>
        <Button variant="contained" onClick={() => onSubmit(form)}>
          Receive
        </Button>
      </Box>
    </Stack>
  );
};

const IssueForm: React.FC<{ onSubmit: any }> = ({ onSubmit }) => {
  const [form, setForm] = React.useState<IssueTxnInput>({
    item: '',
    lot: '',
    quantity: 0,
    uom: 'ea',
    toWorkOrder: '',
    reason: 'production',
  });
  return (
    <Stack spacing={1.5} component="form" onSubmit={(e: any) => e.preventDefault()}>
      <TextField label="Item" value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} />
      <TextField label="Lot" value={form.lot || ''} onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))} />
      <Stack direction="row" spacing={1}>
        <TextField
          label="Qty"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          sx={{ flex: 1 }}
        />
        <TextField
          label="UoM"
          select
          value={form.uom}
          onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))}
          sx={{ width: 120 }}
        >
          <MenuItem value="ea">ea</MenuItem>
          <MenuItem value="kg">kg</MenuItem>
          <MenuItem value="m">m</MenuItem>
        </TextField>
      </Stack>
      <TextField
        label="To Work Order"
        value={form.toWorkOrder || ''}
        onChange={(e) => setForm((f) => ({ ...f, toWorkOrder: e.target.value }))}
      />
      <TextField
        label="Reason"
        select
        value={form.reason || 'production'}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value as any }))}
      >
        <MenuItem value="production">production</MenuItem>
        <MenuItem value="scrap">scrap</MenuItem>
        <MenuItem value="adjustment">adjustment</MenuItem>
      </TextField>
      <Box>
        <Button variant="contained" onClick={() => onSubmit(form)}>
          Issue
        </Button>
      </Box>
    </Stack>
  );
};

const MoveForm: React.FC<{ onSubmit: any }> = ({ onSubmit }) => {
  const [form, setForm] = React.useState<MoveTxnInput>({
    item: '',
    lot: '',
    quantity: 0,
    uom: 'ea',
    fromLocation: '',
    toLocation: '',
  });
  return (
    <Stack spacing={1.5} component="form" onSubmit={(e: any) => e.preventDefault()}>
      <TextField label="Item" value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} />
      <TextField label="Lot" value={form.lot || ''} onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))} />
      <Stack direction="row" spacing={1}>
        <TextField
          label="Qty"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          sx={{ flex: 1 }}
        />
        <TextField
          label="UoM"
          select
          value={form.uom}
          onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))}
          sx={{ width: 120 }}
        >
          <MenuItem value="ea">ea</MenuItem>
          <MenuItem value="kg">kg</MenuItem>
          <MenuItem value="m">m</MenuItem>
        </TextField>
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          label="From Location"
          value={form.fromLocation}
          onChange={(e) => setForm((f) => ({ ...f, fromLocation: e.target.value }))}
          sx={{ flex: 1 }}
        />
        <TextField
          label="To Location"
          value={form.toLocation}
          onChange={(e) => setForm((f) => ({ ...f, toLocation: e.target.value }))}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Box>
        <Button variant="contained" onClick={() => onSubmit(form)}>
          Move
        </Button>
      </Box>
    </Stack>
  );
};

export default InventoryTransactionForms;
