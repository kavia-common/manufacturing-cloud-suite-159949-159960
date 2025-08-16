import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { useDashboardStream, KpiSnapshot } from '../api/ws';

// PUBLIC_INTERFACE
/**
 * Real-time dashboard with OEE, scrap rate, and downtime charts.
 * Subscribes to /ws/dashboard (token via query, tenant via query) and renders live snapshots.
 */
const Dashboard: React.FC = () => {
  const [series, setSeries] = React.useState<KpiSnapshot[]>([]);

  const addSnapshot = React.useCallback((snap: KpiSnapshot) => {
    setSeries((prev) => {
      const next = [...prev, { ...snap, ts: new Date(snap.ts).toLocaleTimeString() }];
      // Limit in-memory series for performance on mobile
      return next.slice(-60);
    });
  }, []);

  useDashboardStream(addSnapshot);

  const latest = series[series.length - 1] || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <KpiCard label="OEE" value={fmtPct(latest.oee)} />
        </Grid>
        <Grid item xs={12} md={3}>
          <KpiCard label="Availability" value={fmtPct(latest.availability)} />
        </Grid>
        <Grid item xs={12} md={3}>
          <KpiCard label="Performance" value={fmtPct(latest.performance)} />
        </Grid>
        <Grid item xs={12} md={3}>
          <KpiCard label="Quality" value={fmtPct(latest.quality)} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: 320 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6">OEE (last 60 ticks)</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" hide />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(v: any) => `${Math.round(Number(v) * 100)}%`} />
                  <Line type="monotone" dataKey="oee" stroke="#1976d2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: 320 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6">Scrap Rate (last 60 ticks)</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" hide />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(v: any) => `${Math.round(Number(v) * 100)}%`} />
                  <Bar dataKey="scrap_rate" fill="#ff6600" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ height: 320 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6">Downtime Minutes (last 60 ticks)</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="downtime_minutes" fill="#9c27b0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function fmtPct(v?: number) {
  return typeof v === 'number' ? `${Math.round(v * 100)}%` : '—';
}

export default Dashboard;
