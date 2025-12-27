import React, { useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";

const productionStages = [
  "ACID",
  "HEAT 1",
  "HEAT 2",
  "ROUGH",
  "PREFORM",
  "CUTTING",
  "CALIBRATE"
];

const memos = [
  {
    id: "memo-1",
    memo_no: "R2235",
    process: "ROUGH TO PREFORM",
    lot_code: "AJMZ 2",
    description: "Ruby rough to preform",
    from_party: "RUBY CENTER",
    to_party: "MAESOT",
    date_out_header: "2024-07-01",
    date_in_header: "2024-07-07",
    remark_header: "Priority lot",
    status_locked: true,
    items: [
      {
        id: "memo-1-item-1",
        item_no: 1,
        out_date: "2024-07-01",
        out_grade: "A",
        out_size: "3-4mm",
        out_pcs: 120,
        out_weight_1: 0,
        out_weight_2: 52.4,
        in_date: "2024-07-07",
        in_grade: "A",
        in_size: "3-4mm",
        in_pcs: 100,
        in_weight_1: 48.1,
        in_weight_2: null,
        price: 0,
        amount: 0,
        rej_pcs: 8,
        rej_cts: 1.2,
        wastage_in: 0.4,
        percent: 91.8,
        remark_line: "Cleaned"
      }
    ]
  },
  {
    id: "memo-2",
    memo_no: "R2238",
    process: "PREFORM TO CUTTING",
    lot_code: "AJMZ 2",
    description: "Preform to cutting",
    from_party: "MAESOT",
    to_party: "RUBY CENTER",
    date_out_header: "2024-07-10",
    date_in_header: "2024-07-12",
    remark_header: "",
    status_locked: false,
    items: [
      {
        id: "memo-2-item-1",
        item_no: 1,
        out_date: "2024-07-10",
        out_grade: "A",
        out_size: "3-4mm",
        out_pcs: 100,
        out_weight_1: 0,
        out_weight_2: 48.1,
        in_date: "2024-07-12",
        in_grade: "A",
        in_size: "3-4mm",
        in_pcs: 96,
        in_weight_1: 46.5,
        in_weight_2: null,
        price: 0,
        amount: 0,
        rej_pcs: 2,
        rej_cts: 0.6,
        wastage_in: 0.2,
        percent: 96.7,
        remark_line: ""
      }
    ]
  },
  {
    id: "memo-3",
    memo_no: "R2669",
    process: "HEAT 2",
    lot_code: "AJMZ 3",
    description: "Heat treatment",
    from_party: "RUBY CENTER",
    to_party: "RUBY CENTER",
    date_out_header: "2024-08-05",
    date_in_header: "2024-08-11",
    remark_header: "",
    status_locked: true,
    items: [
      {
        id: "memo-3-item-1",
        item_no: 1,
        out_date: "2024-08-05",
        out_grade: "B",
        out_size: "2-3mm",
        out_pcs: 140,
        out_weight_1: 0,
        out_weight_2: 61.8,
        in_date: "2024-08-11",
        in_grade: "B",
        in_size: "2-3mm",
        in_pcs: 128,
        in_weight_1: 58.4,
        in_weight_2: null,
        price: 0,
        amount: 0,
        rej_pcs: 5,
        rej_cts: 1.8,
        wastage_in: 0.5,
        percent: 94.5,
        remark_line: ""
      }
    ]
  }
];

const invoiceData = {
  id: "INV-2024-009",
  invoiceNo: "INV-2024-009",
  sellId: "SELL-118",
  date: "2024-08-22",
  party: "Ruby Traders Co.",
  transactionType: "Export",
  averagePrice: "1,850",
  totalCts: 94.6,
  totalAmount: "175,010",
  items: [
    {
      srNo: 1,
      lotNo: "AJMZ 2",
      description: "Ruby preform",
      shape: "Oval",
      size: "3-4mm",
      grade: "A",
      pcs: 96,
      cts: 46.5,
      price: "1,900",
      amount: "88,350",
      remarks: ""
    },
    {
      srNo: 2,
      lotNo: "AJMZ 3",
      description: "Ruby heat",
      shape: "Round",
      size: "2-3mm",
      grade: "B",
      pcs: 128,
      cts: 48.1,
      price: "1,820",
      amount: "86,660",
      remarks: "Priority"
    }
  ]
};

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

const getLotTimeline = (lotCode) => {
  return memos
    .filter((memo) => memo.lot_code === lotCode)
    .sort((a, b) => new Date(a.date_out_header) - new Date(b.date_out_header));
};

const getLotStage = (lotCode) => {
  const timeline = getLotTimeline(lotCode);
  if (!timeline.length) return "Unknown";
  const last = timeline[timeline.length - 1];
  const { toStage } = parseTransition(last.process);
  return toStage;
};

const getLotTotals = (lotCode) => {
  const timeline = getLotTimeline(lotCode);
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

const InventoryPage = () => (
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
          <tr>
            <td>AJMZ 2</td>
            <td>PREFORM TO CUTTING</td>
            <td>CUTTING</td>
            <td>46.5</td>
            <td>
              <span className="badge badge-warning">In progress</span>
            </td>
            <td>
              <button className="btn btn-ghost">View</button>
            </td>
          </tr>
          <tr>
            <td>AJMZ 3</td>
            <td>HEAT 2</td>
            <td>HEAT 2</td>
            <td>58.4</td>
            <td>
              <span className="badge badge-success">Ready</span>
            </td>
            <td>
              <button className="btn btn-ghost">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const InvoiceSheet = ({ invoice }) => (
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

const InvoicePage = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Invoice</h1>
        <p>Create, review, and print invoice sheets that match the official format.</p>
      </div>
      <Link
        className="btn btn-primary"
        to={`/invoice/${invoiceData.id}/print`}
        target="_blank"
      >
        Print / Export PDF
      </Link>
    </div>
    <InvoiceSheet invoice={invoiceData} />
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

const InvoicePrintRoute = () => {
  const { id } = useParams();
  if (id !== invoiceData.id) {
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
  return <InvoicePrintView invoice={invoiceData} />;
};

const MemosPage = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1>Memos</h1>
        <p>Record memo-out/in movements with immutable close actions.</p>
      </div>
      <button className="btn btn-primary">New Memo</button>
    </div>
    <div className="card table-card">
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
        </tbody>
      </table>
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

const ProductionPage = () => {
  const [search, setSearch] = useState("");
  const [selectedLot, setSelectedLot] = useState("AJMZ 2");
  const [stageFilter, setStageFilter] = useState("");

  const lots = useMemo(() => {
    const lotList = Array.from(new Set(memos.map((memo) => memo.lot_code)));
    return lotList.map((lot) => ({
      lot,
      stage: getLotStage(lot),
      updatedAt: getLotTimeline(lot).slice(-1)[0]?.date_in_header
    }));
  }, []);

  const stageSummary = useMemo(() => {
    return lots.reduce((acc, lot) => {
      const totals = getLotTotals(lot.lot);
      if (!acc[lot.stage]) {
        acc[lot.stage] = { count: 0, totalOut: 0, totalIn: 0 };
      }
      acc[lot.stage].count += 1;
      acc[lot.stage].totalOut += totals.totalOut;
      acc[lot.stage].totalIn += totals.totalIn;
      return acc;
    }, {});
  }, [lots]);

  const filteredLots = lots.filter((lot) => {
    const matchesSearch = lot.lot.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter ? lot.stage === stageFilter : true;
    return matchesSearch && matchesStage;
  });

  const timeline = getLotTimeline(selectedLot);
  const totals = getLotTotals(selectedLot);
  const currentStage = getLotStage(selectedLot);
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

      <StageBoard
        stageSummary={stageSummary}
        activeStage={stageFilter}
        onSelectStage={setStageFilter}
      />

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
              <div className="lot-detail-title">{selectedLot}</div>
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

const ReportsPage = () => (
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
      </div>
    </div>
  </div>
);

const App = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      navigate("/production", { replace: true });
    }
  }, [navigate]);

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
            <InventoryPage />
          </Layout>
        }
      />
      <Route
        path="/invoice"
        element={
          <Layout>
            <InvoicePage />
          </Layout>
        }
      />
      <Route path="/invoice/:id/print" element={<InvoicePrintRoute />} />
      <Route
        path="/memos"
        element={
          <Layout>
            <MemosPage />
          </Layout>
        }
      />
      <Route
        path="/production"
        element={
          <Layout>
            <ProductionPage />
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
            <ReportsPage />
          </Layout>
        }
      />
    </Routes>
  );
};

export default App;
