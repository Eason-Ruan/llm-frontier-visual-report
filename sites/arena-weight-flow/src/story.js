import { counts, frontierPoints, stackRanges } from './flow.js';

// Use the same original-rank membership and actual denominators as the dashboard.
export function storyMonths(periods) {
  const frontier = frontierPoints(periods);
  return periods.map((period, i) => {
    const summarize = models => {
      const total = counts(models), open = total.apacheMit + total.otherOpen;
      return { n: models.length, open, closed: total.closed, unknown: total.unknown, share: models.length ? open / models.length : null };
    };
    const models = period.models.filter(m => m.rank <= 50);
    return { ...period, ...summarize(models), frontier: frontier[i], bands: stackRanges(50, 'tiers').map(b => ({ ...b, ...summarize(models.filter(m => m.rank >= b.low && m.rank <= b.high)) })) };
  });
}

export function storyInsights(months) {
  const latest = months.at(-1);
  const baseline = months.find(m => m.month >= '2023-12' && m.observed !== false && m.n >= 50);
  let start = months.length;
  while (start > 0) {
    const month = months[start - 1];
    // Unknown access or an absent month cannot prove an all-closed Top10.
    if (month.observed === false || month.bands[0].n === 0 || month.bands[0].unknown || month.bands[0].open) break;
    start--;
  }
  return { latest, baseline, absence: { start: months[start]?.month ?? null, months: months.length - start } };
}

export const percent = value => value === null ? '—' : `${(value * 100).toFixed(Number.isInteger(value * 100) ? 0 : 1)}%`;
export const signed = value => value === null ? '—' : `${value > 0 ? '+' : ''}${value}`;
