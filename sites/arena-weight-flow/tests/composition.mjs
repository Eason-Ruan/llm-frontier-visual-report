import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calendarPeriods, compositionExtrema, limitCompositionExtrema, shareLabel } from '../src/flow.js';

const periods = values => values.map((open, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, observed: open !== null, models: open === null ? [] : Array.from({ length: 10 }, (_, j) => ({ model: `${i}-${j}`, rank: j + 1, kind: j < open ? 'otherOpen' : 'closed' })) }));
const extrema = values => compositionExtrema(periods(values), 10)[0].events;
assert.deepEqual(extrema([2, 5, 3]).filter(e => !e.endpoint).map(e => e.index), [1]);
assert.deepEqual(extrema([7, 2, 6]).filter(e => !e.endpoint).map(e => e.index), [1]);
assert.deepEqual(extrema([2, 5, 5, 3]).filter(e => !e.endpoint).map(e => [e.index, e.endIndex]), [[1, 2]]);
assert.equal(extrema([2, 5, 5, 3])[0].triggers.length, 2, 'complementary extrema share one marker');
assert.deepEqual(extrema([null, 5, null, 4, null]), [], 'missing/empty months cannot confirm turns');
assert.deepEqual(extrema([4, 4, 4]), []);
assert.equal(extrema([3, 1, 0]).at(-1).endpoint, true);
assert.equal(extrema([1, 0, 2])[0].shares.open, 0, 'zero share is a real valley');
assert.equal(extrema([9, 10, 8])[0].shares.closed, 0);
assert.equal(shareLabel(0), '0%');
assert.equal(shareLabel(1), '100%');
assert.equal(shareLabel(1 / 3), '33.3%');

// A closed-only turning point when unknown access changes must not disappear.
const unknown = [3, 5, 3].map((closed, i) => ({ month: `2026-0${i + 1}`, models: Array.from({length: 10}, (_, j) => ({ rank: j + 1, kind: j < 2 ? 'otherOpen' : j < closed + 2 ? 'closed' : 'unknown' })) }));
const unknownEvent = compositionExtrema(unknown, 10)[0].events[0];
assert.equal(unknownEvent.shares.open, .2);
assert.equal(unknownEvent.shares.closed, .5);
assert.equal(unknownEvent.shares.unknown, .3);
assert.deepEqual(unknownEvent.triggers.map(t => t.kind), ['closed']);
const mixed = [[2,3],[4,5],[4,4],[4,3]].map(([open,closed],i)=>({month:`2026-0${i+1}`,models:Array.from({length:10},(_,j)=>({rank:j+1,kind:j<open?'otherOpen':j<open+closed?'closed':'unknown'}))}));
assert.equal(compositionExtrema(mixed,10)[0].events[0].endpoint,true,'a provisional open plateau keeps its star even when the closed peak at the same month is confirmed');

const event = (month, type, prominence, open=.5) => ({month,index:Number(month.slice(0,4))*12+Number(month.slice(5)),shares:{open,closed:1-open},triggers:[{kind:'open',type,prominence,confirmed:true}],endpoint:false});
assert.deepEqual(limitCompositionExtrema([event('2026-01','peak',.1),event('2026-06','peak',.2)]).map(e=>e.month),['2026-06'],'Jan and Jun are in one six-month window; stronger peak wins');
assert.equal(limitCompositionExtrema([event('2026-01','peak',.1),event('2026-07','peak',.1)]).length,2,'exactly six months apart is permitted');
assert.equal(limitCompositionExtrema([event('2026-01','peak',.1),event('2026-02','valley',.1)]).length,2,'one peak and one valley may share a window');
assert.equal(limitCompositionExtrema([event('2025-10','peak',.1),event('2026-03','peak',.1)]).length,1,'year boundaries are not window boundaries');
assert.deepEqual(limitCompositionExtrema([event('2026-01','peak',.1,.6),event('2026-03','peak',.1,.8)]).map(e=>e.month),['2026-03'],'equal prominence prefers the more extreme value');

const catalog = JSON.parse(readFileSync(new URL('../public/data/arena/index.json', import.meta.url)));
let checked = 0, retained = 0;
for (const category of catalog.categories) {
  const data = JSON.parse(readFileSync(new URL(`../public/data/arena/${category.id}.json`, import.meta.url)));
  const ps = calendarPeriods(data.periods);
  for (const [top, stacking] of [[10, 'all'], [50, 'all'], [50, 'tiers']]) {
    for (const band of compositionExtrema(ps, top, stacking)) {
      const filtered = limitCompositionExtrema(band.events); retained += filtered.length;
      for (const a of filtered) for (const b of filtered) if (a !== b && a.markerType === b.markerType) assert.ok(Math.abs(a.monthNumber-b.monthNumber)>=6,'every rolling six-month window has at most one event of each type');
      for (const event of band.events) {
      assert.ok(event.n > 0);
      assert.equal(Object.values(event.counts).reduce((n, c) => n + c, 0), event.n);
      assert.ok(Math.abs(Object.values(event.shares).reduce((n, c) => n + c, 0) - 1) < 1e-10);
      assert.ok(event.triggers.every(t => t.end >= t.start));
      assert.ok(event.observations.every(p => p.n > 0));
      const source = ps[event.index].models.filter(m => m.rank >= band.low && m.rank <= band.high);
      assert.equal(event.n, source.length, 'use actual model count including ties');
      checked++;
      }
    }
  }
}
console.log(`Composition extrema verified: ${checked} candidates → ${retained} retained across 29 boards; rolling six-month spacing, peaks, valleys, plateaus, endpoints, zero and unknown shares.`);
