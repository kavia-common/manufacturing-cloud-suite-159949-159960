export type WorkCenter = {
  id: string;
  name: string;
  color?: string | null;
};

export type Operation = {
  id: string;
  workOrderNo: string;
  workCenterId: string;
  start: string; // ISO
  end: string; // ISO
  status?: 'planned' | 'in_progress' | 'paused' | 'completed' | 'canceled';
  item?: string | null;
  quantity?: number | null;
  color?: string | null;
};

export type ScheduleBoard = {
  id: string;
  name?: string;
  workCenters: WorkCenter[];
  operations: Operation[];
};

// PUBLIC_INTERFACE
export type OperationUpdateInput = {
  /** ISO start datetime; if omitted, server keeps value */
  start?: string;
  /** ISO end datetime; if omitted, server keeps value */
  end?: string;
  /** New work center assignment; if omitted, server keeps value */
  workCenterId?: string;
};
