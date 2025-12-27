import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { supabase } from '../lib/supabaseClient';
import { useWriteApi } from '../lib/api';
import { LotStageEvent } from '../types/records';

const ProductionPage = () => {
  const [events, setEvents] = useState<LotStageEvent[]>([]);
  const [lotId, setLotId] = useState('');
  const [stage, setStage] = useState('Cutting');
  const { post } = useWriteApi();

  const fetchEvents = async () => {
    const { data } = await supabase.from('lot_stage_events').select('*').order('event_date', { ascending: false });
    setEvents((data ?? []) as LotStageEvent[]);
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const addEvent = async () => {
    await post('production/add-stage-event', {
      event: {
        lot_id: lotId,
        stage,
        event_date: new Date().toISOString().slice(0, 10)
      }
    });
    setLotId('');
    await fetchEvents();
  };

  return (
    <PageShell
      title="Production Tracking"
      actions={
        <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" onClick={addEvent}>
          Add Stage Event
        </button>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="w-60 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Lot ID"
            value={lotId}
            onChange={(event) => setLotId(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option>Acid</option>
            <option>Heat</option>
            <option>Rough</option>
            <option>Preform</option>
            <option>Cutting</option>
          </select>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm" onClick={fetchEvents}>
            Refresh
          </button>
        </div>
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="border-b border-slate-200 px-3 py-2">Lot</th>
              <th className="border-b border-slate-200 px-3 py-2">Stage</th>
              <th className="border-b border-slate-200 px-3 py-2">Date</th>
              <th className="border-b border-slate-200 px-3 py-2">Yield</th>
              <th className="border-b border-slate-200 px-3 py-2">Reject</th>
              <th className="border-b border-slate-200 px-3 py-2">Wastage</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border-b border-slate-100 px-3 py-2">{event.lot_id}</td>
                <td className="border-b border-slate-100 px-3 py-2">{event.stage}</td>
                <td className="border-b border-slate-100 px-3 py-2">{event.event_date}</td>
                <td className="border-b border-slate-100 px-3 py-2">{event.yield_cts ?? '-'}</td>
                <td className="border-b border-slate-100 px-3 py-2">{event.reject_cts ?? '-'}</td>
                <td className="border-b border-slate-100 px-3 py-2">{event.wastage_cts ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default ProductionPage;
