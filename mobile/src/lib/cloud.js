import { supabase } from './supabase';
import { emptyData, normalizeData } from './model.mjs';
import { SyncConflict } from './sync.mjs';

export function remotePortfolio(userId) {
  return {
    empty: emptyData,
    async read() {
      const { data, error } = await supabase.from('user_portfolios')
        .select('data, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { data: normalizeData(data.data), version: data.updated_at } : null;
    },
    async write(data, baseVersion) {
      const updated_at = new Date(Math.max(Date.now(), Date.parse(baseVersion || '') + 1 || 0)).toISOString();
      const table = supabase.from('user_portfolios');
      const query = baseVersion === null
        ? table.insert({ user_id: userId, data, updated_at })
        : table.update({ data, updated_at }).eq('user_id', userId).eq('updated_at', baseVersion);
      const result = await query.select('updated_at').maybeSingle();
      if (result.error?.code === '23505' || (!result.error && !result.data)) throw new SyncConflict();
      if (result.error) throw result.error;
      return result.data.updated_at;
    },
  };
}
