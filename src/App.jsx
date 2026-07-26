import { useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData, exportData, importData, DEFAULT_DATA, fmt } from './storage.js';
import SummaryCards from './components/SummaryCards.jsx';
import CategoriesTable from './components/CategoriesTable.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import Liabilities from './components/Liabilities.jsx';
import Targets from './components/Targets.jsx';

export default function App() {
  const [data, setData] = useState(loadData);
  const fileInputRef = useRef(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const totals = useMemo(() => {
    const invested = data.categories.reduce((s, c) => s + Number(c.invested || 0), 0);
    const currentValue = data.categories.reduce((s, c) => s + Number(c.currentValue || 0), 0);
    const profit = currentValue - invested;
    const changePct = invested > 0 ? (profit / invested) * 100 : 0;
    return { invested, currentValue, profit, changePct };
  }, [data.categories]);

  const liabilitiesTotal = useMemo(
    () => data.liabilities.reduce((s, l) => s + Number(l.amount || 0), 0),
    [data.liabilities]
  );

  const netWorth = totals.currentValue - liabilitiesTotal;

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      setData({ ...structuredClone(DEFAULT_DATA), ...imported });
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('Reset all data back to the original sheet values?')) {
      setData(structuredClone(DEFAULT_DATA));
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>MyPortfolio</h1>
          <p className="tagline">
            Net worth{' '}
            <strong className={netWorth >= 0 ? 'positive' : 'negative'}>{fmt(netWorth)}</strong>
            {' · '}since {new Date(data.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
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

      <SummaryCards data={data} totals={totals} onChange={setData} />

      <ChartsPanel
        categories={data.categories}
        totals={totals}
        liabilitiesTotal={liabilitiesTotal}
      />

      <section className="main-grid">
        <CategoriesTable
          categories={data.categories}
          onChange={(categories) => setData({ ...data, categories })}
        />
        <div className="side-column">
          <Liabilities
            liabilities={data.liabilities}
            onChange={(liabilities) => setData({ ...data, liabilities })}
          />
          <Targets
            targets={data.targets}
            goals={data.goals}
            onChangeTargets={(targets) => setData({ ...data, targets })}
            onChangeGoals={(goals) => setData({ ...data, goals })}
          />
        </div>
      </section>

      <footer className="footer">
        Data is saved automatically in this browser. Use Export to back it up.
      </footer>
    </div>
  );
}
