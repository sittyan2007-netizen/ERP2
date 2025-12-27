import { useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import { calculateInvoiceTotals } from '../utils/calculations';
import { InvoiceItem } from '../types/records';
import { useWriteApi } from '../lib/api';

const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  invoice_id: '',
  lot_id: null,
  description: '',
  shape: '',
  size: '',
  grade: '',
  pcs: 0,
  cts: 0,
  price: 0,
  amount: 0
});

const InvoicePage = () => {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [party, setParty] = useState('');
  const [sellId, setSellId] = useState('');
  const [transactionType, setTransactionType] = useState('Sale');
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const { post } = useWriteApi();

  const totals = useMemo(() => calculateInvoiceTotals(items), [items]);

  const updateItem = (id: string, key: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
              amount: key === 'price' || key === 'cts' ? Number(item.cts ?? 0) * Number(item.price ?? 0) : item.amount
            }
          : item
      )
    );
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);

  const clearForm = () => {
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setParty('');
    setSellId('');
    setTransactionType('Sale');
    setItems([emptyItem()]);
  };

  const handleSave = async () => {
    await post('invoice/create', {
      invoice: {
        invoice_date: invoiceDate,
        party_id: party || null,
        sell_id: sellId || null,
        transaction_type: transactionType,
        total_cts: totals.totalCts,
        total_amount: totals.totalAmount,
        avg_price: totals.avgPrice
      },
      items
    });
    clearForm();
  };

  return (
    <PageShell
      title="Invoice"
      actions={
        <>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            onClick={clearForm}
          >
            Clear
          </button>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={handleSave}
          >
            Save / Generate
          </button>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            onClick={() => window.print()}
          >
            Print
          </button>
        </>
      }
    >
      <div className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="text-xs uppercase text-slate-500">Date</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Party</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={party}
              onChange={(event) => setParty(event.target.value)}
              placeholder="Select party"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Invoice No</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value="AUTO"
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Sell ID</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={sellId}
              onChange={(event) => setSellId(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Transaction Type</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value)}
            >
              <option>Sale</option>
              <option>Return</option>
              <option>Memo Out</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Total CTS</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={totals.totalCts.toFixed(2)}
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Total Amount</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={totals.totalAmount.toFixed(2)}
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-500">Average Price</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={totals.avgPrice.toFixed(2)}
              disabled
            />
          </div>
        </div>

        <div className="mt-6 overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2">SR No</th>
                <th className="border-b border-slate-200 px-3 py-2">Lot No</th>
                <th className="border-b border-slate-200 px-3 py-2">Description</th>
                <th className="border-b border-slate-200 px-3 py-2">Shape</th>
                <th className="border-b border-slate-200 px-3 py-2">Size</th>
                <th className="border-b border-slate-200 px-3 py-2">Grade</th>
                <th className="border-b border-slate-200 px-3 py-2">PCS</th>
                <th className="border-b border-slate-200 px-3 py-2">CTS</th>
                <th className="border-b border-slate-200 px-3 py-2">Price</th>
                <th className="border-b border-slate-200 px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border-b border-slate-100 px-3 py-2">{index + 1}</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      className="w-full bg-transparent"
                      value={item.lot_id ?? ''}
                      onChange={(event) => updateItem(item.id, 'lot_id', event.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      className="w-full bg-transparent"
                      value={item.description ?? ''}
                      onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      className="w-full bg-transparent"
                      value={item.shape ?? ''}
                      onChange={(event) => updateItem(item.id, 'shape', event.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      className="w-full bg-transparent"
                      value={item.size ?? ''}
                      onChange={(event) => updateItem(item.id, 'size', event.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      className="w-full bg-transparent"
                      value={item.grade ?? ''}
                      onChange={(event) => updateItem(item.id, 'grade', event.target.value)}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      type="number"
                      className="w-full bg-transparent"
                      value={item.pcs ?? 0}
                      onChange={(event) => updateItem(item.id, 'pcs', Number(event.target.value))}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      type="number"
                      className="w-full bg-transparent"
                      value={item.cts ?? 0}
                      onChange={(event) => updateItem(item.id, 'cts', Number(event.target.value))}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <input
                      type="number"
                      className="w-full bg-transparent"
                      value={item.price ?? 0}
                      onChange={(event) => updateItem(item.id, 'price', Number(event.target.value))}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right">
                    {item.amount?.toFixed(2) ?? '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between">
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm" onClick={addRow}>
            Add Line Item
          </button>
          <div className="text-right text-sm text-slate-600">
            <div>Total CTS: {totals.totalCts.toFixed(2)}</div>
            <div>Total Amount: {totals.totalAmount.toFixed(2)}</div>
            <div>Average Price: {totals.avgPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default InvoicePage;
