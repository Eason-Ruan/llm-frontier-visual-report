/* Presentation adapter: the original chart controller and data remain authoritative. */
(() => {
  const byId = (id) => document.getElementById(id);
  const app = document.querySelector('.app');
  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';
  const aside = document.createElement('aside');
  aside.className = 'dashboard-sidebar';
  aside.setAttribute('aria-label', 'Insights and filters');
  aside.innerHTML = `<section class="insight-panel"><h2>Insight</h2><p id="dashboard-insight">Compare four perspectives on the ecosystem: evaluation share, model supply, talent flows, and business adoption. The measures have different units and coverage windows, so read timing and direction separately.</p></section><div class="insight-pages" aria-label="Insight pages"><button type="button" class="active" aria-label="Overview insight" aria-pressed="true"></button><button type="button" aria-label="Reading guide" aria-pressed="false"></button></div><section class="filter-panel"><label class="filter-label" for="period-select">Period</label><select id="period-select"><option value="common">2024–25</option><option value="battle">Battle window</option><option value="all">All dates</option><option value="custom" disabled>Custom dates</option></select><span class="filter-label">Date range</span><div class="date-controls"></div><div class="range-controls"><input id="range-start" type="range" aria-label="Lower date bound" min="0" max="1368"><input id="range-end" type="range" aria-label="Upper date bound" min="0" max="1368"></div><div class="range-ticks"><span>2023</span><span>2024</span><span>2025</span><span>2026</span></div><div id="sidebar-models"><span class="filter-label">Models</span></div><div id="sidebar-country"><label class="filter-label" for="country">Country</label></div><div class="filter-toggles"></div><div class="filter-reset"></div></section>`;
  const region = document.createElement('div');
  region.className = 'dashboard-region';
  layout.append(aside, region);
  document.querySelector('.header').after(layout);
  const summary = document.createElement('section');
  summary.className = 'data-summary';
  summary.innerHTML = '<h2>Data summary</h2>';
  summary.append(byId('kpis'));
  region.append(summary, document.querySelector('.tabs'), document.querySelector('.grid'));
  aside.querySelector('.date-controls').append(byId('start'), byId('end'));
  aside.querySelector('#sidebar-models').append(document.querySelector('.modelpicker'));
  aside.querySelector('#sidebar-country').append(byId('country'));
  for (const id of ['fixed', 'complete', 'ci', 'events']) aside.querySelector('.filter-toggles').append(byId(id).closest('label'));
  byId('reset').textContent = 'Clear all filters';
  aside.querySelector('.filter-reset').append(byId('reset'));
  document.querySelector('.toolbar').classList.add('adapted-presets');
  document.querySelectorAll('.head .controls').forEach((node) => { if (!node.children.length) node.remove(); });
  document.querySelectorAll('.grid > .card').forEach((card, i) => {
    card.querySelector('.num').textContent = `4.${i + 1} ·`;
    const info = document.createElement('details');
    info.className = 'chart-info';
    info.innerHTML = '<summary aria-label="Chart information"><img src="./assets/information.svg" alt=""></summary><div class="chart-info-content"></div>';
    const content = info.querySelector('.chart-info-content');
    card.querySelectorAll('.source, .note, .insight').forEach((node) => content.append(node));
    card.querySelector('.head').append(info);
  });
  const titles = document.querySelectorAll('.dual .chart-title > span:first-child');
  titles.forEach((node, i) => { node.textContent = `${i ? 'b' : 'a'}. ${node.textContent}`; });
  const talentTitles = document.querySelectorAll('.talent-layout .chart-title');
  talentTitles[0].insertAdjacentHTML('afterbegin', '<span>a.</span>');
  talentTitles[1].querySelector('span').textContent = 'b. Country snapshot';
  document.querySelector('.exposure-wrap').insertAdjacentHTML('afterbegin', '<div class="chart-title">a. Weekly appearance share (%)</div>');
  document.querySelector('.exposure-wrap > .chart-title:nth-last-child(2) span').textContent = 'b. Weekly battles';
  const insightText = [byId('dashboard-insight').textContent, 'Recorded evaluations, repository additions, talent indicators, and survey estimates use different denominators. Hover for values, click to link a date, or drag across a timeline to filter the period. Partial exposure weeks can be excluded with Full weeks.'];
  aside.querySelectorAll('.insight-pages button').forEach((button, i) => { button.onclick = () => {
    byId('dashboard-insight').textContent = insightText[i];
    aside.querySelectorAll('.insight-pages button').forEach((b, j) => { b.classList.toggle('active', i === j); b.setAttribute('aria-pressed', String(i === j)); });
    window.ReportEmbed?.notify();
  }; });
  byId('period-select').onchange = () => document.querySelector(`.preset[data-range="${byId('period-select').value}"]`)?.click();
  const rangeBase = Date.parse('2023-01-01T00:00:00Z');
  const popups = [...document.querySelectorAll('details.chart-info, details.modelpicker')];
  popups.forEach((popup) => {
    popup.addEventListener('pointerenter', () => popup.classList.remove('is-dismissed'));
    popup.addEventListener('focusin', () => popup.classList.remove('is-dismissed'));
    popup.addEventListener('toggle', () => { if (popup.open) popup.classList.remove('is-dismissed'); });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const visible = (popup) => popup.getClientRects().length > 0 && (popup.open || (popup.matches('.chart-info:hover, .chart-info:focus-within') && !popup.classList.contains('is-dismissed')));
    const focused = event.target.closest?.('details.chart-info, details.modelpicker');
    const popup = focused && visible(focused) ? focused : popups.find(visible);
    if (!popup) return;
    popup.open = false;
    popup.querySelector('summary').focus({ preventScroll: true });
    popup.classList.add('is-dismissed');
    event.preventDefault();
    event.stopPropagation();
    window.ReportEmbed?.notify();
  }, true);
  const day = 86400000;
  for (const id of ['range-start', 'range-end']) {
    byId(id).max = Math.round((Date.parse('2026-09-30T00:00:00Z') - rangeBase) / day);
    byId(id).oninput = () => {
      const a = +byId('range-start').value, b = +byId('range-end').value;
      if (a > b) byId(id).value = id === 'range-start' ? b : a;
      const target = byId(id === 'range-start' ? 'start' : 'end');
      target.value = new Date(rangeBase + +byId(id).value * day).toISOString().slice(0, 10);
      target.dispatchEvent(new Event('change', { bubbles: true }));
    };
  }
  window.Ch4Layout = {
    sync(value) {
      const period = value.start === '2024-01-01' && value.end === '2025-12-31' ? 'common' : value.start === '2025-04-14' && value.end === '2025-07-27' ? 'battle' : value.start === '2023-01-01' && value.end === '2026-09-30' ? 'all' : 'custom';
      byId('period-select').value = period;
      byId('range-start').value = Math.round((Date.parse(value.start + 'T00:00:00Z') - rangeBase) / day);
      byId('range-end').value = Math.round((Date.parse(value.end + 'T00:00:00Z') - rangeBase) / day);
      window.ReportEmbed?.setView({ view: 'ecosystem', selection: value.focus, category: value.country });
      window.ReportEmbed?.notify();
    },
    connect() {
      window.ReportEmbed?.ready({ title: 'LLM Ecosystem in Transition', help: 'Hover for values · click to link a date · drag to filter. Use the filters to choose models, country, and coverage.' });
      window.ReportEmbed?.onAction((action) => {
        if (action.category && byId('country').querySelector(`option[value="${CSS.escape(action.category)}"]`)) window.DSH_CH4?.chooseCountry(action.category);
        if (typeof action.selection === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(action.selection)) window.DSH_CH4?.setFocus(action.selection);
        if (action.selection === null) window.DSH_CH4?.setFocus(null);
      });
    },
  };
  window.addEventListener('report:resize', () => window.dispatchEvent(new Event('resize')));
  window.addEventListener('report:mode', () => window.dispatchEvent(new Event('resize')));
})();
