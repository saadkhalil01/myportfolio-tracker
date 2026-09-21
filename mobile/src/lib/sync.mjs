export class SyncConflict extends Error {
  constructor() {
    super('Your portfolio changed on another device. Your mobile changes are saved here. Load the cloud copy to discard them, or keep them until you reconcile the changes.');
    this.name = 'SyncConflict';
  }
}

// A failed initial read never grants permission to overwrite the cloud record.
export async function synchronize(local, remote, { replaceLocal = false } = {}) {
  const cloud = await remote.read();
  if (replaceLocal || !local.dirty) {
    return {
      data: cloud?.data ?? remote.empty(),
      baseVersion: cloud?.version ?? null, dirty: false,
    };
  }
  if (local.baseVersion !== (cloud?.version ?? null)) throw new SyncConflict();
  const version = await remote.write(local.data, local.baseVersion);
  return { data: local.data, baseVersion: version, dirty: false };
}
