/* The synthesis controller owns state, chart options, and the original data. */
(() => {
  const el = (id) => document.getElementById(id);
  const pages = ['overview', 'institutions', 'linked'];
  const leads = Object.fromEntries(pages.map((view) => [view, document.querySelector(`[data-page="${view}"] .lead`).textContent]));
  const secondary = {
    overview: document.querySelector('.insight-strip').textContent + ' ' + document.querySelector('.section-note').textContent,
    institutions: document.querySelector('.takeaway-list').textContent,
    linked: document.querySelector('[data-page="linked"] > .card:last-child').textContent,
  };
  const main = el('main');
  const shell = document.createElement('div');
  shell.className = 'synthesis-layout';
  const sidebar = document.createElement('aside');
  sidebar.className = 'synthesis-sidebar';
  sidebar.setAttribute('aria-label', 'Insights and filters');
  sidebar.innerHTML = `<section class="insight-panel"><h2>Insight</h2><p id="view-insight"></p></section><div class="insight-pages" aria-label="Insight pages"><button type="button" class="active" aria-label="Main insight" aria-pressed="true"></button><button type="button" aria-label="Reading guide" aria-pressed="false"></button></div><section class="filter-panel"><label for="viewSelect">View</label><select id="viewSelect"><option value="overview">The shift</option><option value="institutions">The organizations</option><option value="linked">Compare the evidence</option></select><div class="organization-group"><label for="groupSelect">Organization group</label><select id="groupSelect"><option value="all">All</option><option value="big7" selected>Big-7</option><option value="small">Smaller labs</option></select></div><div class="scale-control"></div><div class="organization-control"></div><button type="button" id="clearFilters" class="ghost-btn">Clear all filters</button><div class="view-pager"></div><div class="filter-tools"><span>Tools</span><button type="button" id="synthesisFullscreen" class="ghost-btn">Fullscreen ↗</button></div></section>`;
  main.before(shell);
  shell.append(sidebar, main);
  const pager = document.querySelector('.pager');
  sidebar.querySelector('.view-pager').append(pager, el('dots'));
  sidebar.querySelector('.scale-control').append(el('logToggle'));
  const picker = document.querySelector('.org-picker');
  sidebar.querySelector('.organization-control').append(picker);
  sidebar.querySelector('.filter-panel').append(el('selBadge'));
  el('groupSeg').classList.add('adapted-group');
  const summary = document.createElement('section');
  summary.className = 'data-summary';
  summary.innerHTML = '<h2>Data summary</h2>';
  el('kpis').before(summary);
  summary.append(el('kpis'));
  document.querySelector('[data-page="institutions"]').classList.add('organizations-page');
  const institutions = document.querySelector('[data-page="institutions"]');
  const orgGrid = document.createElement('div');
  orgGrid.className = 'grid-2 organization-charts';
  const rankCard = el('rankChart').closest('.card');
  const exceptionsCard = el('exceptions').closest('.card');
  institutions.append(orgGrid);
  orgGrid.append(rankCard, exceptionsCard);
  institutions.querySelector('.grid-2:not(.organization-charts)').remove();
  const linkedSummary = el('orgCard').closest('.card');
  linkedSummary.classList.add('data-summary');
  linkedSummary.querySelector('h2').textContent = 'Data summary';
  const labels = {
    flipA: '5.1 · First vs latest Top 10', miniVote: '5.2 · Votes and open-model supply',
    rankChart: '5.3 · Best rank by organization', exceptions: '5.4 · Open-weight challengers',
    L_rank: '5.5 · Rank trajectory', L_cost: '5.6 · Training cost',
    L_vote: '5.7 · Recorded-vote share', L_market: '5.8 · Listed-company market context',
  };
  for (const [id, title] of Object.entries(labels)) {
    const card = el(id).closest('.card');
    card.querySelector('h2').textContent = title;
    const notes = [...card.querySelectorAll(':scope > .footnote')];
    const hint = card.querySelector('.card-head > .hint');
    if (notes.length || hint) {
      const info = document.createElement('details');
      info.className = 'chart-info';
      info.innerHTML = '<summary aria-label="Chart information"><img src="/dashboard/ch5/static/assets/information.svg" alt=""></summary><div class="chart-info-content"></div>';
      const content = info.querySelector('.chart-info-content');
      if (hint) content.append(hint);
      notes.forEach((note) => content.append(note));
      card.querySelector('.card-head').append(info);
    }
  }
  const flipRow = document.querySelector('.flip-row');
  const popups = [...document.querySelectorAll('details.chart-info')];
  popups.forEach((popup) => {
    popup.addEventListener('pointerenter', () => popup.classList.remove('is-dismissed'));
    popup.addEventListener('focusin', () => popup.classList.remove('is-dismissed'));
    popup.addEventListener('toggle', () => { if (popup.open) popup.classList.remove('is-dismissed'); });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const visible = (popup) => popup.getClientRects().length > 0 && (popup.open || (popup.matches(':hover, :focus-within') && !popup.classList.contains('is-dismissed')));
    const focused = event.target.closest?.('details.chart-info');
    const popup = focused && visible(focused) ? focused : popups.find(visible);
    if (!popup) return;
    popup.open = false;
    popup.querySelector('summary').focus({ preventScroll: true });
    popup.classList.add('is-dismissed');
    event.preventDefault();
    event.stopPropagation();
    window.ReportEmbed?.notify();
  }, true);
  [...flipRow.children].forEach((chart, i) => {
    const column = document.createElement('div');
    column.className = 'flip-column';
    column.innerHTML = `<div class="chart-subtitle">${i ? 'b. Latest snapshot' : 'a. First snapshot'}</div>`;
    flipRow.insertBefore(column, chart);
    column.append(chart);
  });
  let current = 'overview', insightPage = 0;
  function updateInsight() {
    el('view-insight').textContent = insightPage ? secondary[current].replace(/\s+/g, ' ').trim() : leads[current];
    sidebar.querySelectorAll('.insight-pages button').forEach((button, i) => { button.classList.toggle('active', i === insightPage); button.setAttribute('aria-pressed', String(i === insightPage)); });
    window.ReportEmbed?.notify();
  }
  sidebar.querySelectorAll('.insight-pages button').forEach((button, i) => { button.onclick = () => { insightPage = i; updateInsight(); }; });
  el('viewSelect').onchange = () => window.DSH_CH5?.goToPage(el('viewSelect').value);
  el('groupSelect').onchange = () => el('groupSeg').querySelector(`[data-g="${el('groupSelect').value}"]`)?.click();
  el('clearFilters').onclick = () => {
    window.DSH_CH5?.setSelection(null);
    el('groupSelect').value = 'big7';
    el('groupSeg').querySelector('[data-g="big7"]')?.click();
    if (el('logToggle').textContent.includes('off')) el('logToggle').click();
  };
  el('synthesisFullscreen').onclick = () => {
    if (window.parent === window) location.assign('/explore/ch5/');
    else window.ReportEmbed?.requestFullscreen();
  };
  window.Ch5Layout = {
    sync(value) {
      if (current !== value.view) { current = value.view; insightPage = 0; }
      el('viewSelect').value = current;
      sidebar.querySelector('.organization-group').hidden = current !== 'institutions';
      sidebar.querySelector('.scale-control').hidden = current === 'overview';
      sidebar.querySelector('.organization-control').hidden = current === 'overview';
      const title = ({ overview: 'The shift', institutions: 'The organizations', linked: 'Compare the evidence' })[current];
      const brand = document.querySelector('.brand-title');
      brand.textContent = title;
      document.querySelector('.brand-sub').textContent = 'CHAPTER 5';
      el('groupSelect').value = value.category || 'big7';
      window.ReportEmbed?.ready({ title, help: 'Choose a view and select an organization to compare its rank, training cost, recorded-vote share, and listed-company market context. Different measures use different units and coverage.' });
      window.ReportEmbed?.setView({ view: current, selection: value.selection, category: value.category });
      updateInsight();
    },
    connect() { window.ReportEmbed?.onAction((action) => {
      if (action.selection !== undefined) window.DSH_CH5?.setSelection(action.selection || null);
      if (pages.includes(action.view)) window.DSH_CH5?.goToPage(action.view);
      if (['all', 'big7', 'small'].includes(action.category)) { el('groupSelect').value = action.category; el('groupSelect').dispatchEvent(new Event('change')); }
    }); },
  };
  updateInsight();
  window.addEventListener('report:resize', () => window.dispatchEvent(new Event('resize')));
  window.addEventListener('report:mode', () => window.dispatchEvent(new Event('resize')));
})();
