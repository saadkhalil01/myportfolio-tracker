import { useState } from 'react';
import { Text, View } from 'react-native';
import { styles as s } from '../theme';
import { Button, Field } from './UI';
import PortfolioCard from './PortfolioCard';
import EmptyState from './EmptyState';

export default function Holdings({ portfolios, quotes, edit, disabled }) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = portfolios.flatMap((portfolio) => {
    if (!query || `${portfolio.name} ${portfolio.broker}`.toLowerCase().includes(query)) return [portfolio];
    const holdings = portfolio.holdings.filter((holding) => holding.name.toLowerCase().includes(query));
    return holdings.length ? [{ ...portfolio, holdings }] : [];
  });
  return <>
    <View style={s.between}>
      <Text style={[s.muted, s.grow]}>{portfolios.length} portfolios · {portfolios.reduce((sum, p) => sum + p.holdings.length, 0)} holdings</Text>
      <Button title="+ Portfolio" disabled={disabled} onPress={() => edit({ kind: 'portfolio' })} />
    </View>
    {!!portfolios.length && <Field label="Search holdings" placeholder="Symbol, portfolio or broker" value={search}
      onChangeText={setSearch} autoCapitalize="none" returnKeyType="search" clearButtonMode="while-editing" />}
    {filtered.map((portfolio) => <PortfolioCard key={portfolio.id} portfolio={portfolio}
      originalPortfolio={portfolios.find((item) => item.id === portfolio.id)} quotes={quotes} edit={edit} disabled={disabled} />)}
    {!portfolios.length && <View style={s.card}><EmptyState icon="stocks" title="Create your first portfolio"
      description="Start with your brokerage account, then add stocks and available cash." /></View>}
    {!!portfolios.length && !filtered.length && <View style={s.card}>
      <EmptyState icon="stocks" title="No matching holdings" description="Try a different symbol, portfolio name or broker." />
      <Button title="Clear search" secondary onPress={() => setSearch('')} />
    </View>}
  </>;
}
