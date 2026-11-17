import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { REPORT_EMBED } from './runtime.js';

const STORAGE_KEY = 'arena-fieldnotes-language';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (REPORT_EMBED) return 'en';
    try { return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en'; }
    catch { return 'en'; }
  });
  const setLanguage = useCallback(next => { if (next === 'en' || next === 'zh') setLanguageState(next); }, []);
  const t = useCallback((zh, en) => language === 'zh' ? zh : en, [language]);
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    try { if (!REPORT_EMBED) localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage may be disabled. */ }
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t('Arena 历史榜单的权重与许可组成：探索 Top10 / Top50 排名、组成与前沿差距，并阅读联动故事。', 'Explore open- and closed-weight models across historical Arena rankings, composition and frontier gaps in an interactive dashboard and linked storyboard.');
  }, [language, t]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage requires LanguageProvider');
  return value;
}

const access = {
  apacheMit: ['开权重 · Apache / MIT', 'Open-weight · Apache / MIT'],
  otherOpen: ['开权重 · 其他许可', 'Open-weight · Other licenses'],
  closed: ['闭权重', 'Closed-weight'],
  unknown: ['未知', 'Unknown'],
};
const stacks = { all: ['整体堆叠', 'Overall stack'], tiers: ['三区堆叠', 'Three rank bands'] };
export const accessLabel = (kind, language) => (access[kind] || access.unknown)[language === 'zh' ? 0 : 1];
export const stackLabel = (id, language) => (stacks[id] || stacks.all)[language === 'zh' ? 0 : 1];

const categoryNames = {
  overall: 'Overall', coding: 'Coding', math: 'Math', instruction_following: 'Instruction following',
  creative_writing: 'Creative writing', expert: 'Expert prompts', hard_prompts: 'Hard prompts',
  hard_prompts_english: 'Hard prompts (English)', longer_query: 'Longer queries', multi_turn: 'Multi-turn',
  chinese: 'Chinese', english: 'English', non_english: 'Non-English', french: 'French', german: 'German',
  japanese: 'Japanese', korean: 'Korean', spanish: 'Spanish', russian: 'Russian', polish: 'Polish',
  industry_software_and_it_services: 'Software & IT services', industry_mathematical: 'Mathematical fields',
  industry_business_and_management_and_financial_operations: 'Business, management & finance',
  industry_legal_and_government: 'Law & government', industry_medicine_and_healthcare: 'Medicine & healthcare',
  industry_life_and_physical_and_social_science: 'Life, physical & social sciences',
  industry_entertainment_and_sports_and_media: 'Entertainment, sports & media',
  industry_writing_and_literature_and_language: 'Writing, literature & language', exclude_ties: 'Exclude tied battles',
};
const groupNames = { '综合与能力': 'Overall & capabilities', '语言': 'Languages', '行业': 'Industries', '统计口径': 'Scoring filters' };
export function categoryLabel(category, language) {
  if (!category) return language === 'zh' ? '综合榜单' : 'Overall';
  if (language === 'zh') return category.label;
  return categoryNames[category.id] || category.id.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase());
}
export const groupLabel = (group, language) => language === 'zh' ? group : groupNames[group] || group;

// Model IDs, company names and license evidence stay exactly as supplied.
// Only presentation fallbacks are translated; the provenance files are intact.
const sourceFallbacks = { '未知': 'Unknown', '未记录': 'Not recorded', '许可证未记录': 'License not recorded', '无数据': 'No data' };
export const sourceText = (value, language) => language === 'zh' ? value : sourceFallbacks[value] || value;
