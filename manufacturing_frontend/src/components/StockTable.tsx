import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { InventoryItem } from '../types/mes';

// PUBLIC_INTERFACE
export interface StockTableProps {
  stock: InventoryItem[];
}

/**
 * Simple responsive table to display stock by item/lot/location.
 */
const StockTable: React.FC<StockTableProps> = ({ stock }) => {
  if (!stock || stock.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No stock to display.
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Lot</TableCell>
            <TableCell>Location</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>UoM</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stock.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.item}</TableCell>
              <TableCell>{s.lot || '-'}</TableCell>
              <TableCell>{s.location}</TableCell>
              <TableCell align="right">{s.qtyAvailable}</TableCell>
              <TableCell>{s.uom}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StockTable;
