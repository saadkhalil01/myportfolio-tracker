import { useEffect, useMemo, useRef, useState } from 'react';
import {
  loadData,
  saveData,
  exportData,
  importData,
  DEFAULT_DATA,
  fmt,
  syncValuationHistory,
} from './storage.js';
import SummaryCards from './components/SummaryCards.jsx';
import CategoriesTable from './components/CategoriesTable.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import Liabilities from './components/Liabilities.jsx';
import Targets from './components/Targets.jsx';
import StocksBreakdown from './components/StocksBreakdown.jsx';
import GrowthChart from './components/GrowthChart.jsx';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth' },
  { id: 'investments', label: 'Investments' },
  { id: 'liabilities', label: 'Liabilities' },
  { id: 'targets', label: 'Targets' },
  { id: 'stocks', label: 'Stocks' },
];

const NAV_STORAGE_KEY = 'myportfolio-active-tab';

function loadTab() {
  try {
    const saved = localStorage.getItem(NAV_STORAGE_KEY);
    if (NAV_ITEMS.some((item) => item.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'overview';
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState(loadTab);
  const fileInputRef = useRef(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, tab);
  }, [tab]);

  const totals = useMemo(() => {
    const invested = data.categories.reduce((s, c) => s + Number(c.invested || 0), 0);
    const currentValue = data.categories.reduce((s, c) => s + Number(c.currentValue || 0), 0);
    const profit = currentValue - invested;
    const changePct = invested > 0 ? (profit / invested) * 100 : 0;
    return { invested, currentValue, profit, changePct };
  }, [data.categories]);

  useEffect(() => {
    setData((prev) => syncValuationHistory(prev));
  }, [totals.currentValue, totals.invested, data.startDate]);

  const liabilitiesTotal = useMemo(
    () => data.liabilities.reduce((s, l) => s + Number(l.amount || 0), 0),
    [data.liabilities]
  );

  const availableFunds = useMemo(
    () =>
      data.categories
        .filter((c) => c.id !== 'pension' && !/pension/i.test(c.name || ''))
        .reduce((s, c) => s + Number(c.currentValue || 0), 0),
    [data.categories]
  );

  const netWorth = totals.currentValue - liabilitiesTotal;

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      setData(syncValuationHistory({ ...structuredClone(DEFAULT_DATA), ...imported }));
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (!confirm('Reset all data back to the original sheet values?')) return;
    if (!confirm('This cannot be undone. Are you sure you want to reset?')) return;
    setData(syncValuationHistory(structuredClone(DEFAULT_DATA)));
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            M
          </div>
          <div>
            <h1>MyPortfolio</h1>
            <p className="tagline">
              Net worth{' '}
              <strong className={netWorth >= 0 ? 'positive' : 'negative'}>{fmt(netWorth)}</strong>
              {' · '}since{' '}
              {new Date(data.startDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => exportData(data)}>
            Export
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <button className="btn btn-danger" onClick={handleReset}>
            Reset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImport}
          />
        </div>
      </header>

      <nav className="navbar" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link${tab === item.id ? ' active' : ''}`}
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="page">
        {tab === 'overview' && (
          <div className="page-stack">
            <SummaryCards data={data} totals={totals} onChange={setData} />
            <ChartsPanel
              categories={data.categories}
              totals={totals}
              liabilitiesTotal={liabilitiesTotal}
              chartStyles={data.chartStyles}
              onChangeStyles={(chartStyles) => setData({ ...data, chartStyles })}
            />
          </div>
        )}

        {tab === 'growth' && (
          <GrowthChart
            history={data.valuationHistory}
            startDate={data.startDate}
            onChange={(valuationHistory) =>
              setData(syncValuationHistory({ ...data, valuationHistory }))
            }
          />
        )}

        {tab === 'investments' && (
          <CategoriesTable
            categories={data.categories}
            onChange={(categories) => setData({ ...data, categories })}
          />
        )}

        {tab === 'liabilities' && (
          <Liabilities
            liabilities={data.liabilities}
            onChange={(liabilities) => setData({ ...data, liabilities })}
          />
        )}

        {tab === 'targets' && (
          <Targets
            targets={data.targets}
            availableFunds={availableFunds}
            onChange={(targets) => setData({ ...data, targets })}
          />
        )}

        {tab === 'stocks' && (
          <StocksBreakdown
            portfolios={data.portfolios}
            onChange={(portfolios) => setData({ ...data, portfolios })}
          />
        )}
      </main>

      <footer className="footer">
        Data is saved automatically in this browser. Use Export to back it up.
      </footer>
    </div>
  );
}
