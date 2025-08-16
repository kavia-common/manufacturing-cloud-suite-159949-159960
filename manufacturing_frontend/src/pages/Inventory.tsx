import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import StockTable from '../components/StockTable';
import InventoryTransactionForms from '../components/InventoryTransactionForms';
import { getStock, issueStock, moveStock, receiveStock } from '../api/mes';

// PUBLIC_INTERFACE
/**
 * Inventory module:
 * - On-hand stock list
 * - Quick receive, issue, move forms
 */
const Inventory: React.FC = () => {
  const { data: stock, refetch } = useQuery({
    queryKey: ['stock'],
    queryFn: () => getStock(),
  });

  const onReceive = async (input: any) => {
    await receiveStock(input);
    await refetch();
  };
  const onIssue = async (input: any) => {
    await issueStock(input);
    await refetch();
  };
  const onMove = async (input: any) => {
    await moveStock(input);
    await refetch();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventory
      </Typography>
      <Stack spacing={2}>
        <StockTable stock={stock || []} />
        <Divider />
        <InventoryTransactionForms onReceive={onReceive} onIssue={onIssue} onMove={onMove} />
      </Stack>
    </Box>
  );
};

export default Inventory;
