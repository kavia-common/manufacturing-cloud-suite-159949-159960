export type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type PurchaseOrderStatus = 'draft' | 'open' | 'closed' | 'canceled';

export type PurchaseOrderLine = {
  id: string;
  item: string;
  quantity: number;
  uom?: string | null;
  price?: number | null;
  dueDate?: string | null;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  createdAt?: string | null;
  lines?: PurchaseOrderLine[];
};
