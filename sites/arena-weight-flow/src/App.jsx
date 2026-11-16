import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, Layers3, Grid2X2, Database, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import FlowChart from './FlowChart.jsx';
import Storyboard from './Storyboard.jsx';
import { KINDS, STACK_LABELS, palette, stackRanges, counts, selectPeriods, calendarPeriods, frontierPoints } from './flow.js';
import { useLanguage, accessLabel, stackLabel, categoryLabel, groupLabel, sourceText } from './i18n.jsx';
import { assetUrl } from './assets.js';
import { REPORT_EMBED } from './runtime.js';

function Segments({ label, values, value, onChange }) {
  return <div className="segments" role="group" aria-label={label}>{values.map(v => <button key={v.id} aria-pressed={value === v.id} onClick={() => onChange(v.id)}>{v.icon}{v.label}</button>)}</div>;
}
export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [page, setPage] = useState(REPORT_EMBED || new URLSearchParams(location.search).get('view') === 'dashboard' ? 'dashboard' : 'story');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (REPORT_EMBED) return true;
    try { return localStorage.getItem('arena-fieldnotes-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  useEffect(() => { try { if (!REPORT_EMBED) localStorage.setItem('arena-fieldnotes-sidebar-collapsed', String(sidebarCollapsed)); } catch {} }, [sidebarCollapsed]);
  useEffect(() => {
    if (!REPORT_EMBED) return;
    const url = new URL(location.href);
    url.searchParams.set('view', 'dashboard');
    history.replaceState({}, '', url);
  }, []);
  useEffect(() => { document.title = `Arena Fieldnotes · ${page === 'story' ? t('故事板', 'Storyboard') : t('权重与许可组成', 'Weight Access & Licenses')}`; }, [page, t]);
  const [catalog, setCatalog] = useState(null), [data, setData] = useState(null);
  const [category, setCategory] = useState(new URLSearchParams(location.search).get('category') || 'overall');
  const [top, setTop] = useState(50), [mode, setMode] = useState('rank'), [selected, setSelected] = useState(0);
  const [stacking, setStacking] = useState('all'), [distinguish, setDistinguish] = useState(false);
  const effectiveStacking = top === 10 ? 'all' : stacking;
  const colors = useMemo(() => palette(distinguish), [distinguish]);
  const [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError('');
    fetch(assetUrl('data/arena/index.json'), { signal: controller.signal }).then(r => { if (!r.ok) throw Error('catalog'); return r.json(); }).then(index => {
      setCatalog(index); setCategory(c => index.categories.some(x => x.id === c) ? c : index.defaultCategory);
    }).catch(e => { if (e.name !== 'AbortError') setError('catalog'); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    if (!catalog) return;
    const item = catalog.categories.find(c => c.id === category); if (!item) return;
    const controller = new AbortController(); setData(null); setError('');
    fetch(assetUrl(item.path), { signal: controller.signal }).then(r => { if (!r.ok) throw Error('data'); return r.json(); }).then(d => {
      if (!controller.signal.aborted) { setData(d); setSelected(calendarPeriods(d.periods, '2023-05', catalog.categories.map(c => c.end.slice(0, 7)).sort().at(-1)).length - 1); }
    }).catch(e => { if (e.name !== 'AbortError') setError('data'); });
    return () => controller.abort();
  }, [catalog, category, retry]);
  useEffect(() => { const pop = () => { const params = new URLSearchParams(location.search); setPage(REPORT_EMBED || params.get('view') === 'dashboard' ? 'dashboard' : 'story'); const c = params.get('category') || 'overall'; const next = catalog?.categories.some(x => x.id === c) ? c : 'overall'; if (next !== category) { setData(null); setCategory(next); } }; window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, [catalog, category]);
  const changePage = next => { if (REPORT_EMBED || next === page) return; setPage(next); const url = new URL(location.href); url.hash = ''; url.searchParams.set('view', next); history.pushState({}, '', url); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const changeCategory = c => { if (c === category) return; setData(null); setCategory(c); const url = new URL(location.href); url.searchParams.set('category', c); history.pushState({}, '', url); };
  const periods = useMemo(() => data ? selectPeriods(calendarPeriods(data.periods, '2023-05', catalog.categories.map(c => c.end.slice(0, 7)).sort().at(-1)), top) : [], [data, top, catalog]);
  const front = frontierPoints(periods)[selected];
  const current = periods[selected], totals = counts(current?.models || []);
  const categoryItem = catalog?.categories.find(c => c.id === category);
  const label = categoryItem ? categoryLabel(categoryItem, language) : t('综合榜单', 'Overall');
  const open = totals.apacheMit + totals.otherOpen;
  const errorMessage = error === 'catalog' ? t('榜单目录暂时无法加载', 'The leaderboard catalog could not be loaded.') : t('榜单数据暂时无法加载', 'The leaderboard data could not be loaded.');
  const tierLabels = stackRanges(top, effectiveStacking).map(b => b.label).join(t('、', ', '));

  return <>
    <a className="skip" href={page === 'story' ? '#story-frontier' : '#chart'}>{t('跳至图表', 'Skip to chart')}</a>
    <aside id="site-sidebar" className="sidebar" hidden={REPORT_EMBED || sidebarCollapsed}>
      <a href="#" className="brand"><span className="brand-mark"><Layers3 size={23} /></span><span>ARENA<span className="brand-subtitle">FIELDNOTES</span></span></a>
      <div className="chapter"><span className="eyebrow">{t('第一章', 'CHAPTER 01')}</span><strong>{t('格局之变', 'The Flip')}<span>.</span></strong><p>{t('从排名，看见开放程度的变化。', 'Track changing openness through the ranks.')}</p></div>
      <nav className="page-nav" aria-label={t('页面视图', 'Page views')}>
        <button className={page === 'story' ? 'active-nav' : ''} aria-current={page === 'story' ? 'page' : undefined} onClick={() => changePage('story')}><span>01</span><div>{t('故事板', 'Storyboard')}<small>{t('跟随故事', 'FOLLOW THE STORY')}</small></div><ArrowUpRight size={15} /></button>
        <button className={page === 'dashboard' ? 'active-nav' : ''} aria-current={page === 'dashboard' ? 'page' : undefined} onClick={() => changePage('dashboard')}><span>02</span><div>{t('主仪表板', 'Dashboard')}<small>{t('探索数据', 'EXPLORE THE DATA')}</small></div><ArrowUpRight size={15} /></button>
      </nav>
      <div className="sidebar-bottom"><span className="status-dot" /> ARENA TEXT<p>2023.05 — 2026.09<br />{t('每月一张榜单，两个观察角度。', 'One snapshot each month. Two perspectives.')}</p><a href="#method">{t('数据与统计口径', 'Data & methodology')} <ArrowUpRight size={12} /></a></div>
    </aside>
    <div className={`main-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${REPORT_EMBED ? ' report-embedded' : ''}`}>
      <header className="topbar">
        <div className="topbar-start"><button className="sidebar-toggle" aria-controls="site-sidebar" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? t('展开侧栏', 'Expand sidebar') : t('收起侧栏', 'Collapse sidebar')} title={sidebarCollapsed ? t('展开侧栏', 'Expand sidebar') : t('收起侧栏', 'Collapse sidebar')} onClick={() => setSidebarCollapsed(value => !value)}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><span>Arena Fieldnotes <b>/</b> {page === 'story' ? t('故事板', 'Storyboard') : t('权重与许可', 'Weight Access & Licenses')}</span></div>
        <div className="topbar-tools"><span className="edition">{page === 'story' ? t('两个关联故事', 'TWO LINKED STORIES') : t('探索 01', 'EXPLORATION 01')}</span><div className="language-switch" role="group" aria-label={t('页面语言', 'Site language')}><button lang="en" aria-label={t('切换为英语', 'Switch to English')} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button lang="zh" aria-label={t('切换为中文', 'Switch to Chinese')} aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button></div></div>
      </header>
      <main>
        {page === 'story' ? (error && !catalog ? <div className="load-state" role="alert"><p>{errorMessage}</p><button onClick={() => setRetry(r => r + 1)}>{t('重新加载', 'Try again')}</button></div> : <Storyboard catalog={catalog} onDashboard={() => changePage('dashboard')} />) : <>
          <section className="hero"><div><span className="eyebrow"><i /> {t('模型权重开放程度的时间变化', 'MODEL ACCESS OVER TIME')}</span><h1>{t('格局之变', 'The Flip')}<span>.</span></h1><h2>{t('权重与许可组成', 'Weight Access & License Composition')}</h2><p>{t('一个方块，一个模型。先看它排在哪里，再看它属于哪一边。', 'One block, one model. See where it ranks, then which group it belongs to.')}</p></div><div className="hero-symbol" aria-hidden="true"><div className="mini-grid">{Array.from({ length: 25 }, (_, i) => <i key={i} style={{ background: i % 5 < 3 ? (i % 5 < 2 ? colors.apacheMit : colors.otherOpen) : colors.closed, opacity: .45 + (i % 5) * .1 }} />)}</div><ArrowDown size={19} /><span>{t('排名 → 组成', 'RANK → COMPOSITION')}</span></div></section>
          <section className="figure" id="chart" aria-labelledby="chart-title">
            <div className="figure-heading"><div><span className="eyebrow">{t('01 / 权重与许可', '01 / WEIGHTS & LICENSES')}</span><h2 id="chart-title">{t('从榜单排位，到开放占比', 'From leaderboard ranks to open-weight share')}</h2></div><label className="category-label">{t('Arena Text 子榜单', 'Arena Text category')}<select value={category} onChange={e => changeCategory(e.target.value)} disabled={!catalog} aria-label={t('Arena Text 子榜单', 'Arena Text category')}>{[...new Set(catalog?.categories.map(c => c.group) || [])].map(group => <optgroup key={group} label={groupLabel(group, language)}>{catalog.categories.filter(c => c.group === group).map(c => <option key={c.id} value={c.id}>{categoryLabel(c, language)}</option>)}</optgroup>)}</select></label></div>
            <div className="controls">
              <Segments label={t('榜单范围', 'Leaderboard range')} value={top} onChange={n => { setTop(n); if (n !== 10 && mode === 'gap') setMode('rank'); }} values={[{ id: 10, label: t('前 10 名', 'Top 10') }, { id: 50, label: t('前 50 名', 'Top 50') }]} />
              <div className="mode-control"><span>{t('观察方式', 'View')}</span><Segments label={t('观察方式', 'Chart view')} value={mode} onChange={m => { setMode(m); if (m === 'gap') setTop(10); }} values={[{ id: 'rank', label: t('排名方块', 'Rank blocks'), icon: <Grid2X2 size={14} /> }, { id: 'area', label: t('面积组成', 'Composition'), icon: <Layers3 size={14} /> }, { id: 'gap', label: t('前沿差距', 'Frontier gap'), icon: <ArrowDown size={14} /> }]} /></div>
            </div>
            <div className="stack-controls">{top === 50 && <label>{t('堆叠方式', 'Stacking')}<select aria-label={t('堆叠方式', 'Stacking')} value={stacking} onChange={e => { setStacking(e.target.value); setMode('area'); }}>{Object.keys(STACK_LABELS).map(id => <option key={id} value={id}>{stackLabel(id, language)}</option>)}</select></label>}<label className="license-toggle"><input type="checkbox" checked={distinguish} onChange={e => setDistinguish(e.target.checked)} /><span className="toggle-track" aria-hidden="true" /><span>{t('Apache / MIT 显示深绿', 'Show Apache / MIT in dark green')}</span></label></div>
            <div className="chart-caption" aria-live="polite"><strong>{label} · {t(`前 ${top} 名`, `Top ${top}`)}</strong><span>{mode === 'gap'
              ? t('名次差 = 最强开权重名次 − 最强闭权重名次；正值闭权重领先，负值开权重领先。背景为淡化的前 10 名排名色块。', 'Rank gap = best open-weight rank − best closed-weight rank. Positive: closed-weight leads; negative: open-weight leads. Faded Top 10 rank blocks form the backdrop.')
              : mode === 'rank'
                ? t('从上到下按榜单顺序连续排列；灰框标记并列组，悬浮查看原始名次。', 'Models run from top to bottom in leaderboard order. Gray outlines mark ties; hover for the original rank.')
                : effectiveStacking === 'all'
                  ? t('方块按许可归类并堆积，每个月的面积合计为 100%。', 'Blocks are grouped and stacked by license; each month totals 100%.')
                  : t(`第 ${tierLabels} 名分别堆叠；每区内按实际模型数归一化，无模型的分区留空。`, `Ranks ${tierLabels} are stacked separately. Each tier is normalized by its actual model count; empty tiers remain blank.`)}</span></div>
            <div className="legend">
              {(distinguish ? KINDS : ['otherOpen', 'closed', 'unknown']).map(k => <span key={k}><i style={{ background: colors[k] }} />{!distinguish && k === 'otherOpen' ? t('开权重', 'Open-weight') : accessLabel(k, language)}</span>)}
              {mode === 'rank' && <span><i className="tie-swatch" />{t('并列排名', 'Tied ranks')}</span>}<span><i className="missing-swatch" />{t('无榜单快照', 'No snapshot')}</span>
              {top === 10 && mode !== 'area' && <><span><i className="gap-hatch-swatch" />{t('前沿差距 · 斜线', 'Frontier gap · hatching')}</span><span><i className="front-open" style={{ background: mode === 'gap' ? '#5867a3' : '#26846c' }} />{mode === 'gap' ? t('名次差曲线', 'Rank-gap curve') : t('最强开权重', 'Best open-weight')}</span><span><i className="front-closed" style={{ background: mode === 'gap' ? '#77828a' : '#bd6250' }} />{mode === 'gap' ? t('最强闭权重（零基准）', 'Best closed-weight (zero baseline)') : t('最强闭权重', 'Best closed-weight')}</span></>}
            </div>
            {top === 10 && mode !== 'area' && <p className="peak-note">{t('尖峰处直接显示差距和两侧模型短名；悬浮差距查看完整信息。连续峰顶合并，* 表示末端高点待确认，+N 表示另有模型。', 'Peaks show the gap and abbreviated names from both groups; hover over the gap for details. Flat peaks are merged. * marks an unconfirmed endpoint high; +N indicates additional models.')}</p>}
            {mode === 'area' && <p className="peak-note">{effectiveStacking === 'all'
              ? t('灰色参考线：25% / 50% / 75%。任意连续六个月最多标一个峰、一个谷；* 为末端待确认。悬浮取值线显示当月百分比，红绿交界箭头分别指向对应区域；未知值另记。', 'Gray guides mark 25% / 50% / 75%. Each rolling six-month window has at most one peak and one trough label; * marks an unconfirmed endpoint. Hover guides show monthly percentages. Arrows at the red–green boundary point into each group; unknown values are listed separately.')
              : t('灰色参考线：每区 50%。三区不显示静态峰谷标注。悬浮取值线显示当月百分比，红绿交界箭头分别指向对应区域；未知值另记。', 'Gray guides mark 50% within each tier. Three-tier stacks omit static peak and trough labels. Hover guides show monthly percentages. Arrows at the red–green boundary point into each group; unknown values are listed separately.')}</p>}
            <p className="history-note">{t('2023 年 12 月前：本数据集闭权重模型覆盖不完整，不能据此推断未参评。', 'Before December 2023, this dataset has incomplete closed-weight coverage; absence does not imply non-participation.')} <a href="https://www.lmsys.org/blog/2023-05-10-leaderboard/" target="_blank" rel="noreferrer">{t('官方 2023 年 5 月记录 ↗', 'Official May 2023 record ↗')}</a></p>
            {error ? <div className="load-state" role="alert"><p>{errorMessage}</p><button onClick={() => setRetry(r => r + 1)}>{t('重新加载', 'Try again')}</button></div> : !data ? <div className="load-state" role="status">{t('正在读取榜单…', 'Loading leaderboard…')}</div> : <FlowChart key={category} periods={periods} top={top} mode={mode} stacking={effectiveStacking} distinguish={distinguish} selected={selected} onSelect={setSelected} />}
            <div className="chart-footer"><span><ArrowDown size={12} /> {t('点击月份查看明细 · 窄屏可横向滚动', 'Select a month for details · Scroll horizontally on narrow screens')}</span><span>{periods.length ? t(`${periods[0].month} — ${periods.at(-1).month} · ${periods.length} 个月`, `${periods[0].month} — ${periods.at(-1).month} · ${periods.length} months`) : ''}</span></div>
            {current && <div className="monthly">
              <div className="monthly-head"><label>{t('月份明细', 'Monthly details')}<select aria-label={t('月份明细', 'Monthly details')} value={selected} onChange={e => setSelected(Number(e.target.value))}>{periods.map((p, i) => <option key={p.month} value={i}>{p.month}{p.observed === false ? t(' · 无数据', ' · No data') : ''}</option>)}</select></label><span>{current.observed === false ? t('该月无榜单快照', 'No snapshot for this month') : t(`实际快照 ${current.date}`, `Snapshot: ${current.date}`)}</span></div>
              {top === 10 && mode !== 'area' && <div className="frontier-summary"><strong>{t('前沿差距', 'Frontier gap')} · {front?.gap === null ? '—' : t(`${front?.gap > 0 ? '+' : ''}${front?.gap} 名`, `${front?.gap > 0 ? '+' : ''}${front?.gap} ranks`)}</strong>{front?.open && <p><b>{t(`最强开权重 · 第 ${front.open.rank} 名`, `Best open-weight · Rank ${front.open.rank}`)}</b><span>{front.open.models.join(' / ')}</span></p>}{front?.closed && <p><b>{t(`最强闭权重 · 第 ${front.closed.rank} 名`, `Best closed-weight · Rank ${front.closed.rank}`)}</b><span>{front.closed.models.join(' / ')}</span></p>}{front?.gap === null && <p>{t('2023 年 12 月前、无快照或任一权重组无记录时不计算差距。', 'No gap is calculated before December 2023, without a snapshot, or when either access group has no record.')}</p>}</div>}
              {current.observed === false ? <p className="missing-message">{t('该月没有可用快照，灰色斜线表示数据缺失，不代表模型数量或开权重占比为零。', 'No snapshot is available for this month. Gray hatching indicates missing data, not a zero model count or zero open-weight share.')}</p> : <>
                <div className="month-stats"><div><span>{t(`进入前 ${top} 名`, `In the Top ${top}`)}</span><strong>{current.models.length}<small>{t('个模型', ' models')}</small></strong></div><div><span>{t('开权重', 'Open-weight')}</span><strong className="green">{current.models.length ? (open / current.models.length * 100).toFixed(1) : '—'}<small>{t(`% · ${open} 个`, `% · ${open} models`)}</small></strong></div><div><span>{t('闭权重', 'Closed-weight')}</span><strong className="red">{current.models.length ? (totals.closed / current.models.length * 100).toFixed(1) : '—'}<small>{t(`% · ${totals.closed} 个`, `% · ${totals.closed} models`)}</small></strong></div><div><span>{t('未知', 'Unknown')}</span><strong>{totals.unknown}<small>{t('个模型', ' models')}</small></strong></div></div>
                <details className="model-details"><summary>{t(`查看这 ${current.models.length} 个模型的排位与许可`, `View ranks and licenses for these ${current.models.length} models`)}</summary><div className="table-scroll"><table><thead><tr><th>{t('排位', 'Rank')}</th><th>{t('模型', 'Model')}</th><th>{t('权重状态', 'Weight access')}</th><th>{t('许可证记录', 'Recorded license')}</th></tr></thead><tbody>{current.models.map(m => <tr key={m.model}><td>{m.rank}</td><td>{m.model}<small>{sourceText(m.org, language)}</small></td><td><i style={{ background: colors[m.kind] }} />{accessLabel(m.kind, language)}</td><td>{m.license ? sourceText(m.license, language) : t('未记录', 'Not recorded')}</td></tr>)}</tbody></table></div></details>
              </>}
            </div>}
          </section>
        </>}
        <details id="method" className="method"><summary><Database size={15} /> {t('数据与统计口径', 'Data & methodology')}</summary><div>
          <p>{t('沿用原站的 Arena Text 历史快照及权重／许可分类。每月使用该子榜最后一张可用快照，保留原始 rank ≤ 10 / 50 的全部模型，包括并列名次。排名图中每个模型按顺序各占一个等大的完整色块，并列组以灰框标注；纵轴为展示序位，原始名次保留在悬浮提示和明细表。边界并列可能使模型数超过阈值，完整保留并向下延展；早期不足额的月份按实际模型数计算占比。', 'This view uses the original site’s Arena Text historical snapshots and weight-access / license classifications. Each month uses the category’s last available snapshot and includes every model with an original rank ≤ 10 / 50, including ties. In rank view, each model occupies one equal-sized block in order; gray outlines mark tied groups. The vertical axis shows display position, while tooltips and the details table retain original ranks. Boundary ties can push the model count above the cutoff; all are retained and the chart extends downward. Shares in early months with fewer models use the actual model count.')}</p>
          <p>{t('默认所有开权重模型均为浅绿；开启 Apache / MIT 深绿开关后，该许可子集显示深绿。红色为闭权重，灰色为未知。分区堆叠按原始名次划分不重叠的区间，每个分区独立按实际模型数归一化；分区高度与名次区间长度成比例，无模型的分区留空，并列模型全部归入其原始名次所在分区。开放权重不等于完整的“开源 AI”；许可标签沿用原始数据，不应据此推断每个模型历史时点的法律许可状态。', 'All open-weight models are light green by default. Enabling the Apache / MIT toggle shows that license subset in dark green. Closed-weight models are red and unknown access is gray. Tiered stacks use non-overlapping original-rank ranges, each normalized independently by its actual model count. Tier heights are proportional to the number of ranks in each range; empty tiers remain blank. Every tied model belongs to the tier containing its original rank. Open-weight does not mean fully “open-source AI.” License labels follow the source data and should not be used to infer a model’s legal license status at each historical date.')}</p>
          <p>{t('统一时间轴从 2023 年 5 月开始，无快照月份以灰色斜线标记。前沿以完整月度快照中各权重组的最小原始名次计算，并列最强模型全部列出；名次差 = 最强开权重名次 − 最强闭权重名次。曲线自 2023 年 12 月起显示，缺失月份不连线。前 10 名之外的最强模型保留真实名次，必要时向下扩展纵轴。差距仅表示排序差，不表示能力差或统计显著性。', 'The shared timeline starts in May 2023; gray hatching marks months without a snapshot. Each group’s frontier is its lowest original rank in the full monthly snapshot, with all tied leaders listed. Rank gap = best open-weight rank − best closed-weight rank. Curves start in December 2023 and do not connect across missing months. The best model outside the Top 10 retains its true rank, with the vertical axis extended downward as needed. The gap measures ordering only, not a capability difference or statistical significance.')}</p>
          <p>{t('不同子榜开始时间不同；早期名单与参评覆盖并不完整，图中占比描述榜单样本，不代表同期整个市场。', 'Categories begin at different dates. Early rosters and participation coverage are incomplete; chart shares describe the leaderboard sample, not the whole market at that time.')}</p>
          <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noreferrer">{t('Arena 数据来源', 'Arena data source')} <ArrowUpRight size={12} /></a> · <a href={assetUrl('data/arena/index.json')} target="_blank" rel="noreferrer">{t('快照目录与源文件校验值', 'Snapshot catalog & source checksums')}</a>
        </div></details>
        <footer className="page-footer"><span>ARENA FIELDNOTES</span><span>{t('权重与许可 · 同一份榜单的两种视角', 'Weight access & licenses · Two views of one leaderboard')}</span></footer>
      </main>
    </div>
  </>;
}
