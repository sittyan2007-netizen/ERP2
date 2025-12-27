import React, { useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { fetchInventory, fetchInvoice, fetchMemos } from "./api/client";

const productionStages = [
  "ACID",
  "HEAT 1",
  "HEAT 2",
  "ROUGH",
  "PREFORM",
  "CUTTING",
  "CALIBRATE"
];


const navItems = [
  { path: "/inventory", label: "Inventory / Sell Records" },
  { path: "/invoice", label: "Invoice" },
  { path: "/memos", label: "Memos" },
  { path: "/production", label: "Production" },
  { path: "/cashbook", label: "Cashbook" },
  { path: "/reports", label: "Reports" }
];

const getMemoTotals = (memo) => {
  const totalOut = memo.items.reduce((sum, item) => {
    const outWeight = item.out_weight_2 || item.out_weight_1 || 0;
    return sum + outWeight;
  }, 0);
  const totalIn = memo.items.reduce((sum, item) => {
    const inWeight = item.in_weight_1 || item.in_weight_2 || 0;
    return sum + inWeight;
  }, 0);
  const totalReject = memo.items.reduce((sum, item) => sum + (item.rej_cts || 0), 0);
  const remaining = totalOut - totalIn - totalReject;
  const yieldPercent = totalOut > 0 ? (totalIn / totalOut) * 100 : null;

  return {
    totalOut,
    totalIn,
    totalReject,
    remaining,
    yieldPercent
  };
};

const parseTransition = (process) => {
  if (!process.includes(" TO ")) {
    return { fromStage: process, toStage: process, isTransition: false };
  }
  const [fromStage, toStage] = process.split(" TO ");
  return { fromStage, toStage, isTransition: true };
};

const getLotTimeline = (memoList, lotCode) => {
  return memoList
    .filter((memo) => memo.lot_code === lotCode)
    .sort((a, b) => new Date(a.date_out_header) - new Date(b.date_out_header));
};

const getLotStage = (memoList, lotCode) => {
  const timeline = getLotTimeline(memoList, lotCode);
  if (!timeline.length) return "Unknown";
  const last = timeline[timeline.length - 1];
  const { toStage } = parseTransition(last.process);
  return toStage;
};

const getLotTotals = (memoList, lotCode) => {
  const timeline = getLotTimeline(memoList, lotCode);
  return timeline.reduce(
    (acc, memo) => {
      const totals = getMemoTotals(memo);
      return {
        totalOut: acc.totalOut + totals.totalOut,
        totalIn: acc.totalIn + totals.totalIn,
        totalReject: acc.totalReject + totals.totalReject,
        remaining: acc.remaining + totals.remaining
      };
    },
    { totalOut: 0, totalIn: 0, totalReject: 0, remaining: 0 }
  );
};

const Layout = ({ children }) => (
  <div className="app-shell">
    <header className="top-nav no-print">
      <div className="brand">Gemstone ERP</div>
      <nav className="nav-tabs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
    <main className="content">{children}</main>
  </div>
);

const InventoryPage = ({ inventoryLots, isLoading, error }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Inventory / Sell Records</h1>
        <p>Track inventory, sell records, and invoice-ready lots.</p>
      </div>
      <button className="btn btn-primary">New Sell Record</button>
    </div>
    <div className="card table-card">
      <div className="table-toolbar">
        <input className="input" placeholder="Search lot, memo, party" />
        <div className="toolbar-actions">
          <button className="btn btn-secondary">Filter</button>
          <button className="btn btn-ghost">Export</button>
        </div>
      </div>
      {isLoading && (
        <div className="empty-state">
          <p>Loading inventory lots...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="empty-state">
          <p>Unable to load inventory lots.</p>
        </div>
      )}
      {!isLoading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Lot</th>
              <th>Process</th>
              <th>Stage</th>
              <th>Available CTS</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inventoryLots.map((lot) => (
              <tr key={lot.id}>
                <td>{lot.lot}</td>
                <td>{lot.process}</td>
                <td>{lot.stage}</td>
                <td>{lot.availableCts}</td>
                <td>
                  <span
                    className={
                      lot.status === "Ready"
                        ? "badge badge-success"
                        : "badge badge-warning"
                    }
                  >
                    {lot.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost">View</button>
                </td>
              </tr>
            ))}
            {!inventoryLots.length && (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <p>No inventory lots available.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const InvoiceSheet = ({ invoice }) => {
  if (!invoice) {
    return (
      <div className="invoice-sheet">
        <div className="invoice-card">
          <div className="empty-state">
            <p>No invoice data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-sheet">
      <div className="invoice-card">
        <div className="invoice-title">INVOICE</div>
        <div className="invoice-header-grid">
          <div className="invoice-header-block">
            <div className="invoice-field">
              <span>DATE</span>
              <strong>{invoice.date}</strong>
            </div>
            <div className="invoice-field">
              <span>PARTY</span>
              <strong>{invoice.party}</strong>
            </div>
            <div className="invoice-field">
              <span>TOTAL AMOUNT</span>
              <strong>{invoice.totalAmount}</strong>
            </div>
          </div>
          <div className="invoice-header-block">
            <div className="invoice-field">
              <span>INVOICE NO</span>
              <strong>{invoice.invoiceNo}</strong>
            </div>
            <div className="invoice-field">
              <span>SELL ID</span>
              <strong>{invoice.sellId}</strong>
            </div>
            <div className="invoice-field">
              <span>AVERAGE PRICE</span>
              <strong>{invoice.averagePrice}</strong>
            </div>
          </div>
          <div className="invoice-header-block">
            <div className="invoice-field">
              <span>TRANSACTION TYPE</span>
              <strong>{invoice.transactionType}</strong>
            </div>
            <div className="invoice-field">
              <span>TOTAL CTS</span>
              <strong>{invoice.totalCts}</strong>
            </div>
          </div>
        </div>
        <table className="invoice-table">
          <thead>
            <tr>
              <th>SR NO</th>
              <th>LOT NO</th>
              <th>DESCRIPTION</th>
              <th>SHAPE</th>
              <th>SIZE</th>
              <th>GRADE</th>
              <th>PCS</th>
              <th>CTS</th>
              <th>PRICE</th>
              <th>AMOUNT</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.srNo}>
                <td>{item.srNo}</td>
                <td>{item.lotNo}</td>
                <td>{item.description}</td>
                <td>{item.shape}</td>
                <td>{item.size}</td>
                <td>{item.grade}</td>
                <td>{item.pcs}</td>
                <td>{item.cts}</td>
                <td>{item.price}</td>
                <td>{item.amount}</td>
                <td>{item.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-footer">
          <div className="invoice-footer-block">
            <span>Prepared by</span>
            <div className="signature-line"></div>
          </div>
          <div className="invoice-footer-block">
            <span>Approved by</span>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoicePage = ({ invoice, isLoading, error }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Invoice</h1>
        <p>Create, review, and print invoice sheets that match the official format.</p>
      </div>
      {invoice ? (
        <Link
          className="btn btn-primary"
          to={`/invoice/${invoice.id}/print`}
          target="_blank"
        >
          Print / Export PDF
        </Link>
      ) : (
        <button className="btn btn-primary" disabled>
          Print / Export PDF
        </button>
      )}
    </div>
    {isLoading && (
      <div className="empty-state">
        <p>Loading invoice data...</p>
      </div>
    )}
    {error && !isLoading && (
      <div className="empty-state">
        <p>Unable to load invoice data.</p>
      </div>
    )}
    {!isLoading && !error && <InvoiceSheet invoice={invoice} />}
  </div>
);

const InvoicePrintView = ({ invoice }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-view">
      <InvoiceSheet invoice={invoice} />
    </div>
  );
};

const InvoicePrintRoute = ({ invoice, isLoading, error }) => {
  const { id } = useParams();
  if (isLoading) {
    return (
      <div className="print-view">
        <div className="invoice-sheet">
          <div className="invoice-card">
            <h2>Loading invoice...</h2>
          </div>
        </div>
      </div>
    );
  }
  if (error || !invoice || id !== invoice.id) {
    return (
      <div className="print-view">
        <div className="invoice-sheet">
          <div className="invoice-card">
            <h2>Invoice not found</h2>
          </div>
        </div>
      </div>
    );
  }
  return <InvoicePrintView invoice={invoice} />;
};

const MemosPage = ({ memos, isLoading, error }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Memos</h1>
        <p>Record memo-out/in movements with immutable close actions.</p>
      </div>
      <button className="btn btn-primary">New Memo</button>
    </div>
    <div className="card table-card">
      {isLoading && (
        <div className="empty-state">
          <p>Loading memos...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="empty-state">
          <p>Unable to load memos.</p>
        </div>
      )}
      {!isLoading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Memo</th>
              <th>Process</th>
              <th>Lot</th>
              <th>Date Out</th>
              <th>Date In</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((memo) => (
              <tr key={memo.id}>
                <td>{memo.memo_no}</td>
                <td>{memo.process}</td>
                <td>{memo.lot_code}</td>
                <td>{memo.date_out_header}</td>
                <td>{memo.date_in_header}</td>
                <td>
                  {memo.status_locked ? (
                    <span className="badge badge-success">Locked</span>
                  ) : (
                    <span className="badge badge-warning">Open</span>
                  )}
                </td>
              </tr>
            ))}
            {!memos.length && (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <p>No memos available.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const StageBoard = ({ stageSummary, activeStage, onSelectStage }) => (
  <div className="stage-board">
    {productionStages.map((stage) => {
      const summary = stageSummary[stage] || { count: 0, totalOut: 0, totalIn: 0 };
      const isActive = activeStage === stage;
      return (
        <button
          key={stage}
          className={isActive ? "stage-card stage-card-active" : "stage-card"}
          onClick={() => onSelectStage(isActive ? "" : stage)}
        >
          <div className="stage-title">{stage}</div>
          <div className="stage-meta">
            <span>{summary.count} lots</span>
            <span>{summary.totalIn.toFixed(1)} cts in</span>
          </div>
        </button>
      );
    })}
  </div>
);

const ProductionPage = ({ memos, isLoading, error }) => {
  const [search, setSearch] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  React.useEffect(() => {
    if (!selectedLot && memos.length) {
      setSelectedLot(memos[0].lot_code);
    }
  }, [memos, selectedLot]);

  const lots = useMemo(() => {
    const lotList = Array.from(new Set(memos.map((memo) => memo.lot_code)));
    return lotList.map((lot) => ({
      lot,
      stage: getLotStage(memos, lot),
      updatedAt: getLotTimeline(memos, lot).slice(-1)[0]?.date_in_header
    }));
  }, [memos]);

  const stageSummary = useMemo(() => {
    return lots.reduce((acc, lot) => {
      const totals = getLotTotals(memos, lot.lot);
      if (!acc[lot.stage]) {
        acc[lot.stage] = { count: 0, totalOut: 0, totalIn: 0 };
      }
      acc[lot.stage].count += 1;
      acc[lot.stage].totalOut += totals.totalOut;
      acc[lot.stage].totalIn += totals.totalIn;
      return acc;
    }, {});
  }, [lots, memos]);

  const filteredLots = lots.filter((lot) => {
    const matchesSearch = lot.lot.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter ? lot.stage === stageFilter : true;
    return matchesSearch && matchesStage;
  });

  const timeline = selectedLot ? getLotTimeline(memos, selectedLot) : [];
  const totals = selectedLot
    ? getLotTotals(memos, selectedLot)
    : { totalOut: 0, totalIn: 0, totalReject: 0, remaining: 0 };
  const currentStage = selectedLot ? getLotStage(memos, selectedLot) : "Unknown";
  const lastUpdated = timeline.slice(-1)[0]?.date_in_header || "-";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Production</h1>
          <p>Track lots across every stage with yield, wastage, and timeline events.</p>
        </div>
        <button className="btn btn-primary">New Production Memo</button>
      </div>

      {isLoading && (
        <div className="empty-state">
          <p>Loading memo production data...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="empty-state">
          <p>Unable to load memo production data.</p>
        </div>
      )}
      {!isLoading && !error && (
        <StageBoard
          stageSummary={stageSummary}
          activeStage={stageFilter}
          onSelectStage={setStageFilter}
        />
      )}

      <div className="production-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Lot Finder</h2>
              <p>Search lots instantly and filter by current stage.</p>
            </div>
          </div>
          <div className="lot-finder">
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by lot code"
            />
            <select
              className="select"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value="">All stages</option>
              {productionStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
          <div className="lot-list">
            {filteredLots.map((lot) => (
              <button
                key={lot.lot}
                className={
                  selectedLot === lot.lot ? "lot-row lot-row-active" : "lot-row"
                }
                onClick={() => setSelectedLot(lot.lot)}
              >
                <div>
                  <div className="lot-title">{lot.lot}</div>
                  <div className="lot-meta">Updated {lot.updatedAt}</div>
                </div>
                <span className="badge badge-neutral">{lot.stage}</span>
              </button>
            ))}
            {!filteredLots.length && (
              <div className="empty-state">
                <p>No lots match the filters.</p>
                <button className="btn btn-secondary">Create Memo</button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Lot Detail</h2>
              <p>Current stage, totals, and quick actions.</p>
            </div>
            <div className="card-actions">
              <button className="btn btn-secondary">Create Memo</button>
              <button className="btn btn-ghost">Move Stage</button>
              <button className="btn btn-danger">Lock Memo</button>
            </div>
          </div>
          <div className="lot-detail">
            <div>
              <div className="lot-detail-title">{selectedLot || "-"}</div>
              <div className="lot-detail-sub">Last updated {lastUpdated}</div>
            </div>
            <span className="badge badge-success">{currentStage}</span>
          </div>
          <div className="stat-grid">
            <div className="stat-card">
              <span>OUT</span>
              <strong>{totals.totalOut.toFixed(1)} cts</strong>
            </div>
            <div className="stat-card">
              <span>IN</span>
              <strong>{totals.totalIn.toFixed(1)} cts</strong>
            </div>
            <div className="stat-card">
              <span>REJECT</span>
              <strong>{totals.totalReject.toFixed(1)} cts</strong>
            </div>
            <div className="stat-card">
              <span>REMAINING</span>
              <strong>{totals.remaining.toFixed(1)} cts</strong>
            </div>
            <div className="stat-card">
              <span>YIELD</span>
              <strong>
                {totals.totalOut > 0
                  ? `${((totals.totalIn / totals.totalOut) * 100).toFixed(1)}%`
                  : "-"}
              </strong>
            </div>
          </div>
          <div className="timeline">
            <h3>Timeline</h3>
            {timeline.map((memo) => {
              const totals = getMemoTotals(memo);
              const transition = parseTransition(memo.process);
              return (
                <div key={memo.id} className="timeline-item">
                  <div className="timeline-icon">
                    {transition.isTransition ? "→" : "•"}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      {memo.process}
                      {transition.isTransition && (
                        <span className="timeline-sub">
                          {transition.fromStage} → {transition.toStage}
                        </span>
                      )}
                    </div>
                    <div className="timeline-meta">
                      <span>{memo.date_out_header} → {memo.date_in_header}</span>
                      <span>
                        {memo.from_party} → {memo.to_party}
                      </span>
                    </div>
                    <div className="timeline-stats">
                      <span>OUT {totals.totalOut.toFixed(1)} cts</span>
                      <span>IN {totals.totalIn.toFixed(1)} cts</span>
                      <span>REJ {totals.totalReject.toFixed(1)} cts</span>
                      <span>
                        REM {totals.remaining.toFixed(1)} cts
                      </span>
                      <span>
                        YIELD{" "}
                        {totals.totalOut > 0
                          ? `${((totals.totalIn / totals.totalOut) * 100).toFixed(1)}%`
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="timeline-status">
                    {memo.status_locked ? (
                      <span className="badge badge-success">Locked</span>
                    ) : (
                      <span className="badge badge-warning">Open</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CashbookPage = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Cashbook</h1>
        <p>Immutable ledger entries with running balances.</p>
      </div>
      <button className="btn btn-primary">New Entry</button>
    </div>
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Memo</th>
            <th>Lot</th>
            <th>Process</th>
            <th>Name</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-08-22</td>
            <td>R2238</td>
            <td>AJMZ 2</td>
            <td>PREFORM TO CUTTING</td>
            <td>Ruby Traders</td>
            <td>Advance payment</td>
            <td>25,000</td>
            <td>-</td>
            <td>25,000</td>
            <td>Posted</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ReportsPage = ({ memos, isLoading, error }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Reports</h1>
        <p>Memo, process, wastage, and cashbook reports with export.</p>
      </div>
      <button className="btn btn-secondary">Export Report</button>
    </div>
    <div className="card">
      <h2>Memo Yield Summary</h2>
      {isLoading && (
        <div className="empty-state">
          <p>Loading memo reports...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="empty-state">
          <p>Unable to load memo reports.</p>
        </div>
      )}
      {!isLoading && !error && (
        <div className="report-grid">
          {memos.map((memo) => {
            const totals = getMemoTotals(memo);
            return (
              <div key={memo.id} className="report-card">
                <div className="report-title">{memo.memo_no}</div>
                <div className="report-meta">{memo.process}</div>
                <div className="report-stats">
                  <span>OUT {totals.totalOut.toFixed(1)} cts</span>
                  <span>IN {totals.totalIn.toFixed(1)} cts</span>
                  <span>REJ {totals.totalReject.toFixed(1)} cts</span>
                  <span>
                    YIELD{" "}
                    {totals.totalOut > 0
                      ? `${((totals.totalIn / totals.totalOut) * 100).toFixed(1)}%`
                      : "-"}
                  </span>
                </div>
              </div>
            );
          })}
          {!memos.length && (
            <div className="empty-state">
              <p>No memo reports available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const App = () => {
  const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [memosStatus, setMemosStatus] = useState({ loading: true, error: null });
  const [invoice, setInvoice] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState({ loading: true, error: null });
  const [inventoryLots, setInventoryLots] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState({
    loading: true,
    error: null
  });

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/production", { replace: true });
    }
  }, [navigate]);

  React.useEffect(() => {
    let isActive = true;

    const loadMemos = async () => {
      try {
        setMemosStatus({ loading: true, error: null });
        const data = await fetchMemos();
        if (isActive) {
          setMemos(data);
          setMemosStatus({ loading: false, error: null });
        }
      } catch (error) {
        if (isActive) {
          setMemos([]);
          setMemosStatus({ loading: false, error });
        }
      }
    };

    const loadInvoice = async () => {
      try {
        setInvoiceStatus({ loading: true, error: null });
        const data = await fetchInvoice();
        if (isActive) {
          setInvoice(data);
          setInvoiceStatus({ loading: false, error: null });
        }
      } catch (error) {
        if (isActive) {
          setInvoice(null);
          setInvoiceStatus({ loading: false, error });
        }
      }
    };

    const loadInventory = async () => {
      try {
        setInventoryStatus({ loading: true, error: null });
        const data = await fetchInventory();
        if (isActive) {
          setInventoryLots(data);
          setInventoryStatus({ loading: false, error: null });
        }
      } catch (error) {
        if (isActive) {
          setInventoryLots([]);
          setInventoryStatus({ loading: false, error });
        }
      }
    };

    loadMemos();
    loadInvoice();
    loadInventory();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <div className="page">
              <h1>Loading...</h1>
            </div>
          </Layout>
        }
      />
      <Route
        path="/inventory"
        element={
          <Layout>
            <InventoryPage
              inventoryLots={inventoryLots}
              isLoading={inventoryStatus.loading}
              error={inventoryStatus.error}
            />
          </Layout>
        }
      />
      <Route
        path="/invoice"
        element={
          <Layout>
            <InvoicePage
              invoice={invoice}
              isLoading={invoiceStatus.loading}
              error={invoiceStatus.error}
            />
          </Layout>
        }
      />
      <Route
        path="/invoice/:id/print"
        element={
          <InvoicePrintRoute
            invoice={invoice}
            isLoading={invoiceStatus.loading}
            error={invoiceStatus.error}
          />
        }
      />
      <Route
        path="/memos"
        element={
          <Layout>
            <MemosPage
              memos={memos}
              isLoading={memosStatus.loading}
              error={memosStatus.error}
            />
          </Layout>
        }
      />
      <Route
        path="/production"
        element={
          <Layout>
            <ProductionPage
              memos={memos}
              isLoading={memosStatus.loading}
              error={memosStatus.error}
            />
          </Layout>
        }
      />
      <Route
        path="/cashbook"
        element={
          <Layout>
            <CashbookPage />
          </Layout>
        }
      />
      <Route
        path="/reports"
        element={
          <Layout>
            <ReportsPage
              memos={memos}
              isLoading={memosStatus.loading}
              error={memosStatus.error}
            />
          </Layout>
        }
      />
    </Routes>
  );
};

export default App;
