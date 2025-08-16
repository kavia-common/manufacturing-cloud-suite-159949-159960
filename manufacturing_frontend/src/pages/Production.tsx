import React from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WorkOrderList from '../components/WorkOrderList';
import BarcodeScanInput from '../components/BarcodeScanInput';
import { findWorkOrderByBarcode, getWorkOrders, updateWorkOrderStatus } from '../api/mes';
import type { WorkOrder, WorkOrderAction } from '../types/mes';

// PUBLIC_INTERFACE
/**
 * Production module:
 * - Work order list with status actions
 * - Barcode scanning to jump to a WO
 */
const Production: React.FC = () => {
  const [filter, setFilter] = React.useState<string | undefined>(undefined);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['work-orders', filter],
    queryFn: () => getWorkOrders(filter),
  });

  const onAction = async (wo: WorkOrder, action: WorkOrderAction) => {
    await updateWorkOrderStatus(wo.id, action, {});
    await refetch();
  };

  const onScan = async (code: string) => {
    const wo = await findWorkOrderByBarcode(code);
    if (!wo) return;
    // Poke cache with the scanned WO at top for quick access
    qc.setQueryData<WorkOrder[]>(['work-orders', filter], (prev) => {
      const list = prev || [];
      const others = list.filter((x) => x.id !== wo.id);
      return [wo, ...others];
    });
  };

  const filters: Array<{ key?: string; label: string }> = [
    { key: undefined, label: 'All' },
    { key: 'planned', label: 'Planned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'paused', label: 'Paused' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Production
      </Typography>

      <Stack spacing={2}>
        <BarcodeScanInput onDetected={onScan} placeholder="Scan WO/Traveler to locate..." />
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {filters.map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              color={filter === f.key ? 'primary' : 'default'}
              variant={filter === f.key ? 'filled' : 'outlined'}
              onClick={() => setFilter(f.key as any)}
            />
          ))}
        </Stack>
        <Divider />
        <WorkOrderList workOrders={data || []} onAction={onAction} loading={isLoading} />
      </Stack>
    </Box>
  );
};

export default Production;
