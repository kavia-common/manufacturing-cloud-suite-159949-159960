import React from 'react';
import { getStoredAuth } from '../utils/storage';

export type KpiSnapshot = {
  ts: string;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
  throughput?: number;
  scrap_rate?: number;
  downtime_minutes?: number;
  [key: string]: any;
};

type WSHandlers = {
  onOpen?: any;
  onClose?: any;
  onError?: any;
  onMessage?: any;
};

function buildWsBase(): string {
  // Prefer explicit env; fallback to same origin but ws protocol
  const raw = (import.meta as any).env?.VITE_WS_BASE_URL as string | undefined;
  if (raw) return raw.replace(/^http/, 'ws');
  const loc = globalThis.location;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${loc.host}`;
}

// PUBLIC_INTERFACE
export function connectDashboardWS(handlers: WSHandlers): WebSocket {
  /** Connect to dashboard real-time KPI stream using token (query) and tenant (query fallback). */
  const stored = getStoredAuth();
  const token = stored?.token || '';
  const tenant = stored?.tenantId || '';

  const base = buildWsBase();
  const path = '/ws/dashboard';
  const qs = new URLSearchParams();
  if (token) qs.set('token', token);
  if (tenant) qs.set('tenant', tenant); // header not allowed in browser; pass as query for backend to accept

  const ws = new WebSocket(`${base}${path}?${qs.toString()}`);

  ws.onopen = (e) => handlers.onOpen?.(e);
  ws.onerror = (e) => handlers.onError?.(e);
  ws.onclose = (e) => handlers.onClose?.(e);
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string);
      handlers.onMessage?.(msg);
    } catch {
      handlers.onMessage?.(e.data);
    }
  };

  return ws;
}

// PUBLIC_INTERFACE
export function useDashboardStream(onSnapshot: any) {
  /**
   * React hook to subscribe to KPI snapshots with auto-reconnect backoff.
   * The hook will parse messages of shape:
   *   { type: 'kpi.snapshot', data: { ... } }
   * and pass the data to the provided callback.
   */
  const attemptRef = React.useRef(0);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const connect = () => {
      const ws = connectDashboardWS({
        onOpen: () => {
          attemptRef.current = 0;
        },
        onClose: () => {
          if (cancelled) return;
          // Exponential backoff up to 10s
          const timeout = Math.min(10000, 500 * Math.pow(2, attemptRef.current++));
          globalThis.setTimeout(connect, timeout);
        },
        onError: () => {
          // Let onClose handle reconnect
        },
        onMessage: (msg: any) => {
          const snapshot: KpiSnapshot | null = normalizeSnapshot(msg);
          if (snapshot) onSnapshot(snapshot);
        },
      });
      wsRef.current = ws;
    };

    connect();

    return () => {
      cancelled = true;
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
    };
  }, [onSnapshot]);
}

function normalizeSnapshot(raw: any): KpiSnapshot | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const data = raw.type && raw.data ? raw.data : raw;
  const ts = data.ts || data.timestamp || new Date().toISOString();

  return {
    ts,
    oee: asNumber(data.oee, 0),
    availability: asNumber(data.availability, undefined),
    performance: asNumber(data.performance, undefined),
    quality: asNumber(data.quality, undefined),
    throughput: asNumber(data.throughput, undefined),
    scrap_rate: asNumber(data.scrap_rate ?? data.scrapRate, undefined),
    downtime_minutes: asNumber(data.downtime_minutes ?? data.downtimeMinutes, undefined),
    ...data,
  };
}

function asNumber(v: any, fallback?: number) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
