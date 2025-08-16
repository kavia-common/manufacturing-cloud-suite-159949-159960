import React from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { ChecklistItem, Inspection, NonconformanceInput } from '../types/mes';

// PUBLIC_INTERFACE
export interface QualityInspectionListProps {
  inspections: Inspection[];
  onExecute: any;
  onRaiseNC: any;
}

/**
 * Display inspections and allow quick execution with a generated checklist UI.
 * Supports raising NC directly from the execution dialog.
 */
const QualityInspectionList: React.FC<QualityInspectionListProps> = ({ inspections, onExecute, onRaiseNC }) => {
  const [selected, setSelected] = React.useState<Inspection | null>(null);
  const [results, setResults] = React.useState<Record<string, any>>({});
  const [notes, setNotes] = React.useState('');
  const [passed, setPassed] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const open = (insp: Inspection) => {
    setSelected(insp);
    setResults({});
    setNotes('');
    setPassed(true);
  };

  const close = () => setSelected(null);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onExecute(selected.id, { results, notes, passed });
      close();
    } catch {
      // ignore errors for now (handled upstream)
    } finally {
      setSubmitting(false);
    }
  };

  const raiseNc = async () => {
    if (!selected) return;
    const input: NonconformanceInput = {
      sourceType: 'inspection',
      sourceId: selected.id,
      item: selected.relatedObject?.reference || undefined,
      description: `NC from inspection ${selected.id}: ${notes || 'No notes'}`,
      severity: 'major',
    };
    await onRaiseNC(input);
    close();
  };

  const renderItem = (item: ChecklistItem) => {
    switch (item.type) {
      case 'boolean':
        return (
          <Stack direction="row" spacing={1} alignItems="center" key={item.id}>
            <Switch
              checked={!!results[item.id]}
              onChange={(e) => setResults((r) => ({ ...r, [item.id]: e.target.checked }))}
            />
            <Typography>{item.label}</Typography>
          </Stack>
        );
      case 'number':
        return (
          <TextField
            key={item.id}
            label={`${item.label}${item.min !== undefined || item.max !== undefined ? ` (${item.min ?? '-'}..${item.max ?? '-'})` : ''}`}
            type="number"
            value={results[item.id] ?? ''}
            onChange={(e) => setResults((r) => ({ ...r, [item.id]: Number(e.target.value) }))}
            fullWidth
          />
        );
      default:
        return (
          <TextField
            key={item.id}
            label={item.label}
            value={results[item.id] ?? ''}
            onChange={(e) => setResults((r) => ({ ...r, [item.id]: e.target.value }))}
            fullWidth
          />
        );
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        {inspections.map((insp) => (
          <Grid key={insp.id} item xs={12} md={6} lg={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{insp.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {insp.type} • {insp.status}
                </Typography>
                {insp.relatedObject ? (
                  <Typography variant="caption" color="text.secondary">
                    {insp.relatedObject.type}: {insp.relatedObject.reference || insp.relatedObject.id}
                  </Typography>
                ) : null}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={() => open(insp)}>
                  Execute
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!selected} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>Execute Inspection</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selected?.checklist?.map((c) => renderItem(c))}
            <TextField
              label="Notes"
              value={notes}
              multiline
              minRows={2}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch checked={passed} onChange={(e) => setPassed(e.target.checked)} />
              <Typography>Passed</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button color="error" onClick={raiseNc} disabled={submitting || passed === true}>
            Raise NC
          </Button>
          <Button variant="contained" onClick={submit} disabled={submitting}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QualityInspectionList;
