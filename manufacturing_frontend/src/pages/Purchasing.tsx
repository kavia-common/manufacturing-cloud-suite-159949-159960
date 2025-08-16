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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPOLine,
  createPO,
  createSupplier,
  deletePO,
  deletePOLine,
  deleteSupplier,
  getPOs,
  getSuppliers,
  updatePO,
  updatePOLine,
  updateSupplier,
} from '../api/purchasing';
import type { PurchaseOrder, PurchaseOrderLine, Supplier } from '../types/purchasing';

// PUBLIC_INTERFACE
/**
 * Purchasing module UI:
 * - Manage suppliers
 * - Manage purchase orders and lines (CRUD)
 */
const Purchasing: React.FC = () => {
  const qc = useQueryClient();
  const { data: suppliers, isLoading: loadingSuppliers, error: supplierError } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });
  const { data: pos, isLoading: loadingPOs, error: poError } = useQuery({ queryKey: ['purchase-orders'], queryFn: getPOs });

  // Supplier dialog
  const [supplierDialog, setSupplierDialog] = React.useState<{ open: boolean; editing?: Supplier | null }>({ open: false, editing: null });
  const [sName, setSName] = React.useState('');
  const [sEmail, setSEmail] = React.useState('');
  const [sPhone, setSPhone] = React.useState('');

  const openNewSupplier = () => {
    setSupplierDialog({ open: true, editing: null });
    setSName('');
    setSEmail('');
    setSPhone('');
  };
  const openEditSupplier = (s: Supplier) => {
    setSupplierDialog({ open: true, editing: s });
    setSName(s.name);
    setSEmail(s.email || '');
    setSPhone(s.phone || '');
  };
  const saveSupplier = async () => {
    const input = { name: sName.trim(), email: sEmail.trim() || null, phone: sPhone.trim() || null };
    if (supplierDialog.editing) {
      await updateSupplier(supplierDialog.editing.id, input);
    } else {
      await createSupplier(input as any);
    }
    await qc.invalidateQueries({ queryKey: ['suppliers'] });
    setSupplierDialog({ open: false, editing: null });
  };

  const removeSupplier = async (s: Supplier) => {
    await deleteSupplier(s.id);
    await qc.invalidateQueries({ queryKey: ['suppliers'] });
  };

  // PO dialog
  const [poDialog, setPoDialog] = React.useState<{ open: boolean; editing?: PurchaseOrder | null }>({ open: false, editing: null });
  const [poSupplier, setPoSupplier] = React.useState<string>('');
  const [poStatus, setPoStatus] = React.useState<PurchaseOrder['status']>('draft');

  const openNewPO = () => {
    setPoDialog({ open: true, editing: null });
    setPoSupplier(suppliers?.[0]?.id || '');
    setPoStatus('draft');
  };
  const openEditPO = (po: PurchaseOrder) => {
    setPoDialog({ open: true, editing: po });
    setPoSupplier(po.supplierId);
    setPoStatus(po.status);
  };
  const savePO = async () => {
    if (!poSupplier) return;
    const input = { supplierId: poSupplier, status: poStatus };
    if (poDialog.editing) {
      await updatePO(poDialog.editing.id, input);
    } else {
      await createPO(input as any);
    }
    await qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    setPoDialog({ open: false, editing: null });
  };

  const removePO = async (po: PurchaseOrder) => {
    await deletePO(po.id);
    await qc.invalidateQueries({ queryKey: ['purchase-orders'] });
  };

  // Line dialog
  const [lineDialog, setLineDialog] = React.useState<{ open: boolean; po?: PurchaseOrder | null; editing?: PurchaseOrderLine | null }>({
    open: false,
    po: null,
    editing: null,
  });
  const [item, setItem] = React.useState('');
  const [qty, setQty] = React.useState<number>(0);
  const [uom, setUom] = React.useState('ea');
  const [price, setPrice] = React.useState<number>(0);
  const [due, setDue] = React.useState('');

  const openNewLine = (po: PurchaseOrder) => {
    setLineDialog({ open: true, po, editing: null });
    setItem('');
    setQty(0);
    setUom('ea');
    setPrice(0);
    setDue('');
  };
  const openEditLine = (po: PurchaseOrder, line: PurchaseOrderLine) => {
    setLineDialog({ open: true, po, editing: line });
    setItem(line.item);
    setQty(line.quantity);
    setUom(line.uom || 'ea');
    setPrice(line.price || 0);
    setDue(line.dueDate?.slice(0, 10) || '');
  };

  const saveLine = async () => {
    if (!lineDialog.po) return;
    const input = { item, quantity: qty, uom, price, dueDate: due ? new Date(due).toISOString() : null };
    if (lineDialog.editing) {
      await updatePOLine(lineDialog.po.id, lineDialog.editing.id, input as any);
    } else {
      await addPOLine(lineDialog.po.id, input as any);
    }
    await qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    setLineDialog({ open: false, po: null, editing: null });
  };

  const removeLine = async (po: PurchaseOrder, line: PurchaseOrderLine) => {
    await deletePOLine(po.id, line.id);
    await qc.invalidateQueries({ queryKey: ['purchase-orders'] });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Purchasing
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Suppliers</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openNewSupplier}>
                New
              </Button>
            </Stack>
            {supplierError ? <Alert severity="error">Failed to load suppliers.</Alert> : null}
            {loadingSuppliers ? <Typography color="text.secondary">Loading...</Typography> : null}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(suppliers || []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEditSupplier(s)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeSupplier(s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!suppliers || suppliers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No suppliers found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Purchase Orders</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openNewPO}>
                New PO
              </Button>
            </Stack>
            {poError ? <Alert severity="error">Failed to load purchase orders.</Alert> : null}
            {loadingPOs ? <Typography color="text.secondary">Loading...</Typography> : null}
            <Stack spacing={2}>
              {(pos || []).map((po) => (
                <Paper key={po.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {po.number}
                      </Typography>
                      <Chip size="small" label={po.status} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => openEditPO(po)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => removePO(po)}>
                        Delete
                      </Button>
                      <Button size="small" variant="contained" onClick={() => openNewLine(po)}>
                        Add Line
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Supplier: {suppliers?.find((s) => s.id === po.supplierId)?.name || po.supplierId} • Created:{' '}
                    {po.createdAt ? new Date(po.createdAt).toLocaleString() : '-'}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell>UoM</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell>Due</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(po.lines || []).map((ln) => (
                          <TableRow key={ln.id}>
                            <TableCell>{ln.item}</TableCell>
                            <TableCell align="right">{ln.quantity}</TableCell>
                            <TableCell>{ln.uom || 'ea'}</TableCell>
                            <TableCell align="right">{typeof ln.price === 'number' ? ln.price.toFixed(2) : '-'}</TableCell>
                            <TableCell>{ln.dueDate ? new Date(ln.dueDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => openEditLine(po, ln)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => removeLine(po, ln)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!po.lines || po.lines.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <Typography color="text.secondary">No lines.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ))}
              {(!pos || pos.length === 0) && <Typography color="text.secondary">No purchase orders found.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Supplier dialog */}
      <Dialog open={supplierDialog.open} onClose={() => setSupplierDialog({ open: false })} fullWidth maxWidth="sm">
        <DialogTitle>{supplierDialog.editing ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={sName} onChange={(e) => setSName(e.target.value)} fullWidth />
            <TextField label="Email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} fullWidth />
            <TextField label="Phone" value={sPhone} onChange={(e) => setSPhone(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupplierDialog({ open: false, editing: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveSupplier} disabled={!sName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* PO dialog */}
      <Dialog open={poDialog.open} onClose={() => setPoDialog({ open: false })} fullWidth maxWidth="sm">
        <DialogTitle>{poDialog.editing ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select
              value={poSupplier}
              onChange={(e) => setPoSupplier(String(e.target.value))}
              displayEmpty
              fullWidth
              renderValue={(v) => suppliers?.find((s) => s.id === v)?.name || 'Select Supplier'}
            >
              {(suppliers || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
            <Select value={poStatus} onChange={(e) => setPoStatus(e.target.value as any)} fullWidth>
              <MenuItem value="draft">draft</MenuItem>
              <MenuItem value="open">open</MenuItem>
              <MenuItem value="closed">closed</MenuItem>
              <MenuItem value="canceled">canceled</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPoDialog({ open: false, editing: null })}>Cancel</Button>
          <Button variant="contained" onClick={savePO} disabled={!poSupplier}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Line dialog */}
      <Dialog open={lineDialog.open} onClose={() => setLineDialog({ open: false, po: null, editing: null })} fullWidth maxWidth="sm">
        <DialogTitle>{lineDialog.editing ? 'Edit Line' : 'New Line'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Item" value={item} onChange={(e) => setItem(e.target.value)} fullWidth />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                sx={{ flex: 1 }}
              />
              <TextField label="UoM" value={uom} onChange={(e) => setUom(e.target.value)} sx={{ width: 120 }} />
            </Stack>
            <TextField label="Price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <TextField
              label="Due Date"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLineDialog({ open: false, po: null, editing: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveLine} disabled={!item.trim() || qty <= 0}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchasing;
