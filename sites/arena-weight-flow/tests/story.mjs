import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calendarPeriods } from '../src/flow.js';
import { storyMonths, storyInsights, percent, signed } from '../src/story.js';

const source = JSON.parse(readFileSync(new URL('../public/data/arena/overall.json', import.meta.url)));
const months = storyMonths(calendarPeriods(source.periods));
const { latest, baseline, absence } = storyInsights(months);
assert.equal(months.length, 41);
assert.equal(baseline.month, '2024-02');
assert.equal(baseline.share, .8);
assert.equal(latest.month, '2026-09');
assert.equal(latest.share, .18);
assert.deepEqual(latest.bands.map(b => b.open), [0, 4, 5]);
assert.deepEqual(absence, { start: '2026-03', months: 7 });
assert.equal(months.find(m => m.month === '2024-10').frontier.gap, 10);
for (const month of ['2025-01', '2025-02']) assert.equal(months.find(m => m.month === month).frontier.gap, -1);
assert.equal(latest.frontier.gap, 16);
assert.equal(months.find(m => m.month === '2025-04').share, .26);
assert.equal(months.find(m => m.month === '2025-10').share, .44);
for (const month of months) {
  assert.equal(month.bands.reduce((n, b) => n + b.n, 0), month.n);
  assert.equal(month.bands.reduce((n, b) => n + b.open, 0), month.open);
  if (month.month < '2023-12') assert.equal(month.frontier.gap, null);
}

// Band boundaries, tied ranks, unknown access and absent months must not be
// silently normalized to 50 seats or counted as an all-closed Top10.
const model = (rank, kind) => ({ rank, kind });
const synthetic = storyMonths(calendarPeriods([
  { month: '2026-07', models: [model(1, 'closed'), model(10, 'otherOpen'), model(10, 'apacheMit'), model(11, 'closed'), model(30, 'otherOpen'), model(31, 'closed'), model(50, 'unknown')] },
  { month: '2026-09', models: [model(1, 'closed'), model(2, 'unknown')] },
], '2026-07', '2026-09'));
assert.deepEqual(synthetic[0].bands.map(b => [b.n, b.open]), [[3, 2], [2, 1], [2, 0]]);
assert.equal(synthetic[0].share, 3 / 7);
assert.equal(synthetic[1].share, null);
assert.equal(storyInsights(synthetic).absence.months, 0);
const afterMissing = storyMonths(calendarPeriods([{ month: '2026-09', models: [model(1, 'closed')] }], '2026-08', '2026-09'));
assert.equal(storyInsights(afterMissing).absence.months, 1);
assert.equal(percent(null), '—');
assert.equal(percent(0), '0%');
assert.equal(signed(-1), '-1');
assert.equal(signed(null), '—');
console.log('Storyboard: source-backed conclusions, 41 monthly band totals, ties, missing and unknown values verified.');
