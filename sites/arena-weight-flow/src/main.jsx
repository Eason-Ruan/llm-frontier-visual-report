import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider, useLanguage } from './i18n.jsx';
import './styles.css';

function ErrorScreen({ error }) {
  const { language, setLanguage, t } = useLanguage();
  return <main style={{ padding: 48, fontFamily: 'Inter, sans-serif' }}>
    <div className="language-switch" role="group" aria-label={t('页面语言', 'Page language')}>
      <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
      <button lang="zh-CN" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
    </div>
    <h1>{t('页面暂时无法渲染', 'This page could not be displayed')}</h1>
    <p>{t('请刷新页面后重试。', 'Please refresh the page and try again.')}</p>
    <pre>{error.message}</pre>
  </main>;
}

class RenderBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<LanguageProvider><RenderBoundary><App /></RenderBoundary></LanguageProvider>);
