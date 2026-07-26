const STORAGE_KEY = 'myportfolio-data-v1';

export const DEFAULT_DATA = {
  categories: [
    { id: 'emergency', name: 'Emergency Funds', invested: 182810, currentValue: 203952 },
    { id: 'stocks', name: 'Stocks', invested: 508719, currentValue: 515910 },
    { id: 'pension', name: 'Pension Fund', invested: 25000, currentValue: 31062 },
    { id: 'funds-equity', name: 'Funds (Equity)', invested: 0, currentValue: 0 },
    { id: 'crypto', name: 'Crypto', invested: 0, currentValue: 0 },
    { id: 'real-estate', name: 'Real Estate', invested: 0, currentValue: 0 },
    { id: 'bonds', name: 'Bonds', invested: 0, currentValue: 0 },
  ],
  liabilities: [
    { id: 'home-loan', name: 'Home Loan', amount: 1525000 },
    { id: 'phuppo', name: 'Phuppo', amount: 575000 },
    { id: 'mohsan', name: 'Mohsan', amount: 400000 },
    { id: 'hassan', name: 'Hassan', amount: 200000 },
    { id: 'aiza', name: 'Aiza', amount: 200000 },
    { id: 'tayyab', name: 'Tayyab', amount: 50000 },
    { id: 'ahnaf', name: 'Ahnaf', amount: 50000 },
    { id: 'soban', name: 'Soban', amount: 50000 },
  ],
  targets: [
    { id: 'car', name: 'Car', year: 2030 },
    { id: 'house', name: 'House', year: 2035 },
  ],
  goals: [{ id: 'qurbani', name: 'Qurbani 2027', amount: 0 }],
  dividendReinvested: 9975,
  startDate: '2023-12-23',
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `myportfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

export const fmtPct = (n) =>
  `${n >= 0 ? '+' : ''}${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}%`;
