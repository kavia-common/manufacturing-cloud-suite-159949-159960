import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type { PurchaseOrder, PurchaseOrderLine, Supplier } from '../types/purchasing';

// Demo fallback state
let SUPPLIERS: Supplier[] = [
  { id: 'S-100', name: 'Acme Metals', email: 'sales@acme.example', phone: '555-0100' },
  { id: 'S-200', name: 'Global Plastics', email: 'info@plastics.example', phone: '555-0200' },
];

let POS: PurchaseOrder[] = [
  {
    id: 'PO-1001',
    number: 'PO-1001',
    supplierId: 'S-100',
    status: 'open',
    createdAt: new Date().toISOString(),
    lines: [
      { id: 'L-1', item: 'STEEL-PLATE-A', quantity: 50, uom: 'ea', price: 20.5, dueDate: new Date(Date.now() + 7 * 86400e3).toISOString() },
    ],
  },
];

// PUBLIC_INTERFACE
export async function getSuppliers(): Promise<Supplier[]> {
  /** List suppliers. */
  try {
    return await apiGet<Supplier[]>('/api/v1/procurement/suppliers');
  } catch {
    return SUPPLIERS;
  }
}

// PUBLIC_INTERFACE
export async function createSupplier(input: { name: string; email?: string | null; phone?: string | null }): Promise<Supplier> {
  /** Create supplier. */
  try {
    return await apiPost<Supplier>('/api/v1/procurement/suppliers', input);
  } catch {
    const s: Supplier = { id: `S-${Date.now()}`, name: input.name, email: input.email || null, phone: input.phone || null };
    SUPPLIERS = [s, ...SUPPLIERS];
    return s;
  }
}

// PUBLIC_INTERFACE
export async function updateSupplier(id: string, input: { name?: string | null; email?: string | null; phone?: string | null }): Promise<Supplier> {
  /** Update supplier. */
  try {
    return await apiPut<Supplier>(`/api/v1/procurement/suppliers/${encodeURIComponent(id)}`, input);
  } catch {
    SUPPLIERS = SUPPLIERS.map((s) => (s.id === id ? { ...s, ...input } : s));
    return SUPPLIERS.find((s) => s.id === id)!;
  }
}

// PUBLIC_INTERFACE
export async function deleteSupplier(id: string): Promise<{ success: boolean }> {
  /** Delete supplier. */
  try {
    return await apiDelete<{ success: boolean }>(`/api/v1/procurement/suppliers/${encodeURIComponent(id)}`);
  } catch {
    SUPPLIERS = SUPPLIERS.filter((s) => s.id !== id);
    POS = POS.map((po) => (po.supplierId === id ? { ...po, supplierId: '' } : po));
    return { success: true };
  }
}

// PUBLIC_INTERFACE
export async function getPOs(): Promise<PurchaseOrder[]> {
  /** List purchase orders. */
  const candidates = ['/api/v1/procurement/purchase-orders', '/api/v1/purchasing/purchase-orders', '/api/v1/po'];
  for (const path of candidates) {
    try {
      return await apiGet<PurchaseOrder[]>(path);
    } catch {
      // try next
    }
  }
  return POS;
}

// PUBLIC_INTERFACE
export async function createPO(input: { supplierId: string; status?: PurchaseOrder['status'] }): Promise<PurchaseOrder> {
  /** Create purchase order. */
  const candidates = ['/api/v1/procurement/purchase-orders', '/api/v1/purchasing/purchase-orders', '/api/v1/po'];
  for (const path of candidates) {
    try {
      return await apiPost<PurchaseOrder>(path, input);
    } catch {
      // try next
    }
  }
  const po: PurchaseOrder = {
    id: `PO-${Date.now()}`,
    number: `PO-${Date.now()}`,
    supplierId: input.supplierId,
    status: input.status || 'draft',
    createdAt: new Date().toISOString(),
    lines: [],
  };
  POS = [po, ...POS];
  return po;
}

