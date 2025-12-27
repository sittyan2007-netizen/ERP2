import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import StatCard from '../components/StatCard';
import FilterChip from '../components/FilterChip';
import { supabase } from '../lib/supabaseClient';
import { useWriteApi } from '../lib/api';
import { InventoryRecord } from '../types/records';
import { calculateInventorySummary } from '../utils/calculations';
import { parseWorkbook } from '../utils/importWorkbook';

const categoryTabs = ['ALL', 'CALIP', 'ROUND', 'FANCY'];

const InventoryPage = () => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { post } = useWriteApi();

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory_records').select('*').order('record_date', {
      ascending: false
    });
    if (error) {
      console.error(error);
    } else {
      setRecords((data ?? []) as InventoryRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchRecords();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesCategory =
        category === 'ALL' ||
        record.format?.toLowerCase() === category.toLowerCase() ||
        record.shape?.toLowerCase() === category.toLowerCase();

      if (!matchesCategory) return false;
      if (!query) return true;
      return [
        record.sell_id,
        record.description,
        record.format,
        record.shape,
        record.size,
        record.status
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [records, search, category]);

  const summary = calculateInventorySummary(filtered);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleSellSelected = async () => {
    if (!selectedIds.size) return;
    await post('sell/create', { inventory_ids: Array.from(selectedIds) });
    clearSelection();
    await fetchRecords();
  };

  const handleImport = async (file: File) => {
    const payload = await parseWorkbook(file);
    await post('import/bulk', payload);
    await fetchRecords();
  };

  const handleExport = async () => {
    const { utils, writeFileXLSX } = await import('xlsx');
    const worksheet = utils.json_to_sheet(records);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Inventory');
    writeFileXLSX(workbook, 'inventory-export.xlsx');
  };

  return (
    <PageShell
      title="Inventory / Sell Records"
      actions={
        <>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            onClick={fetchRecords}
          >
            Refresh
          </button>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            onClick={clearSelection}
          >
            Clear Selection
          </button>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={handleSellSelected}
          >
            Sell Selected
          </button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Record Count" value={String(summary.recordCount)} />
        <StatCard label="Remaining Inventory (CTS)" value={summary.remainingCts.toFixed(2)} />
        <StatCard label="Remaining Amount" value={summary.remainingAmount.toFixed(2)} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <FilterChip
                key={tab}
                label={tab}
                active={category === tab}
                onClick={() => setCategory(tab)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="w-60 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search records..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
              Import Workbook
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImport(file);
                  }
                }}
              />
            </label>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
              onClick={handleExport}
            >
              Export XLSX
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="sticky left-0 border-b border-slate-200 px-3 py-2">Select</th>
                <th className="border-b border-slate-200 px-3 py-2">Sell ID</th>
                <th className="border-b border-slate-200 px-3 py-2">Date</th>
                <th className="border-b border-slate-200 px-3 py-2">Format</th>
                <th className="border-b border-slate-200 px-3 py-2">Shape</th>
                <th className="border-b border-slate-200 px-3 py-2">Size</th>
                <th className="border-b border-slate-200 px-3 py-2">Description</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right">CTS</th>
                <th className="border-b border-slate-200 px-3 py-2 text-right">Amount</th>
                <th className="border-b border-slate-200 px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr
                  key={record.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  <td className="sticky left-0 border-b border-slate-100 bg-inherit px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={() => toggleSelection(record.id)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.sell_id ?? '-'}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.record_date}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.format ?? '-'}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.shape ?? '-'}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.size ?? '-'}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.description ?? '-'}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right">
                    {record.cts?.toFixed(2) ?? '-'}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right">
                    {record.amount?.toFixed(2) ?? '-'}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">{record.status ?? 'OPEN'}</td>
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={10}>
                    No records found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={10}>
                    Loading inventory...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default InventoryPage;
