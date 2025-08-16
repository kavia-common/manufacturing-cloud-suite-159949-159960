import React from 'react';
import { Box, Button, Card, CardActions, CardContent, Grid, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadReport } from '../api/reports';

// PUBLIC_INTERFACE
/**
 * Reports center that offers CSV, Excel, and PDF exports for multiple domains.
 * Buttons trigger secure downloads from backend export endpoints.
 */
const Reports: React.FC = () => {
  const reports: Array<{ key: string; title: string; description: string; filenameBase: string }> = [
    { key: 'inventory', title: 'Inventory Stock', description: 'On-hand inventory by item, lot and location.', filenameBase: 'inventory_stock' },
    { key: 'purchase-orders', title: 'Purchase Orders', description: 'Open and historical POs with line details.', filenameBase: 'purchase_orders' },
    { key: 'suppliers', title: 'Suppliers', description: 'Supplier master data and contact details.', filenameBase: 'suppliers' },
    { key: 'work-orders', title: 'Work Orders', description: 'Production orders and progress details.', filenameBase: 'work_orders' },
    { key: 'quality', title: 'Quality/NC', description: 'Inspections, results and nonconformances.', filenameBase: 'quality' },
  ];

  const onDownload = async (key: string, format: 'csv' | 'xlsx' | 'pdf', filenameBase: string) => {
    await downloadReport(key, format, `${filenameBase}.${format}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Grid container spacing={2}>
        {reports.map((r) => (
          <Grid item xs={12} md={6} lg={4} key={r.key}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{r.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => onDownload(r.key, 'csv', r.filenameBase)}>
                    CSV
                  </Button>
                  <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => onDownload(r.key, 'xlsx', r.filenameBase)}>
                    Excel
                  </Button>
                  <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => onDownload(r.key, 'pdf', r.filenameBase)}>
                    PDF
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reports;
