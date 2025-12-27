import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { supabase } from '../lib/supabaseClient';
import { useWriteApi } from '../lib/api';
import { Memo } from '../types/records';

const MemosPage = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [party, setParty] = useState('');
  const { post } = useWriteApi();

  const fetchMemos = async () => {
    const { data } = await supabase.from('memos').select('*').order('memo_date', { ascending: false });
    setMemos((data ?? []) as Memo[]);
  };

  useEffect(() => {
    void fetchMemos();
  }, []);

  const createMemo = async () => {
    await post('memo/create', {
      memo: {
        party_id: party || null,
        memo_date: new Date().toISOString().slice(0, 10)
      }
    });
    setParty('');
    await fetchMemos();
  };

  const closeMemo = async (memoId: string) => {
    await post('memo/close', { memo_id: memoId });
    await fetchMemos();
  };

  return (
    <PageShell
      title="Memo In / Memo Out"
      actions={
        <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" onClick={createMemo}>
          Create Memo
        </button>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Party ID"
            value={party}
            onChange={(event) => setParty(event.target.value)}
          />
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm" onClick={fetchMemos}>
            Refresh
          </button>
        </div>
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="border-b border-slate-200 px-3 py-2">Memo No</th>
              <th className="border-b border-slate-200 px-3 py-2">Date</th>
              <th className="border-b border-slate-200 px-3 py-2">Party</th>
              <th className="border-b border-slate-200 px-3 py-2">Status</th>
              <th className="border-b border-slate-200 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((memo, index) => (
              <tr key={memo.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border-b border-slate-100 px-3 py-2">{memo.memo_no}</td>
                <td className="border-b border-slate-100 px-3 py-2">{memo.memo_date}</td>
                <td className="border-b border-slate-100 px-3 py-2">{memo.party_id ?? '-'}</td>
                <td className="border-b border-slate-100 px-3 py-2">{memo.status}</td>
                <td className="border-b border-slate-100 px-3 py-2">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                    onClick={() => closeMemo(memo.id)}
                    disabled={memo.status === 'LOCKED'}
                  >
                    Close
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

export default MemosPage;
