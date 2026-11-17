import { assetUrl } from './assets.js';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Link2 } from 'lucide-react';
import FlowChart from './FlowChart.jsx';
import { calendarPeriods, selectPeriods, shortModelName, COLORS } from './flow.js';
import { storyMonths, storyInsights, percent, signed } from './story.js';
import { useLanguage, sourceText } from './i18n.jsx';

function LinkedTime({ id, months, selected, active, onSelect }) {
  const { t } = useLanguage();
  const viewName = id === 'frontier' ? t('前沿', 'Frontier') : t('分布', 'Distribution');
  return <div className="story-time">
    <label htmlFor={`${id}-month`}><Link2 size={14} /> {t('同月联动', 'Linked month')} <strong>{months[active].month}</strong></label>
    <div className="story-time-inputs">
      <button aria-label={`${viewName}: ${t('上个月', 'Previous month')}`} disabled={selected === 0} onClick={() => onSelect(selected - 1)}><ChevronLeft size={15} /></button>
      <input id={`${id}-month`} aria-label={`${viewName}: ${t('联动月份', 'Linked month')}`} type="range" min="0" max={months.length - 1} value={selected} onChange={e => onSelect(Number(e.target.value))} />
      <button aria-label={`${viewName}: ${t('下个月', 'Next month')}`} disabled={selected === months.length - 1} onClick={() => onSelect(selected + 1)}><ChevronRight size={15} /></button>
      <select aria-label={`${viewName}: ${t('月份', 'Month')}`} value={selected} onChange={e => onSelect(Number(e.target.value))}>{months.map((m, i) => <option value={i} key={m.month}>{m.month}</option>)}</select>
    </div>
    <span>{t('悬浮同步查看 · 点击固定月份', 'Hover to compare · Click to pin a month')}</span>
  </div>;
}

function StoryLegend({ frontier = false }) {
  const { t } = useLanguage();
  return <div className="legend story-legend">
    <span><i style={{ background: COLORS.open }} />{t('开权重', 'Open-weight')}</span>
    <span><i style={{ background: COLORS.closed }} />{t('闭权重', 'Closed-weight')}</span>
    <span><i style={{ background: COLORS.unknown }} />{t('未知', 'Unknown')}</span>
    <span><i className="missing-swatch" />{t('无快照', 'No snapshot')}</span>
    {frontier && <>
      <span><i className="front-open" />{t('最强开权重', 'Top open-weight')}</span>
      <span><i className="front-closed" />{t('最强闭权重', 'Top closed-weight')}</span>
      <span><i style={{ background: '#5867a3', width: 15, height: 2 }} />{t('名次差', 'Rank gap')}</span>
      <span><i className="gap-hatch-swatch" />{t('前沿 gap', 'Frontier gap')}</span>
    </>}
  </div>;
}

