import HomeSummary from './HomeSummary';
import HomeAllocation from './HomeAllocation';
import PortfolioHealth from './PortfolioHealth';

export default function Overview({ data, quotes, store, onNavigate }) {
  return <>
    <HomeSummary data={data} quotes={quotes} store={store} />
    <HomeAllocation data={data} quotes={quotes} />
    <PortfolioHealth data={data} quotes={quotes} onNavigate={onNavigate} />
  </>;
}
