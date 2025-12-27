import { InventoryRecord, InvoiceItem } from '../types/records';

export const sumBy = <T>(items: T[], getValue: (item: T) => number | null | undefined) => {
  return items.reduce((total, item) => total + (getValue(item) ?? 0), 0);
};

export const calculateInventorySummary = (records: InventoryRecord[]) => {
  const remainingRecords = records.filter((record) => record.status !== 'SOLD');
  const remainingCts = sumBy(remainingRecords, (record) => record.cts);
  const remainingAmount = sumBy(remainingRecords, (record) => record.amount);

  return {
    recordCount: records.length,
    remainingCts,
    remainingAmount
  };
};

export const calculateInvoiceTotals = (items: InvoiceItem[]) => {
  const totalCts = sumBy(items, (item) => item.cts);
  const totalAmount = sumBy(items, (item) => item.amount);
  const avgPrice = totalCts ? totalAmount / totalCts : 0;

  return { totalCts, totalAmount, avgPrice };
};
