import { useEffect, useMemo, useRef, useState } from 'react';
import {
  loadData,
  saveData,
  exportData,
  importData,
  DEFAULT_DATA,
  fmt,
  syncValuationHistory,
  resetData,
  storageKeyForUser,
  assetTotals,
  portfolioAssets,
  growthStats,
  pickRicherData,
  hasStocksInsights,
  syncStocksCategoryFromInsights,
  isGoldCategory,
  syncGoldCategoriesFromRate,
} from './storage.js';
import { fetchCloudPortfolio, saveCloudPortfolio } from './cloud.js';
import { usePsxQuotes, normalizeSymbol } from './psxQuotes.js';
import { useAuth } from './AuthContext.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import CategoriesTable from './components/CategoriesTable.jsx';
import ChartsPanel from './components/ChartsPanel.jsx';
import Liabilities from './components/Liabilities.jsx';
import Targets from './components/Targets.jsx';
import StocksBreakdown from './components/StocksBreakdown.jsx';
import GrowthChart from './components/GrowthChart.jsx';
import AuthBar from './components/AuthBar.jsx';
import SyncStatus from './components/SyncStatus.jsx';
import PortfolioHealth from './components/PortfolioHealth.jsx';
import { useGoldRate } from './goldRate.js';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth' },
  { id: 'investments', label: 'Investments' },
  { id: 'liabilities', label: 'Liabilities' },
  { id: 'targets', label: 'Targets' },
  { id: 'stocks', label: 'Stocks' },
];

const NAV_STORAGE_KEY = 'myportfolio-active-tab-v2';

