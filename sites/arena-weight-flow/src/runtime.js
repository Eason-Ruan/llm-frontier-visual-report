// Keep standalone report builds dashboard-only; native embed UI is query-driven.
export const EMBED_MODE = new URLSearchParams(location.search).get('embed') === '1';
export const REPORT_EMBED = import.meta.env.MODE === 'report' || EMBED_MODE;
