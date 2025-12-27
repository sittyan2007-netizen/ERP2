import { Navigate, Route, Routes } from 'react-router-dom';
import TopNav from './components/TopNav';
import PasscodeModal from './components/PasscodeModal';
import { PasscodeProvider } from './contexts/PasscodeContext';
import InventoryPage from './pages/InventoryPage';
import InvoicePage from './pages/InvoicePage';
import MemosPage from './pages/MemosPage';
import ProductionPage from './pages/ProductionPage';
import CashbookPage from './pages/CashbookPage';
import ReportsPage from './pages/ReportsPage';

const App = () => {
  return (
    <PasscodeProvider>
      <div className="min-h-screen bg-slate-150">
        <TopNav />
        <PasscodeModal />
        <Routes>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/invoice" element={<InvoicePage />} />
          <Route path="/memos" element={<MemosPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/cashbook" element={<CashbookPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </PasscodeProvider>
  );
};

export default App;