// PUBLIC_INTERFACE
export async function updatePO(id: string, input: Partial<Pick<PurchaseOrder, 'status' | 'supplierId'>>): Promise<PurchaseOrder> {
  /** Update purchase order. */
  const candidates = [
    { method: 'PUT', path: `/api/v1/procurement/purchase-orders/${encodeURIComponent(id)}` },
    { method: 'PATCH', path: `/api/v1/procurement/purchase-orders/${encodeURIComponent(id)}` },
  ] as const;
  for (const c of candidates) {
    try {
      if (c.method === 'PUT') return await apiPut<PurchaseOrder>(c.path, input);
      return await apiPatch<PurchaseOrder>(c.path, input);
    } catch {
      // try next
    }
  }
  POS = POS.map((po) => (po.id === id ? { ...po, ...input } : po));
  return POS.find((po) => po.id === id)!;
}

// PUBLIC_INTERFACE
export async function deletePO(id: string): Promise<{ success: boolean }> {
  /** Delete purchase order. */
  const candidates = [`/api/v1/procurement/purchase-orders/${encodeURIComponent(id)}`, `/api/v1/purchasing/purchase-orders/${encodeURIComponent(id)}`];
  for (const path of candidates) {
    try {
      return await apiDelete<{ success: boolean }>(path);
    } catch {
      // try next
    }
  }
  POS = POS.filter((po) => po.id !== id);
  return { success: true };
}

// PUBLIC_INTERFACE
export async function addPOLine(poId: string, input: Omit<PurchaseOrderLine, 'id'>): Promise<PurchaseOrderLine> {
  /** Add a purchase order line. */
  const candidates = [
    `/api/v1/procurement/purchase-orders/${encodeURIComponent(poId)}/lines`,
    `/api/v1/purchasing/purchase-orders/${encodeURIComponent(poId)}/lines`,
  ];
  for (const path of candidates) {
    try {
      return await apiPost<PurchaseOrderLine>(path, input);
    } catch {
      // try next
    }
  }
  const ln: PurchaseOrderLine = { ...input, id: `L-${Date.now()}` };
  POS = POS.map((po) => (po.id === poId ? { ...po, lines: [...(po.lines || []), ln] } : po));
  return ln;
}

// PUBLIC_INTERFACE
export async function updatePOLine(poId: string, lineId: string, input: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine> {
  /** Update a purchase order line. */
  const candidates = [
    `/api/v1/procurement/purchase-orders/${encodeURIComponent(poId)}/lines/${encodeURIComponent(lineId)}`,
    `/api/v1/purchasing/purchase-orders/${encodeURIComponent(poId)}/lines/${encodeURIComponent(lineId)}`,
  ];
  for (const path of candidates) {
    try {
      return await apiPut<PurchaseOrderLine>(path, input);
    } catch {
      // try next
    }
  }
  POS = POS.map((po) =>
    po.id === poId ? { ...po, lines: (po.lines || []).map((l) => (l.id === lineId ? { ...l, ...input } : l)) } : po,
  );
  return POS.find((po) => po.id === poId)!.lines!.find((l) => l.id === lineId)!;
}

// PUBLIC_INTERFACE
export async function deletePOLine(poId: string, lineId: string): Promise<{ success: boolean }> {
  /** Delete a purchase order line. */
  const candidates = [
    `/api/v1/procurement/purchase-orders/${encodeURIComponent(poId)}/lines/${encodeURIComponent(lineId)}`,
    `/api/v1/purchasing/purchase-orders/${encodeURIComponent(poId)}/lines/${encodeURIComponent(lineId)}`,
  ];
  for (const path of candidates) {
    try {
      return await apiDelete<{ success: boolean }>(path);
    } catch {
      // try next
    }
  }
  POS = POS.map((po) =>
    po.id === poId ? { ...po, lines: (po.lines || []).filter((l) => l.id !== lineId) } : po,
  );
  return { success: true };
}
