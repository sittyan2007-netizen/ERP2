import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { supabase } from '../lib/supabaseClient';
import { useWriteApi } from '../lib/api';
import { LedgerEntry } from '../types/records';

const CashbookPage = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState('Credit');
  const { post } = useWriteApi();

  const fetchEntries = async () => {
    const { data } = await supabase.from('ledger_entries').select('*').order('entry_date', { ascending: false });
    setEntries((data ?? []) as LedgerEntry[]);
  };

  useEffect(() => {
    void fetchEntries();
  }, []);

  const createEntry = async () => {
    await post('ledger/create', {
      entry: {
        entry_date: new Date().toISOString().slice(0, 10),
        entry_type: entryType,
        amount: Number(amount)
      }
    });
    setAmount('');
    await fetchEntries();
  };

  const postEntry = async (entryId: string) => {
    await post('ledger/post', { entry_id: entryId });
    await fetchEntries();
  };

  return (
    <PageShell
      title="Cashbook / Ledger"
      actions={
        <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" onClick={createEntry}>
          Add Entry
        </button>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={entryType}
            onChange={(event) => setEntryType(event.target.value)}
          >
            <option>Credit</option>
            <option>Debit</option>
          </select>
          <input
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm" onClick={fetchEntries}>
            Refresh
          </button>
        </div>
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="border-b border-slate-200 px-3 py-2">Date</th>
              <th className="border-b border-slate-200 px-3 py-2">Type</th>
              <th className="border-b border-slate-200 px-3 py-2">Amount</th>
              <th className="border-b border-slate-200 px-3 py-2">Status</th>
              <th className="border-b border-slate-200 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border-b border-slate-100 px-3 py-2">{entry.entry_date}</td>
                <td className="border-b border-slate-100 px-3 py-2">{entry.entry_type}</td>
                <td className="border-b border-slate-100 px-3 py-2">{entry.amount}</td>
                <td className="border-b border-slate-100 px-3 py-2">{entry.status}</td>
                <td className="border-b border-slate-100 px-3 py-2">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => postEntry(entry.id)}
                    disabled={entry.status === 'POSTED'}
                  >
                    Post
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default CashbookPage;
