export interface Party {
  id: string;
  name: string;
  type: string | null;
  city: string | null;
  phone: string | null;
}

export interface Lot {
  id: string;
  lot_no: string;
  lot_name: string | null;
  description: string | null;
  format: string | null;
  shape: string | null;
  size: string | null;
  grade: string | null;
  cts: number | null;
}

export interface InventoryRecord {
  id: string;
  lot_id: string | null;
  party_id: string | null;
  record_date: string;
  sell_id: string | null;
  format: string | null;
  shape: string | null;
  size: string | null;
  description: string | null;
  cts: number | null;
  amount: number | null;
  status: string | null;
}

export interface SellRecord {
  id: string;
  sell_id: string;
  party_id: string | null;
  record_date: string;
  total_cts: number | null;
  total_amount: number | null;
  avg_price: number | null;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  party_id: string | null;
  sell_id: string | null;
  invoice_date: string;
  transaction_type: string | null;
  total_cts: number | null;
  total_amount: number | null;
  avg_price: number | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  lot_id: string | null;
  description: string | null;
  shape: string | null;
  size: string | null;
  grade: string | null;
  pcs: number | null;
  cts: number | null;
  price: number | null;
  amount: number | null;
}

export interface Memo {
  id: string;
  memo_no: string;
  party_id: string | null;
  memo_date: string;
  status: string;
}

export interface LedgerEntry {
  id: string;
  entry_date: string;
  party_id: string | null;
  lot_id: string | null;
  entry_type: string;
  amount: number;
  balance: number | null;
  status: string;
}

export interface LotStageEvent {
  id: string;
  lot_id: string;
  stage: string;
  event_date: string;
  yield_cts: number | null;
  reject_cts: number | null;
  wastage_cts: number | null;
  notes: string | null;
}
