import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { WorkOrder, WorkOrderAction } from '../types/mes';

// PUBLIC_INTERFACE
export interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onAction?: any;
  loading?: boolean;
}

/**
 * Responsive grid of work orders with status chip, progress bar, and action buttons.
 */
const WorkOrderList: React.FC<WorkOrderListProps> = ({ workOrders, onAction, loading }) => {
  if (!workOrders || workOrders.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        {loading ? 'Loading work orders...' : 'No work orders found'}
      </Box>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'planned':
      case 'released':
        return 'default';
      case 'in_progress':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const actionsFor = (wo: WorkOrder): Array<{ key: WorkOrderAction; icon: React.ReactNode; label: string }> => {
    switch (wo.status) {
      case 'planned':
      case 'released':
        return [{ key: 'start', icon: <PlayArrowIcon />, label: 'Start' }];
      case 'in_progress':
        return [
          { key: 'pause', icon: <PauseIcon />, label: 'Pause' },
          { key: 'complete', icon: <CheckCircleIcon />, label: 'Complete' },
          { key: 'cancel', icon: <CancelIcon />, label: 'Cancel' },
        ];
      case 'paused':
        return [
          { key: 'resume', icon: <RestartAltIcon />, label: 'Resume' },
          { key: 'cancel', icon: <CancelIcon />, label: 'Cancel' },
        ];
      default:
        return [];
    }
  };

  return (
    <Grid container spacing={2}>
      {workOrders.map((wo) => (
        <Grid key={wo.id} item xs={12} sm={6} md={4} lg={3}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {wo.number}
                </Typography>
                <Chip size="small" label={wo.status} color={statusColor(wo.status) as any} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {wo.item} • {wo.quantity} {wo.uom}
              </Typography>
              {wo.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {wo.description}
                </Typography>
              ) : null}
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, wo.progressPct || 0))} />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(wo.progressPct || 0)}% complete
                </Typography>
              </Box>
              {wo.dueDate ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Due: {new Date(wo.dueDate).toLocaleString()}
                </Typography>
              ) : null}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {actionsFor(wo).map((a) => (
                  <Button
                    key={a.key}
                    size="small"
                    variant="contained"
                    color={a.key === 'cancel' ? 'error' : a.key === 'complete' ? 'primary' : 'inherit'}
                    startIcon={a.icon}
                    onClick={() => onAction?.(wo, a.key)}
                  >
                    {a.label}
                  </Button>
                ))}
              </Stack>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default WorkOrderList;