function loadTab() {
  try {
    const saved = localStorage.getItem(NAV_STORAGE_KEY);
    if (NAV_ITEMS.some((item) => item.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'stocks';
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [data, setData] = useState(() => loadData(null));
  const [tab, setTab] = useState(loadTab);
  const [resetStep, setResetStep] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState('');
  const [syncState, setSyncState] = useState('local'); // local | loading | synced | error
  const [syncError, setSyncError] = useState('');
  const fileInputRef = useRef(null);

  // Monotonic token so stale async cloud/bootstrap work cannot overwrite newer state
  const epochRef = useRef(0);
  const cloudReady = useRef(false);
  const pauseCloudSave = useRef(false);
  const saveTimer = useRef(null);
  const skipHistorySync = useRef(false);

  // Load per-account data when auth user changes
  useEffect(() => {
    if (authLoading) return undefined;

    const epoch = ++epochRef.current;
    cloudReady.current = false;
    skipHistorySync.current = true;
    pauseCloudSave.current = true;

    async function bootstrap() {
      if (!userId) {
        if (epoch !== epochRef.current) return;
        setData(loadData(null));
        setSyncState('local');
        setSyncError('');
        pauseCloudSave.current = false;
        return;
      }

      setSyncState('loading');
      setSyncError('');

      try {
        const cloud = await fetchCloudPortfolio(userId);
        if (epoch !== epochRef.current) return;

        // Guest + account local often have cash/holdings that a stale cloud row dropped.
        // Always pick the richest snapshot so totals don't flash 716 → 706 on sign-in.
        const guest = localStorage.getItem(storageKeyForUser(null)) ? loadData(null) : null;
        const userLocal = localStorage.getItem(storageKeyForUser(userId))
          ? loadData(userId)
          : null;
        const merged = pickRicherData(cloud, userLocal, guest);

        saveData(merged, userId);
        setData(merged);
        await saveCloudPortfolio(userId, merged);
        if (epoch !== epochRef.current) return;

        cloudReady.current = true;
        setSyncState('synced');
      } catch (err) {
        if (epoch !== epochRef.current) return;
        const guest = localStorage.getItem(storageKeyForUser(null)) ? loadData(null) : null;
        const userLocal = localStorage.getItem(storageKeyForUser(userId))
          ? loadData(userId)
          : null;
        setData(pickRicherData(userLocal, guest));
        cloudReady.current = true;
        setSyncState('error');
        setSyncError(err.message || 'Cloud sync failed');
      } finally {
        if (epoch === epochRef.current) pauseCloudSave.current = false;
      }
    }

    bootstrap();
  }, [userId, authLoading]);

  // Local save always; cloud save when signed in
  useEffect(() => {
    saveData(data, userId);

    if (!userId || !cloudReady.current || pauseCloudSave.current) return undefined;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    const epoch = epochRef.current;
    const snapshot = data;

    saveTimer.current = setTimeout(async () => {
      if (epoch !== epochRef.current || pauseCloudSave.current) return;
      try {
        await saveCloudPortfolio(userId, snapshot);
        if (epoch !== epochRef.current) return;
        setSyncState('synced');
        setSyncError('');
      } catch (err) {
        if (epoch !== epochRef.current) return;
        setSyncState('error');
        setSyncError(err.message || 'Cloud save failed');
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, userId]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, tab);
  }, [tab]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const [quoteRefreshKey, setQuoteRefreshKey] = useState(0);
  const stockSymbols = useMemo(
    () =>
      (data.portfolios || []).flatMap((p) =>
        (p.holdings || []).map((h) => normalizeSymbol(h.name)).filter((s) => s.length >= 2)
      ),
    [data.portfolios]
  );
  const { quotes, status: quoteStatus, updatedAt: quoteUpdatedAt } = usePsxQuotes(stockSymbols, {
    refreshKey: quoteRefreshKey,
  });
  const stocksLinked = hasStocksInsights(data.portfolios);
  const hasGold = data.categories.some(isGoldCategory);
  const {
    perTola24kPkr: goldRatePerTola,
    perGram24kPkr: goldRatePerGram,
    status: goldRateStatus,
    updatedAt: goldRateUpdatedAt,
  } = useGoldRate(hasGold);

  // Investments "Stock" current value ← Stocks insights market total
  useEffect(() => {
    if (!stocksLinked) return;
    setData((prev) => syncStocksCategoryFromInsights(prev, quotes));
  }, [data.portfolios, quotes, stocksLinked]);

  // Re-sync whenever Gold rows appear/change so new categories get 1 tola + live value
  const goldSyncKey = data.categories
    .filter(isGoldCategory)
    .map((c) => `${c.id}:${c.goldQuantity ?? ''}:${c.goldUnit ?? ''}`)
    .join('|');

  useEffect(() => {
    if (goldRateStatus !== 'ready') return;
    setData((prev) =>
      syncGoldCategoriesFromRate(prev, {
        perTola24kPkr: goldRatePerTola,
        perGram24kPkr: goldRatePerGram,
      })
    );
  }, [goldRatePerTola, goldRatePerGram, goldRateStatus, goldSyncKey]);

  const totals = useMemo(() => {
    const assets = assetTotals(data, quotes);
    const profit = assets.valuation - assets.invested;
    const changePct = assets.invested > 0 ? (profit / assets.invested) * 100 : 0;
    return {
      invested: assets.invested,
      currentValue: assets.valuation,
      profit,
      changePct,
      categoriesValue: assets.categoriesValue,
      stocksValue: assets.stocksValue,
      stocksFromInsights: assets.stocksFromInsights,
    };
  }, [data.categories, data.portfolios, quotes]);

  useEffect(() => {
    if (skipHistorySync.current) {
      skipHistorySync.current = false;
      return;
    }
    setData((prev) => syncValuationHistory(prev, quotes));
  }, [totals.currentValue, totals.invested, data.startDate, quotes]);

  const liabilitiesTotal = useMemo(
    () => data.liabilities.reduce((s, l) => s + Number(l.amount || 0), 0),
    [data.liabilities]
  );

  const availableFunds = useMemo(() => {
    // Non-stock categories (ex pension) + Stocks insights total (once)
    const categoriesExPension = data.categories
      .filter(
        (c) =>
          c.id !== 'pension' &&
          !/pension/i.test(c.name || '') &&
          c.id !== 'stocks' &&
          !/^stocks?$/i.test(String(c.name || '').trim())
      )
      .reduce((s, c) => s + Number(c.currentValue || 0), 0);
    if (stocksLinked) return categoriesExPension + totals.stocksValue;
    return categoriesExPension + portfolioAssets(data.portfolios);
  }, [data.categories, data.portfolios, stocksLinked, totals.stocksValue]);

  const growth = useMemo(
    () => growthStats(data.valuationHistory),
    [data.valuationHistory]
  );

  // Portfolio value from Investments tab current totals
  const portfolioValue = totals.currentValue;

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      skipHistorySync.current = true;
      epochRef.current += 1;
      setData(syncValuationHistory({ ...structuredClone(DEFAULT_DATA), ...imported }));
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  };

  const performReset = async () => {
    setResetting(true);
    setSyncError('');

    // Invalidate any in-flight bootstrap / cloud saves
    const epoch = ++epochRef.current;
    pauseCloudSave.current = true;
    cloudReady.current = false;
    skipHistorySync.current = true;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    try {
      // Clear guest + account local caches so nothing reloads old edits
      localStorage.removeItem(storageKeyForUser(null));
      if (userId) localStorage.removeItem(storageKeyForUser(userId));

      const fresh = resetData(userId);
      saveData(fresh, userId);
      setData(fresh);
      setResetStep(0);

      if (userId) {
        setSyncState('loading');
        // Upsert defaults directly (more reliable than delete-then-insert)
        await saveCloudPortfolio(userId, fresh);
        if (epoch !== epochRef.current) return;
        cloudReady.current = true;
        setSyncState('synced');
      } else {
        setSyncState('local');
      }

      setToast('Reset complete — all amounts set to 0');
    } catch (err) {
      if (epoch !== epochRef.current) return;
      setSyncState('error');
      setSyncError(err.message || 'Reset failed to sync to cloud');
      setToast('Reset applied locally, but cloud sync failed');
      cloudReady.current = Boolean(userId);
    } finally {
      if (epoch === epochRef.current) {
        pauseCloudSave.current = false;
        setResetting(false);
      }
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 42 36" aria-hidden="true">
            <path d="M3 30V6l8-3 10 10L31 3l8 3v24l-7 3V13L21 24 10 13v20z" fill="currentColor" />
          </svg>
          <div>
            <h1>MyPortfolio</h1>
            <p className="tagline">
              Portfolio ID: <strong>MP-{String(Math.round(portfolioValue || 782400)).slice(0, 6)}KL</strong>
              <span className="tagline-date">since{' '}
              {new Date(data.startDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' · '}<SyncStatus state={syncState} /></span>
            </p>
          </div>
        </div>
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
        <div className="topbar-actions">
          <AuthBar
            onExport={() => exportData(data)}
            onImport={() => fileInputRef.current?.click()}
            onReset={() => setResetStep(1)}
            resetting={resetting}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImport}
          />
        </div>
      </header>

      {syncError ? <p className="sync-error-banner">{syncError}</p> : null}
      {toast ? <p className="toast-banner">{toast}</p> : null}

      <main className="page">
        {tab === 'overview' && (
          <div className="page-stack">
            <SummaryCards data={data} totals={totals} onChange={setData} />
            <ChartsPanel
              categories={data.categories}
              totals={totals}
              liabilitiesTotal={liabilitiesTotal}
              chartStyles={data.chartStyles}
              onChangeStyles={(chartStyles) =>
                setData((prev) => ({ ...prev, chartStyles }))
              }
            />
            <PortfolioHealth
              categories={data.categories}
              totals={totals}
              liabilitiesTotal={liabilitiesTotal}
            />
          </div>
        )}

        {tab === 'growth' && (
          <GrowthChart
            history={data.valuationHistory}
            startDate={data.startDate}
            currentValue={totals.currentValue}
            invested={totals.invested}
            onChange={(valuationHistory) =>
              setData((prev) =>
                syncValuationHistory({ ...prev, valuationHistory }, quotes)
              )
            }
          />
        )}

        {tab === 'investments' && (
          <CategoriesTable
            categories={data.categories}
            stocksLinked={stocksLinked}
            goldRatePerTola={goldRatePerTola}
            goldRatePerGram={goldRatePerGram}
            goldRateStatus={goldRateStatus}
            goldRateUpdatedAt={goldRateUpdatedAt}
            onChange={(categories) => setData((prev) => ({ ...prev, categories }))}
          />
        )}

        {tab === 'liabilities' && (
          <Liabilities
            liabilities={data.liabilities}
            onChange={(liabilities) => setData((prev) => ({ ...prev, liabilities }))}
          />
        )}

        {tab === 'targets' && (
          <Targets
            targets={data.targets}
            availableFunds={availableFunds}
            onChange={(targets) => setData((prev) => ({ ...prev, targets }))}
          />
        )}

        {tab === 'stocks' && (
          <StocksBreakdown
            portfolios={data.portfolios}
            quotes={quotes}
            quoteStatus={quoteStatus}
            quoteUpdatedAt={quoteUpdatedAt}
            onChange={(portfolios) => setData((prev) => ({ ...prev, portfolios }))}
            onRefreshQuotes={() => setQuoteRefreshKey((k) => k + 1)}
          />
        )}
      </main>

      <footer className="footer">
        {userId
          ? 'Signed in — data syncs to your Supabase account across devices.'
          : 'Sign in with Google to sync your portfolio to the cloud. Until then, data stays in this browser.'}
      </footer>

      {resetStep > 0 && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !resetting && setResetStep(0)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-title">{resetStep === 1 ? 'Reset all data?' : 'Confirm reset'}</h2>
            <p>
              {resetStep === 1
                ? 'This sets every amount back to 0 and clears history points, stock holdings, and cash.'
                : 'This cannot be undone. Cloud and local data for this account will be replaced with zeros.'}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                disabled={resetting}
                onClick={() => setResetStep(0)}
              >
                Cancel
              </button>
              {resetStep === 1 ? (
                <button
                  type="button"
                  className="btn btn-danger-solid"
                  disabled={resetting}
                  onClick={() => setResetStep(2)}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger-solid"
                  disabled={resetting}
                  onClick={performReset}
                >
                  {resetting ? 'Resetting…' : 'Yes, reset'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
