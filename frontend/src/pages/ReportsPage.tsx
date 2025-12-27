import { useState } from 'react';
import PageShell from '../components/PageShell';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);

  const exportReport = async (table: string) => {
    setLoading(true);
    const { data } = await supabase.from(table).select('*');
    const worksheet = XLSX.utils.json_to_sheet(data ?? []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, table);
    XLSX.writeFile(workbook, `${table}-report.xlsx`);
    setLoading(false);
  };

  return (
    <PageShell title="Reports" actions={null}>
      <div className="grid gap-4 md:grid-cols-2">
        {['memos', 'lot_stage_events', 'ledger_entries', 'inventory_records'].map((table) => (
          <div key={table} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">{table.replace('_', ' ')}</h3>
            <p className="mt-2 text-xs text-slate-500">
              Export the latest snapshot for {table.replace('_', ' ')}.
            </p>
            <button
              className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm"
              onClick={() => exportReport(table)}
              disabled={loading}
            >
              Export XLSX
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default ReportsPage;