export default function Storyboard({ catalog, onDashboard }) {
  const { language, t } = useLanguage();
  const [data, setData] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(0), [hovered, setHovered] = useState(null), [composition, setComposition] = useState('area');
  const end = catalog?.categories.map(c => c.end.slice(0, 7)).sort().at(-1);
  useEffect(() => {
    if (!catalog) return;
    const controller = new AbortController(); setError('');
    fetch(assetUrl(catalog.categories.find(c => c.id === 'overall').path), { signal: controller.signal })
      .then(r => { if (!r.ok) throw Error('overall_load_failed'); return r.json(); })
      .then(d => { if (!controller.signal.aborted) { setData(d); setSelected(calendarPeriods(d.periods, '2023-05', end).length - 1); } })
      .catch(e => { if (e.name !== 'AbortError') setError('overall_load_failed'); });
    return () => controller.abort();
  }, [catalog, end, retry]);
  const periods = useMemo(() => data ? calendarPeriods(data.periods, '2023-05', end) : [], [data, end]);
  const top10 = useMemo(() => selectPeriods(periods, 10), [periods]);
  const months = useMemo(() => storyMonths(periods), [periods]);
  const insights = useMemo(() => storyInsights(months), [months]);
  const select = i => { setSelected(i); setHovered(null); };
  const go = month => { const i = periods.findIndex(p => p.month === month); if (i >= 0) select(i); };
  const active = hovered ?? selected, current = months[active];
  if (error) return <div className="load-state" role="alert"><p>{t('综合榜单暂时无法加载', 'The overall leaderboard could not be loaded.')}</p><button onClick={() => setRetry(n => n + 1)}>{t('重新加载', 'Retry')}</button></div>;
  if (!data) return <div className="load-state" role="status">{t('正在读取故事使用的综合榜单…', 'Loading the overall leaderboard for this story…')}</div>;
  const { latest, baseline, absence } = insights;
  const at = month => months.find(m => m.month === month);
  const peak2024 = at('2024-10'), reversal = at('2025-01'), reboundStart = at('2025-04'), reboundEnd = at('2025-10');
  const common = { compact: true, distinguish: false, selected: active, onSelect: select, onHoverMonth: setHovered, hoveredMonth: hovered };
  return <div className="storyboard" id="storyboard">
    <section className="story-hero">
      <span className="eyebrow">{t('THE FLIP / 两个视角，一个故事', 'THE FLIP / A STORY IN TWO VIEWS')}</span>
      <h1>{t('前沿的距离，', 'The frontier gap,')}<br />{t('榜单中的位置', 'the ranks beyond')}<span>{t('。', '.')}</span></h1>
      <p>{t('开权重模型与闭权重模型的竞争，既发生在第一名，也发生在前五十名。', 'Open-weight and closed-weight models compete for the lead and for places across the Top 50.')}<br className="wide-only" />{t('', ' ')}{t('沿着同一条时间轴，先看谁走在最前面，再看其余模型站在哪里。', 'Follow one timeline: first see who leads, then where the other models rank.')}</p>
      <div className="story-scope"><span>{t('Arena Text · 综合榜单', 'Arena Text · Overall leaderboard')}</span><span>2023.05 — {latest.month.replace('-', '.')}</span><span>{t('每月最后一张快照', 'Last snapshot of each month')}</span></div>
      <nav className="story-chapters" aria-label={t('故事章节', 'Story chapters')}>
        <a href="#story-frontier"><span>01</span> {t('前沿差距', 'The frontier gap')} <ArrowDown size={14} /></a>
        <a href="#story-distribution"><span>02</span> {t('Top50 的分布', 'The Top 50 distribution')} <ArrowDown size={14} /></a>
        <button onClick={onDashboard}>{t('打开主 Dashboard', 'Open dashboard')} <ArrowUpRight size={14} /></button>
      </nav>
    </section>

    <p className="history-note story-caveat">{t('阅读起点：2023 年 12 月前，本数据集闭权重覆盖不完整，早期绿色占比不能解释为市场优势。下文用“开权重”描述可获取模型权重的模型；它不等同于完整的开源 AI。', 'Before reading: this dataset has incomplete coverage of closed-weight models before December 2023, so early green shares do not establish market dominance. Here, “open-weight” means model weights are available; it does not imply fully open-source AI.')} <a href="https://www.lmsys.org/blog/2023-05-10-leaderboard/" target="_blank" rel="noreferrer">{t('早期官方参评记录 ↗', 'Early official participation record ↗')}</a></p>

    <section className="story-section" id="story-frontier" aria-labelledby="story-frontier-title">
      <div className="story-heading"><span className="story-number">01</span><div><span className="eyebrow">{t('前沿之上', 'AT THE FRONTIER')}</span><h2 id="story-frontier-title">{t('前沿差距曾短暂反转，随后再度扩大', 'The frontier gap briefly reversed, then widened again')}</h2></div></div>
      <p className="story-lede">{language === 'zh'
        ? <>2024 年 10 月，最强开权重模型落后最强闭权重模型 <strong>{peak2024.frontier.gap} 个名次</strong>；到 2025 年 1–2 月，开权重模型短暂领先 1 名。此后闭权重重回前列，至 {latest.month}，两者相差 <strong>{latest.frontier.gap} 名</strong>。</>
        : <>In October 2024, the top open-weight model trailed the top closed-weight model by <strong>{peak2024.frontier.gap} ranks</strong>. In January–February 2025, open-weight models briefly led by one rank. Closed-weight models then regained the lead; by {latest.month}, the gap was <strong>{latest.frontier.gap} ranks</strong>.</>}
      </p>
      <div className="story-milestones" role="group" aria-label={t('前沿关键月份', 'Frontier milestone months')}>
        {[[peak2024, t('差距扩大', 'Widening gap')], [reversal, t('短暂反转', 'Brief reversal')], [latest, t('最新快照', 'Latest snapshot')]].map(([m, title]) => <button key={m.month} aria-pressed={months[selected].month === m.month} onClick={() => go(m.month)}><span>{m.month} · {title}</span><strong className={m.frontier.gap < 0 ? 'green' : ''}>{signed(m.frontier.gap)}<small>{t(' 名', Math.abs(m.frontier.gap) === 1 ? ' rank' : ' ranks')}</small></strong><ArrowRight size={15} /></button>)}
      </div>
      <LinkedTime id="frontier" months={months} selected={selected} active={active} onSelect={select} />
      <StoryLegend frontier />
      <div className="story-pair">
        <article className="story-panel" aria-labelledby="story-rank-title">
          <header><span className="eyebrow">{t('它们排名何处', 'WHERE THEY RANK')}</span><h3 id="story-rank-title">{t('Top10 · 排名方块', 'Top 10 · Rank blocks')}</h3><p>{t('从上到下看名次；两条曲线连接各组最强模型。', 'Read ranks from top to bottom; the two lines connect each group’s top models.')}</p></header>
          <FlowChart periods={top10} top={10} mode="rank" stacking="all" {...common} />
          <div className="story-panel-readout"><span>{current.month} · {t('各组最强模型', 'Top model in each group')}</span>{['open', 'closed'].map(kind => <p key={kind}><i className={kind} /><b>{kind === 'open' ? t('开权重', 'Open-weight') : t('闭权重', 'Closed-weight')} #{current.frontier[kind]?.rank ?? '—'}</b><span title={current.frontier[kind]?.models.join(' / ')}>{current.frontier[kind]?.models.map(shortModelName).join(' / ') || t('该月不作前沿比较', 'No frontier comparison for this month')}</span></p>)}</div>
        </article>
        <article className="story-panel" aria-labelledby="story-gap-title">
          <header><span className="eyebrow">{t('它们相距多远', 'HOW FAR APART')}</span><h3 id="story-gap-title">{t('Top10 · 前沿差距', 'Top 10 · Frontier gap')}</h3><p>{t('闭权重前沿落到零线，正值闭权重领先，负值开权重领先。', 'The closed-weight frontier is the zero line. Positive values mean closed-weight leads; negative values mean open-weight leads.')}</p></header>
          <FlowChart periods={top10} top={10} mode="gap" stacking="all" {...common} />
          <div className="story-panel-readout story-gap-readout"><div><span>{current.month} · {t('名次差', 'Rank gap')}</span><strong>{signed(current.frontier.gap)}<small>{t(' 名', Math.abs(current.frontier.gap) === 1 ? ' rank' : ' ranks')}</small></strong></div><p>{current.frontier.gap === null ? t('早期覆盖不完整或缺少观测，不计算差距。', 'No gap is calculated where early coverage is incomplete or observations are missing.') : t(`第 ${current.frontier.open.rank} 名 − 第 ${current.frontier.closed.rank} 名`, `Rank ${current.frontier.open.rank} − rank ${current.frontier.closed.rank}`)}<small>{t('最强开权重 − 最强闭权重', 'Top open-weight − top closed-weight')}</small></p></div>
        </article>
      </div>
      <p className="story-chart-note">{t('左右图共享月份，悬浮峰值数字查看完整模型。* 为末端高点，尚待后续快照确认。最强模型取自完整月度名单，离开 Top10 后仍保留真实名次；差距表示排名差，不是能力差或统计显著性。', 'Both charts share the selected month. Hover over a peak label for full model names. * marks an endpoint high awaiting confirmation from later snapshots. Each group’s top model is selected from the full monthly list, keeping its actual rank even outside the Top 10. The gap measures rank differences, not capability differences or statistical significance.')}</p>
    </section>

    <section className="story-section" id="story-distribution" aria-labelledby="story-distribution-title">
      <div className="story-heading"><span className="story-number">02</span><div><span className="eyebrow">{t('前沿之外', 'BEYOND THE FRONTIER')}</span><h2 id="story-distribution-title">{t('仍在前五十，重心已移出 Top10', 'Still in the Top 50, now concentrated beyond the Top 10')}</h2></div></div>
      <p className="story-lede">{language === 'zh'
        ? <>开权重模型在 Top50 中的占比，由 {baseline.month} 的 <strong>{percent(baseline.share)}</strong> 降至 {latest.month} 的 <strong>{percent(latest.share)}</strong>。这并非单向下滑：2025 年 4–10 月曾从 {percent(reboundStart.share)} 回升到 {percent(reboundEnd.share)}。但自 <strong>{absence.start}</strong> 起，已连续 <strong>{absence.months} 个月</strong>没有开权重模型进入 Top10。</>
        : <>The open-weight share of the Top 50 fell from <strong>{percent(baseline.share)}</strong> in {baseline.month} to <strong>{percent(latest.share)}</strong> in {latest.month}. The decline was not continuous: the share recovered from {percent(reboundStart.share)} to {percent(reboundEnd.share)} between April and October 2025. But since <strong>{absence.start}</strong>, no open-weight model has entered the Top 10 for <strong>{absence.months} consecutive months</strong>.</>}
      </p>
      <div className="story-takeaway"><span>{t('看总量，也看位置', 'Look at both share and rank')}</span><p>{language === 'zh'
        ? <>最新快照的 {latest.open} 个开权重模型，分布在第 11–30 名的有 <strong>{latest.bands[1].open} 个</strong>，第 31–50 名的有 <strong>{latest.bands[2].open} 个</strong>。两个区间数量接近，体现了最新月份的腰部分布；历史月份并非始终均匀。</>
        : <>Of the {latest.open} open-weight models in the latest snapshot, <strong>{latest.bands[1].open}</strong> rank 11–30 and <strong>{latest.bands[2].open}</strong> rank 31–50. These similar counts describe the latest month’s distribution across the middle and lower ranks; historical months were not always evenly distributed.</>}
      </p></div>
      <LinkedTime id="distribution" months={months} selected={selected} active={active} onSelect={select} />
      <StoryLegend />
      <div className="story-pair">
        <article className="story-panel" aria-labelledby="story-whole-title">
          <header><span className="eyebrow">{t('整体占比', 'THE OVERALL SHARE')}</span><h3 id="story-whole-title">{t('Top50 · 整体组成', 'Top 50 · Overall composition')}</h3><div className="segments story-composition-switch" role="group" aria-label={t('故事整体组成视图', 'Story overall composition view')}><button aria-pressed={composition === 'area'} onClick={() => setComposition('area')}>{t('整体面积', 'Overall area')}</button><button aria-pressed={composition === 'rank'} onClick={() => setComposition('rank')}>{t('排名方块', 'Rank blocks')}</button></div></header>
          <FlowChart periods={periods} top={50} mode={composition} stacking="all" {...common} />
          <div className="story-panel-readout story-share-readout"><div><span>{current.month} · {t('Top50 开权重占比', 'Open-weight share of Top 50')}</span><strong>{percent(current.share)}</strong></div><p>{current.open} / {current.n} {t('个模型', 'models')}<small>{t('分母为实际入榜数，包含并列', 'Denominator: actual listed models, including ties')}</small></p></div>
        </article>
        <article className="story-panel" aria-labelledby="story-tiers-title">
          <header><span className="eyebrow">{t('占比分布何处', 'WHERE THE SHARE SITS')}</span><h3 id="story-tiers-title">{t('Top50 · 三区堆叠', 'Top 50 · Three rank bands')}</h3><p>{t('按第 1–10、11–30、31–50 名分区，分别观察组成。', 'Compare composition within ranks 1–10, 11–30, and 31–50.')}</p></header>
          <FlowChart periods={periods} top={50} mode="area" stacking="tiers" {...common} />
          <div className="story-panel-readout story-band-readout"><span>{current.month} · {t('各区开权重 / 实际模型数', 'Open-weight / actual models per band')}</span><div>{current.bands.map(b => <p key={b.label}><span>{t(`第 ${b.label} 名`, `Ranks ${b.label}`)}</span><strong>{b.open}<small> / {b.n}</small></strong><span>{percent(b.share)}</span></p>)}</div></div>
        </article>
      </div>
      <p className="story-chart-note">{t('整体图保留 25% / 50% / 75% 参考线，以及每六个月至多一个峰、一个谷的标注；* 为末端待确认。三区图不显示静态峰谷，仅保留较细的 50% 参考线。悬浮同月取值线显示百分比，交界处的红绿箭头分别指向对应区域。未知值另记，开权重合计包含 Apache / MIT。', 'The overall chart shows 25% / 50% / 75% reference lines and at most one peak and one trough label per six-month period; * marks an unconfirmed endpoint. The three-band chart omits static peak and trough labels and keeps a thinner 50% reference line. Hovering shows percentages along a shared month line; red and green arrows at boundaries point to their respective areas. Unknown status is counted separately; open-weight totals include Apache / MIT.')}</p>
      <p className="story-chart-note">{t('左图面积按整个 Top50 的实际模型数归一化；右图在每个分区内独立归一化，三区高度按 10∶20∶20 分配。边界并列按原始名次归区，区间不重叠。排名变化还受参评模型与榜单覆盖变化影响，这里描述的是榜单样本。', 'The left chart normalizes area by the actual number of models across the Top 50. The right chart normalizes each band independently, with band heights in a 10:20:20 ratio. Boundary ties follow their original ranks, so bands do not overlap. Changes in participating models and leaderboard coverage also affect ranks; these views describe the leaderboard sample.')}</p>
    </section>
    <details className="story-data">
      <summary>{t('查看联动月份的原始模型与统计依据', 'View source models and methodology for the linked month')}</summary>
      <p>{t('固定综合榜单；两节同步月份。每月采用最后一个可用快照，原始 rank ≤ 50 的模型全部保留。快照日期：', 'Both sections use the overall leaderboard and share the selected month. Each month uses its last available snapshot, retaining every model with original rank ≤ 50. Snapshot date: ')}{current.date || t('无数据', 'No data')}{t('。', '. ')}<a href={assetUrl('data/arena/overall.json')} target="_blank" rel="noreferrer">{t('月度源数据 ↗', 'Monthly source data ↗')}</a> · <a href={assetUrl('data/arena/provenance.json')} target="_blank" rel="noreferrer">{t('文件与来源校验值 ↗', 'Files and source checksums ↗')}</a></p>
      <div className="table-scroll"><table><caption>{current.month} · {t('Top50 模型名单', 'Top 50 model list')}</caption><thead><tr><th>{t('原始名次', 'Original rank')}</th><th>{t('模型', 'Model')}</th><th>{t('权重状态', 'Weight status')}</th><th>{t('许可记录', 'License record')}</th></tr></thead><tbody>{current.models.map(m => <tr key={m.model}><td>{m.rank}</td><td>{m.model}</td><td>{['apacheMit', 'otherOpen'].includes(m.kind) ? t('开权重', 'Open-weight') : m.kind === 'closed' ? t('闭权重', 'Closed-weight') : t('未知', 'Unknown')}</td><td>{m.license ? sourceText(m.license, language) : t('未记录', 'Not recorded')}</td></tr>)}</tbody></table></div>
    </details>
    <div className="story-end"><p>{t('继续探索不同能力榜单与许可组成。', 'Explore more capability leaderboards and license breakdowns.')}</p><button onClick={onDashboard}>{t('返回主 Dashboard', 'Back to dashboard')} <ArrowUpRight size={15} /></button></div>
  </div>;
}
