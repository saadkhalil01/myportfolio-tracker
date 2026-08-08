function CloudSyncedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="sync-icon">
      <path
        fill="currentColor"
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        opacity="0.9"
      />
      <path
        fill="#fff"
        d="M10.3 15.7 7.8 13.2l1.1-1.1 1.4 1.4 3.7-3.7 1.1 1.1z"
      />
    </svg>
  );
}

function CloudLoadingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="sync-icon sync-icon-spin">
      <path
        fill="currentColor"
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        opacity="0.35"
      />
      <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="12 8" />
    </svg>
  );
}

function CloudErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="sync-icon">
      <path
        fill="currentColor"
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        opacity="0.9"
      />
      <path
        fill="#fff"
        d="M10.9 10.1h2.2v4.2h-2.2zm0 5.1h2.2V17h-2.2z"
      />
    </svg>
  );
}

function CloudLocalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="sync-icon">
      <path
        fill="currentColor"
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        opacity="0.55"
      />
    </svg>
  );
}

const SYNC_META = {
  synced: { label: 'Saved to cloud', Icon: CloudSyncedIcon },
  loading: { label: 'Syncing…', Icon: CloudLoadingIcon },
  error: { label: 'Cloud sync error', Icon: CloudErrorIcon },
  local: { label: 'Local only', Icon: CloudLocalIcon },
};

export default function SyncStatus({ state = 'local' }) {
  const meta = SYNC_META[state] || SYNC_META.local;
  const Icon = meta.Icon;
  return (
    <span className={`sync-pill sync-${state}`} title={meta.label} aria-label={meta.label}>
      <Icon />
    </span>
  );
}
