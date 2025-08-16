export type WorkOrderStatus = 'planned' | 'released' | 'in_progress' | 'paused' | 'completed' | 'canceled';

export type WorkOrder = {
  id: string;
  number: string;
  item: string;
  description?: string | null;
  quantity: number;
  uom: string;
  status: WorkOrderStatus;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  progressPct?: number;
};

export type WorkOrderAction = 'start' | 'pause' | 'resume' | 'complete' | 'cancel';

export type InventoryItem = {
  id: string;
  item: string;
  lot?: string | null;
  location: string;
  qtyAvailable: number;
  uom: string;
};

export type ReceiveTxnInput = {
  item: string;
  lot?: string | null;
  quantity: number;
  uom: string;
  location: string;
  reference?: string | null; // PO, WO, etc.
};

export type IssueTxnInput = {
  item: string;
  lot?: string | null;
  quantity: number;
  uom: string;
  toWorkOrder?: string | null;
  reason?: 'production' | 'scrap' | 'adjustment';
};

export type MoveTxnInput = {
  item: string;
  lot?: string | null;
  quantity: number;
  uom: string;
  fromLocation: string;
  toLocation: string;
};

export type ChecklistItem =
  | { id: string; label: string; type: 'boolean' }
  | { id: string; label: string; type: 'number'; min?: number; max?: number }
  | { id: string; label: string; type: 'text' };

export type Inspection = {
  id: string;
  title: string;
  status: 'due' | 'in_progress' | 'completed';
  type: 'incoming' | 'in_process' | 'final';
  relatedObject?: { type: string; id: string; reference?: string | null };
  checklist: ChecklistItem[];
};

export type ExecuteInspectionInput = {
  results: Record<string, any>;
  notes?: string | null;
  passed: boolean;
};

export type NonconformanceInput = {
  sourceType: 'inspection' | 'production' | 'customer' | 'supplier' | 'internal';
  sourceId?: string | null;
  item?: string | null;
  lot?: string | null;
  quantity?: number | null;
  uom?: string | null;
  description: string;
  severity?: 'minor' | 'major' | 'critical';
};
