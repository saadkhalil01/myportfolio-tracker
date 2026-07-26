import { supabase, isSupabaseConfigured } from './supabase.js';
import { hydrateData } from './storage.js';

export async function fetchCloudPortfolio(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('user_portfolios')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.data) return null;
  return hydrateData(data.data);
}

export async function saveCloudPortfolio(userId, portfolio) {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase.from('user_portfolios').upsert(
    {
      user_id: userId,
      data: portfolio,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

export async function clearCloudPortfolio(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase.from('user_portfolios').delete().eq('user_id', userId);
  if (error) throw error;
}
