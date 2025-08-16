import React from 'react';
import { Box, Button, Divider, Stack, Typography, Alert } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SchedulerTimeline from '../components/SchedulerTimeline';
import { getScheduleBoard, updateOperation } from '../api/scheduler';
import type { Operation, ScheduleBoard } from '../types/scheduler';
import { useAuth } from '../auth/AuthContext';
import { useSchedulerWS } from '../api/ws';

// PUBLIC_INTERFACE
/**
 * Drag-and-drop timeline scheduler page.
 * - Displays work centers as rows and operations as blocks across time
 * - Supports drag to move, resize to adjust duration, and vertical drag to reassign to another work center
 * - Persists updates to backend via Schedule API and syncs real-time via /ws/scheduler
 */
const Scheduler: React.FC = () => {
  const boardId = 'default';
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const editable = hasRole(['scheduler', 'admin']);

  const { data: board, isLoading, error } = useQuery({
    queryKey: ['schedule-board', boardId],
    queryFn: () => getScheduleBoard(boardId),
  });

  // Local state layered on top of query data to provide optimistic updates
  const [localBoard, setLocalBoard] = React.useState<ScheduleBoard | null>(null);

  React.useEffect(() => {
    if (board) setLocalBoard(board);
  }, [board]);

  // WebSocket: listen for server-side updates to keep in sync
  useSchedulerWS(
    React.useCallback((msg: any) => {
      const { type, data } = normalizeSchedulerMsg(msg);
      if (!type) return;

      setLocalBoard((prev) => {
        if (!prev) return prev;
        switch (type) {
          case 'scheduler.schedule.update': {
            // Full board snapshot
            const next = data as ScheduleBoard;
            return next?.id ? next : prev;
          }
          case 'scheduler.operation.move':
          case 'scheduler.operation.assign': {
            // Partial operation update
            const upd = data as Partial<Operation> & { id: string };
            if (!upd?.id) return prev;
            return {
              ...prev,
              operations: prev.operations.map((o) => (o.id === upd.id ? { ...o, ...upd } : o)),
            };
          }
          default:
            return prev;
        }
      });
    }, []),
    boardId,
  );

  const onChange = async (opId: string, next: { start?: string; end?: string; workCenterId?: string }) => {
    // Optimistic update: update local immediately
    setLocalBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        operations: prev.operations.map((o) => (o.id === opId ? { ...o, ...next } as Operation : o)),
      };
    });

    try {
      await updateOperation(opId, next, boardId);
      // Invalidate to confirm with backend truth
      await qc.invalidateQueries({ queryKey: ['schedule-board', boardId] });
    } catch {
      // Roll back by refetching
      await qc.invalidateQueries({ queryKey: ['schedule-board', boardId] });
    }
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['schedule-board', boardId] });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Scheduler
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Button variant="outlined" size="small" onClick={refresh}>
          Refresh
        </Button>
        {editable ? (
          <Typography variant="caption" color="text.secondary">
            Drag blocks to move/assign. Use side handles to resize. Changes are saved automatically.
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Read-only view. You do not have scheduler permissions.
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {error ? <Alert severity="error">Failed to load schedule.</Alert> : null}
      {isLoading && !localBoard ? (
        <Typography color="text.secondary">Loading schedule...</Typography>
      ) : null}

      {localBoard ? (
        <Box sx={{ height: { xs: 380, md: 520 } }}>
          <SchedulerTimeline board={localBoard} editable={editable} onChange={onChange} />
        </Box>
      ) : null}
    </Box>
  );
};

function normalizeSchedulerMsg(raw: any): { type?: string; data?: any } {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (raw.type) return { type: raw.type, data: raw.data ?? raw.payload ?? raw };
  // Sometimes server may broadcast plain operation
  if (raw.id && (raw.start || raw.end || raw.workCenterId)) {
    return { type: 'scheduler.operation.move', data: raw };
  }
  return {};
}

export default Scheduler;
