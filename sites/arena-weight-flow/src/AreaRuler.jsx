import React from 'react';
import { shareLabel, shareBoundaryArrows } from './flow.js';
import { useLanguage } from './i18n.jsx';

// One moving month ruler, with values in each independent band. This SVG is an
// overlay only: it cannot intercept pointer events or open a model tooltip.
export default function AreaRuler({ x, geo, width, height, month, readouts }) {
  const { t } = useLanguage();
  const right = x > width - 96;
  const labelX = x + (right ? -8 : 8), anchor = right ? 'end' : 'start';
  const dateX = Math.max(geo.left + 30, Math.min(width - 48, x));
  const description = readouts.map(r => t(
    `第 ${r.band.label} 名：${r.shares ? `开权重 ${shareLabel(r.shares.open)}，闭权重 ${shareLabel(r.shares.closed)}${r.shares.unknown ? `，未知 ${shareLabel(r.shares.unknown)}` : ''}` : '无数据'}`,
    `Ranks ${r.band.label}: ${r.shares ? `Open-weight ${shareLabel(r.shares.open)}, closed-weight ${shareLabel(r.shares.closed)}${r.shares.unknown ? `, unknown ${shareLabel(r.shares.unknown)}` : ''}` : 'No data'}`,
  )).join(t('；', '; '));
  return <svg className="area-ruler" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${t(`${month} 取值线。`, `${month} monthly ruler. `)}${description}`} data-month={month}>
    <rect x={x - geo.col / 2} y={geo.y} width={geo.col} height={geo.h} fill="#34424c0d" />
    <line x1={x} x2={x} y1={geo.y} y2={geo.y + geo.h} stroke="#ffffffef" strokeWidth="4" />
    <line x1={x} x2={x} y1={geo.y} y2={geo.y + geo.h} stroke="#343d45" strokeWidth="1.8" />
    {readouts.map(r => {
      if (!r.shares) return <text key={r.band.label} x={labelX} y={r.band.y + r.band.h / 2} textAnchor={anchor} className="ruler-value" fill="#56616a">{t('无数据', 'No data')}</text>;
      let lower = 0;
      const labels = ['open', 'closed', 'unknown'].map(kind => {
        const share = r.shares[kind], cy = r.band.y + r.band.h * (1 - lower - share / 2);
        lower += share;
        return { kind, share, cy };
      }).filter(l => l.kind !== 'unknown' || l.share > 0).sort((a, b) => a.cy - b.cy);
      return <g key={r.band.label} data-band={r.band.label}>
        {shareBoundaryArrows(x, r.band, r.shares).map(arrow => <polygon key={arrow.kind} data-arrow={arrow.kind} points={arrow.points.map(p => p.join(',')).join(' ')} fill={arrow.color} stroke="#ffffffed" strokeWidth="1" strokeLinejoin="round" />)}
        {labels.map((l, i) => {
        const cy = Math.max(r.band.y + 9 + i * 16, Math.min(r.band.y + r.band.h - 9 - (labels.length - 1 - i) * 16, l.cy));
        return <text key={l.kind} x={labelX} y={cy} textAnchor={anchor} className="ruler-value" fill={l.kind === 'open' ? '#075b43' : l.kind === 'closed' ? '#873d4a' : '#525f70'} data-kind={l.kind} data-value={l.share}>{l.kind === 'unknown' ? t('未知 ', 'Unknown ') : ''}{shareLabel(l.share)}</text>;
      })}</g>;
    })}
    <rect x={dateX - 30} y={geo.y + geo.h + 18} width="60" height="18" rx="3" fill="#343d45" />
    <text x={dateX} y={geo.y + geo.h + 27} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="600">{month}</text>
  </svg>;
}
