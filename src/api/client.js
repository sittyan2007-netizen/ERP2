const API_BASE = "/api";

/**
 * Backend endpoints and payload shapes expected by the UI.
 *
 * GET /api/memos
 * - Response: { data: Memo[] }
 * - Memo: {
 *     id: string,
 *     memo_no: string,
 *     process: string,
 *     lot_code: string,
 *     description: string,
 *     from_party: string,
 *     to_party: string,
 *     date_out_header: string,
 *     date_in_header: string,
 *     remark_header: string,
 *     status_locked: boolean,
 *     items: MemoItem[]
 *   }
 * - MemoItem: {
 *     id: string,
 *     item_no: number,
 *     out_date: string,
 *     out_grade: string,
 *     out_size: string,
 *     out_pcs: number,
 *     out_weight_1: number,
 *     out_weight_2: number,
 *     in_date: string,
 *     in_grade: string,
 *     in_size: string,
 *     in_pcs: number,
 *     in_weight_1: number,
 *     in_weight_2: number | null,
 *     price: number,
 *     amount: number,
 *     rej_pcs: number,
 *     rej_cts: number,
 *     wastage_in: number,
 *     percent: number,
 *     remark_line: string
 *   }
 *
 * GET /api/invoices/latest (or /api/invoices/:id)
 * - Response: { data: Invoice }
 * - Invoice: {
 *     id: string,
 *     invoiceNo: string,
 *     sellId: string,
 *     date: string,
 *     party: string,
 *     transactionType: string,
 *     averagePrice: string,
 *     totalCts: number,
 *     totalAmount: string,
 *     items: InvoiceLineItem[]
 *   }
 * - InvoiceLineItem: {
 *     srNo: number,
 *     lotNo: string,
 *     description: string,
 *     shape: string,
 *     size: string,
 *     grade: string,
 *     pcs: number,
 *     cts: number,
 *     price: string,
 *     amount: string,
 *     remarks: string
 *   }
 *
 * GET /api/inventory
 * - Response: { data: InventoryLot[] }
 * - InventoryLot: {
 *     id: string,
 *     lot: string,
 *     process: string,
 *     stage: string,
 *     availableCts: number,
 *     status: "Ready" | "In progress"
 *   }
 */

const requestJson = async (path) => {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  const json = await response.json();
  return json.data ?? json;
};

export const fetchMemos = () => requestJson("/memos");

export const fetchInvoice = (invoiceId = "latest") =>
  requestJson(`/invoices/${invoiceId}`);

export const fetchInventory = () => requestJson("/inventory");
