import * as XLSX from 'xlsx';

export interface ImportPayload {
  tables: Record<string, unknown[]>;
  unmappedSheets: string[];
}

const normalizeSheetName = (name: string) => name.trim().toLowerCase();

export const parseWorkbook = async (file: File): Promise<ImportPayload> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const tables: Record<string, unknown[]> = {};
  const unmappedSheets: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
    const normalized = normalizeSheetName(sheetName);

    switch (normalized) {
      case 'inventory':
      case 'inventory records':
      case 'inventory_records':
        tables.inventory_records = json;
        break;
      case 'sell':
      case 'sell records':
      case 'sell_records':
        tables.sell_records = json;
        break;
      case 'invoice':
      case 'invoices':
        tables.invoices = json;
        break;
      case 'invoice items':
      case 'invoice_items':
        tables.invoice_items = json;
        break;
      case 'memos':
      case 'memo':
        tables.memos = json;
        break;
      case 'memo items':
      case 'memo_items':
        tables.memo_items = json;
        break;
      case 'lots':
        tables.lots = json;
        break;
      case 'parties':
        tables.parties = json;
        break;
      case 'production':
      case 'lot stage events':
      case 'lot_stage_events':
        tables.lot_stage_events = json;
        break;
      case 'ledger':
      case 'cashbook':
      case 'ledger_entries':
        tables.ledger_entries = json;
        break;
      default:
        if (json.length) {
          unmappedSheets.push(sheetName);
        }
        break;
    }
  });

  return { tables, unmappedSheets };
};
