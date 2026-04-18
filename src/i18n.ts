export type Locale = 'zh-CN' | 'en';

const translations = {
  'zh-CN': {
    loading: '正在加载 Typst 编译器...',
    loadFailed: '编译器加载失败',
    loadFailedHint: '请检查网络连接并刷新页面重试。',
    progress: '进度：',
    btnCheck: '检查',
    btnReset: '重置',
    btnAnswer: '查看答案',
    btnHint: '提示',
    tabCurrent: '当前结果',
    tabExpected: '预期结果',
    tabDiff: '差异对比',
    labelCurrent: '当前结果',
    labelExpected: '预期结果',
    labelDiff: '差异对比',
    placeholderCurrent: '编写代码后将在此处显示结果',
    placeholderExpected: '加载中...',
    placeholderDiff: '编译完成后将自动显示差异',
    compilingExpected: '编译预期结果中...',
    answerCompileFailed: '答案编译失败',
    perfectMatch: '✓ 完美匹配!',
    switchLang: 'English',
  },
  'en': {
    loading: 'Loading Typst compiler...',
    loadFailed: 'Failed to load compiler',
    loadFailedHint: 'Please check your network connection and refresh.',
    progress: 'Progress: ',
    btnCheck: 'Check',
    btnReset: 'Reset',
    btnAnswer: 'Show Answer',
    btnHint: 'Hint',
    tabCurrent: 'Current',
    tabExpected: 'Expected',
    tabDiff: 'Diff',
    labelCurrent: 'Current Result',
    labelExpected: 'Expected Result',
    labelDiff: 'Diff',
    placeholderCurrent: 'Your result will appear here',
    placeholderExpected: 'Loading...',
    placeholderDiff: 'Diff will appear after compilation',
    compilingExpected: 'Compiling expected result...',
    answerCompileFailed: 'Answer compilation failed',
    perfectMatch: '✓ Perfect match!',
    switchLang: '中文',
  },
} as const;

type TranslationKey = keyof typeof translations['zh-CN'];

const LOCALE_KEY = 'typlica-locale';

let currentLocale: Locale = (() => {
  const stored = localStorage.getItem(LOCALE_KEY);
  return (stored === 'en' || stored === 'zh-CN') ? stored : 'zh-CN';
})();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem(LOCALE_KEY, locale);
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key];
}
