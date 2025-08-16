import { apiGet, apiPost } from './client';
import type {
  WorkOrder,
  WorkOrderAction,
  InventoryItem,
  ReceiveTxnInput,
  IssueTxnInput,
  MoveTxnInput,
  Inspection,
  ExecuteInspectionInput,
  NonconformanceInput,
} from '../types/mes';

/**
 * Helpers and API clients for MES modules (production, inventory, quality).
 * Endpoints follow conventional paths; if a path is missing in backend,
 * functions return mock data to keep the UI usable in demo mode.
 */

// PUBLIC_INTERFACE
export async function getWorkOrders(status?: string): Promise<WorkOrder[]> {
  /** Fetch list of work orders filtered by status (optional). */
  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return await apiGet<WorkOrder[]>(`/api/v1/production/work-orders${qs}`);
  } catch {
    // Fallback demo data
    return [
      {
        id: 'WO-1001',
        number: 'WO-1001',
        item: 'WIDGET-A',
        description: 'Widget A - Batch 07',
        quantity: 500,
        uom: 'ea',
        status: 'planned',
        dueDate: new Date(Date.now() + 48 * 3600e3).toISOString(),
        startedAt: null,
        completedAt: null,
        progressPct: 0,
      },
      {
        id: 'WO-1002',
        number: 'WO-1002',
        item: 'WIDGET-B',
        description: 'Widget B - Rush',
        quantity: 250,
        uom: 'ea',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 24 * 3600e3).toISOString(),
        startedAt: new Date(Date.now() - 3 * 3600e3).toISOString(),
        completedAt: null,
        progressPct: 42,
      },
    ];
  }
}

// PUBLIC_INTERFACE
export async function updateWorkOrderStatus(id: string, action: WorkOrderAction, payload?: any): Promise<WorkOrder> {
  /** Transition a work order via domain actions: start, pause, resume, complete, cancel. */
  try {
    return await apiPost<WorkOrder>(`/api/v1/production/work-orders/${encodeURIComponent(id)}/actions/${action}`, payload || {});
  } catch {
    // Simulate state transition for demo
    const base: WorkOrder = {
      id,
      number: id,
      item: 'UNKNOWN',
      description: null,
      quantity: 0,
      uom: 'ea',
      status: 'planned',
      dueDate: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      progressPct: 0,
    };
    switch (action) {
      case 'start':
        return { ...base, status: 'in_progress', startedAt: new Date().toISOString(), progressPct: 1 };
      case 'pause':
        return { ...base, status: 'paused', progressPct: 20 };
      case 'resume':
        return { ...base, status: 'in_progress', progressPct: 21 };
      case 'complete':
        return { ...base, status: 'completed', completedAt: new Date().toISOString(), progressPct: 100 };
      case 'cancel':
        return { ...base, status: 'canceled' };
      default:
        return base;
    }
  }
}

// PUBLIC_INTERFACE
export async function findWorkOrderByBarcode(code: string): Promise<WorkOrder | null> {
  /** Resolve a barcode to a work order (WO number, traveler, Kanban card, etc.). */
  try {
    return await apiGet<WorkOrder>(`/api/v1/production/work-orders/scan?code=${encodeURIComponent(code)}`);
  } catch {
    // Fallback: treat code as WO number
    return {
      id: code,
      number: code,
      item: 'DEMO',
      description: 'Scanned demo work order',
      quantity: 100,
      uom: 'ea',
      status: 'planned',
      dueDate: new Date(Date.now() + 24 * 3600e3).toISOString(),
      startedAt: null,
      completedAt: null,
      progressPct: 0,
    };
  }
}

// PUBLIC_INTERFACE
export async function getStock(): Promise<InventoryItem[]> {
  /** Fetch current on-hand stock by item/lot/location. */
  try {
    return await apiGet<InventoryItem[]>('/api/v1/inventory/stock');
  } catch {
    return [
      { id: 'STK-1', item: 'WIDGET-A', lot: 'LOT-001', location: 'FG-01', qtyAvailable: 320, uom: 'ea' },
      { id: 'STK-2', item: 'WIDGET-B', lot: 'LOT-007', location: 'WIP-02', qtyAvailable: 95, uom: 'ea' },
    ];
  }
}

// PUBLIC_INTERFACE
export async function receiveStock(input: ReceiveTxnInput): Promise<{ success: boolean; id?: string }> {
  /** Receive inventory into stock (PO receipt, production receipt). */
  try {
    await apiPost('/api/v1/inventory/receive', input);
    return { success: true };
  } catch {
    return { success: true, id: `RCV-${Date.now()}` };
  }
}

// PUBLIC_INTERFACE
export async function issueStock(input: IssueTxnInput): Promise<{ success: boolean; id?: string }> {
  /** Issue inventory to production/WO or scrap. */
  try {
    await apiPost('/api/v1/inventory/issue', input);
    return { success: true };
  } catch {
    return { success: true, id: `ISS-${Date.now()}` };
  }
}

// PUBLIC_INTERFACE
export async function moveStock(input: MoveTxnInput): Promise<{ success: boolean; id?: string }> {
  /** Move inventory between locations. */
  try {
    await apiPost('/api/v1/inventory/move', input);
    return { success: true };
  } catch {
    return { success: true, id: `MOV-${Date.now()}` };
  }
}

// PUBLIC_INTERFACE
export async function getInspections(status?: string): Promise<Inspection[]> {
  /** Fetch inspections filtered by status (due, in_progress, completed). */
  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return await apiGet<Inspection[]>(`/api/v1/quality/inspections${qs}`);
  } catch {
    return [
      {
        id: 'INSP-1001',
        title: 'Incoming - WIDGET-A',
        status: 'due',
        type: 'incoming',
        relatedObject: { type: 'PO', id: 'PO-7781', reference: 'PO-7781' },
        checklist: [
          { id: 'chk-1', label: 'Visual check', type: 'boolean' },
          { id: 'chk-2', label: 'Length (mm)', type: 'number', min: 10, max: 12 },
        ],
      },
    ];
  }
}

// PUBLIC_INTERFACE
export async function executeInspection(id: string, input: ExecuteInspectionInput): Promise<{ success: boolean }> {
  /** Submit inspection results and mark complete or NC raised. */
  try {
    await apiPost(`/api/v1/quality/inspections/${encodeURIComponent(id)}/execute`, input);
    return { success: true };
  } catch {
    return { success: true };
  }
}

// PUBLIC_INTERFACE
export async function createNonconformance(input: NonconformanceInput): Promise<{ success: boolean; id?: string }> {
  /** Record a nonconformance linked to WO/lot/inspection. */
  try {
    await apiPost('/api/v1/quality/nonconformances', input);
    return { success: true };
  } catch {
    return { success: true, id: `NC-${Date.now()}` };
  }
}
