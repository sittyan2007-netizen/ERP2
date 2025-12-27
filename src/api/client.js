import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase tables and payload shapes expected by the UI.
 *
 * Table: memos
 * - Columns: id, memo_no, process, lot_code, description, from_party, to_party,
 *   date_out_header, date_in_header, remark_header, status_locked
 * - Related table: memo_items (foreign key memo_items.memo_id -> memos.id)
 * - memo_items columns: id, memo_id, item_no, out_date, out_grade, out_size,
 *   out_pcs, out_weight_1, out_weight_2, in_date, in_grade, in_size, in_pcs,
 *   in_weight_1, in_weight_2, price, amount, rej_pcs, rej_cts, wastage_in,
 *   percent, remark_line
 *
 * Table: invoices
 * - Columns: id, invoice_no, sell_id, date, party, transaction_type, average_price,
 *   total_cts, total_amount
 * - Related table: invoice_items (foreign key invoice_items.invoice_id -> invoices.id)
 * - invoice_items columns: id, invoice_id, sr_no, lot_no, description, shape, size,
 *   grade, pcs, cts, price, amount, remarks
 *
 * Table: inventory_lots
 * - Columns: id, lot, process, stage, available_cts, status
 */

const handleSupabase = ({ data, error }) => {
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const mapInvoice = (invoice) => {
  if (!invoice) return null;
  return {
    id: invoice.id,
    invoiceNo: invoice.invoice_no,
    sellId: invoice.sell_id,
    date: invoice.date,
    party: invoice.party,
    transactionType: invoice.transaction_type,
    averagePrice: invoice.average_price,
    totalCts: invoice.total_cts,
    totalAmount: invoice.total_amount,
    items: (invoice.items || []).map((item) => ({
      srNo: item.sr_no,
      lotNo: item.lot_no,
      description: item.description,
      shape: item.shape,
      size: item.size,
      grade: item.grade,
      pcs: item.pcs,
      cts: item.cts,
      price: item.price,
      amount: item.amount,
      remarks: item.remarks
    }))
  };
};

const mapMemo = (memo) => ({
  ...memo,
  items: (memo.items || []).map((item) => ({
    id: item.id,
    item_no: item.item_no,
    out_date: item.out_date,
    out_grade: item.out_grade,
    out_size: item.out_size,
    out_pcs: item.out_pcs,
    out_weight_1: item.out_weight_1,
    out_weight_2: item.out_weight_2,
    in_date: item.in_date,
    in_grade: item.in_grade,
    in_size: item.in_size,
    in_pcs: item.in_pcs,
    in_weight_1: item.in_weight_1,
    in_weight_2: item.in_weight_2,
    price: item.price,
    amount: item.amount,
    rej_pcs: item.rej_pcs,
    rej_cts: item.rej_cts,
    wastage_in: item.wastage_in,
    percent: item.percent,
    remark_line: item.remark_line
  }))
});

export const fetchMemos = async () => {
  const response = await supabase
    .from("memos")
    .select(
      `
      id,
      memo_no,
      process,
      lot_code,
      description,
      from_party,
      to_party,
      date_out_header,
      date_in_header,
      remark_header,
      status_locked,
      items:memo_items(
        id,
        item_no,
        out_date,
        out_grade,
        out_size,
        out_pcs,
        out_weight_1,
        out_weight_2,
        in_date,
        in_grade,
        in_size,
        in_pcs,
        in_weight_1,
        in_weight_2,
        price,
        amount,
        rej_pcs,
        rej_cts,
        wastage_in,
        percent,
        remark_line
      )
      `
    )
    .order("date_out_header", { ascending: true });

  return handleSupabase(response).map(mapMemo);
};

export const fetchInvoice = async (invoiceId = "latest") => {
  if (invoiceId !== "latest") {
    const response = await supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_no,
        sell_id,
        date,
        party,
        transaction_type,
        average_price,
        total_cts,
        total_amount,
        items:invoice_items(
          id,
          sr_no,
          lot_no,
          description,
          shape,
          size,
          grade,
          pcs,
          cts,
          price,
          amount,
          remarks
        )
        `
      )
      .eq("id", invoiceId)
      .maybeSingle();

    return mapInvoice(handleSupabase(response));
  }

  const response = await supabase
    .from("invoices")
    .select(
      `
      id,
      invoice_no,
      sell_id,
      date,
      party,
      transaction_type,
      average_price,
      total_cts,
      total_amount,
      items:invoice_items(
        id,
        sr_no,
        lot_no,
        description,
        shape,
        size,
        grade,
        pcs,
        cts,
        price,
        amount,
        remarks
      )
      `
    )
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return mapInvoice(handleSupabase(response));
};

export const fetchInventory = async () => {
  const response = await supabase
    .from("inventory_lots")
    .select("id, lot, process, stage, available_cts, status")
    .order("lot", { ascending: true });

  return handleSupabase(response).map((lot) => ({
    id: lot.id,
    lot: lot.lot,
    process: lot.process,
    stage: lot.stage,
    availableCts: lot.available_cts,
    status: lot.status
  }));
};
