// The standalone site keeps its Storyboard and language controls. The report
// build is a reproducible, English-only dashboard embed of the same source.
export const REPORT_EMBED = import.meta.env.MODE === 'report';
