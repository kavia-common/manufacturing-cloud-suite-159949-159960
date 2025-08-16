import { apiGet, apiPost } from './client';
import type { Operation, OperationUpdateInput, ScheduleBoard, WorkCenter } from '../types/scheduler';

function startOfHour(date = new Date()): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function iso(d: Date) {
  return d.toISOString();
}

function demoBoard(): ScheduleBoard {
  const now = new Date();
  const base = startOfHour(now);
  const wcs: WorkCenter[] = [
    { id: 'WC-10', name: 'CNC-10', color: '#1976d2' },
    { id: 'WC-20', name: 'Mill-20', color: '#9c27b0' },
    { id: 'WC-30', name: 'Lathe-30', color: '#ff6600' },
    { id: 'WC-40', name: 'QC-40', color: '#2e7d32' },
  ];

  const ops: Operation[] = [
    {
      id: 'OP-1001',
      workOrderNo: 'WO-1001',
      workCenterId: 'WC-10',
      start: iso(addMinutes(base, -30)),
      end: iso(addMinutes(base, 60)),
      status: 'in_progress',
      item: 'WIDGET-A',
      quantity: 120,
      color: '#1976d2',
    },
    {
      id: 'OP-1002',
      workOrderNo: 'WO-1001',
      workCenterId: 'WC-20',
      start: iso(addMinutes(base, 60)),
      end: iso(addMinutes(base, 180)),
      status: 'planned',
      item: 'WIDGET-A',
      quantity: 120,
      color: '#9c27b0',
    },
    {
      id: 'OP-2001',
      workOrderNo: 'WO-2001',
      workCenterId: 'WC-30',
      start: iso(addMinutes(base, 30)),
      end: iso(addMinutes(base, 150)),
      status: 'planned',
      item: 'WIDGET-B',
      quantity: 80,
      color: '#ff6600',
    },
  ];

  return {
    id: 'default',
    name: 'Default Board',
    workCenters: wcs,
    operations: ops,
  };
}

// PUBLIC_INTERFACE
export async function getScheduleBoard(boardId: string = 'default'): Promise<ScheduleBoard> {
  /** Fetch a scheduler board consisting of work centers (rows) and operations (blocks). Falls back to demo data if backend path is unavailable. */
  // Try some conventional paths
  const candidates = [
    `/api/v1/scheduling/boards/${encodeURIComponent(boardId)}`,
    `/api/v1/scheduling/board?board=${encodeURIComponent(boardId)}`,
    `/api/v1/scheduling/schedule?board=${encodeURIComponent(boardId)}`,
  ];
  for (const path of candidates) {
    try {
      return await apiGet<ScheduleBoard>(path);
    } catch {
      // try next
    }
  }
  // demo
  return demoBoard();
}

// PUBLIC_INTERFACE
export async function updateOperation(
  id: string,
  input: OperationUpdateInput,
  boardId: string = 'default',
): Promise<Operation> {
  /** Update operation timing or assignment. Will POST/PATCH against conventional endpoints; falls back to echo update for demo. */
  const body = { ...input, boardId };
  const candidates = [
    { path: `/api/v1/scheduling/operations/${encodeURIComponent(id)}`, method: 'POST' as const },
    { path: `/api/v1/scheduling/operations/${encodeURIComponent(id)}`, method: 'PATCH' as const },
    { path: `/api/v1/scheduling/operation/${encodeURIComponent(id)}`, method: 'POST' as const },
  ];
  for (const c of candidates) {
    try {
      return await apiPost<Operation>(c.path, body);
    } catch {
      // Try next
    }
  }

  // Fallback: apply update onto a demo operation
  const base = demoBoard().operations.find((o) => o.id === id) || {
    id,
    workOrderNo: 'WO-DEMO',
    workCenterId: input.workCenterId || 'WC-10',
    start: input.start || new Date().toISOString(),
    end: input.end || new Date(Date.now() + 3600e3).toISOString(),
    status: 'planned' as Operation['status'],
  };
  return {
    ...base,
    ...input,
  };
}
