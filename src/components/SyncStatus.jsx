import AppIcon from './AppIcon.jsx';

const SYNC_META = {
  synced: { label: 'Saved to cloud', icon: 'synced' },
  loading: { label: 'Syncing…', icon: 'syncing' },
  error: { label: 'Cloud sync error', icon: 'syncerror' },
  local: { label: 'Local only', icon: 'local' },
};

export default function SyncStatus({ state = 'local' }) {
  const meta = SYNC_META[state] || SYNC_META.local;
  return (
    <span className={`sync-pill sync-${state}`} title={meta.label} aria-label={meta.label}>
      <AppIcon name={meta.icon} size={16} className={`sync-icon${state === 'loading' ? ' sync-icon-spin' : ''}`} />
    </span>
  );
}
