import './style.css';
import { initCompiler, compile } from './compiler';
import { exercises, Exercise, getSavedCode, saveCode, markCompleted, isCompleted, getCompletedCount } from './exercises';
import { createEditor, setEditorContent } from './editor';
import { computeDiff } from './diff';
import type { EditorView } from '@codemirror/view';

let currentExercise: Exercise = exercises[0];
let editorView: EditorView | null = null;
let compileTimeout: ReturnType<typeof setTimeout> | null = null;
let expectedSvgCache: Map<string, string> = new Map();
let activeTab: 'current' | 'expected' | 'diff' = 'current';
let hintVisible = false;
let compilerReady = false;

function renderApp(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="loading-overlay" id="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载 Typst 编译器...</div>
    </div>

    <header class="header">
      <div class="header-title">Typlica</div>
      <div class="header-progress">
        进度：<span class="count" id="progress-count">${getCompletedCount()}</span> / ${exercises.length}
      </div>
    </header>

    <nav class="exercise-nav" id="exercise-nav">
      ${exercises.map((ex, i) => `
        <button class="nav-btn ${ex.id === currentExercise.id ? 'active' : ''} ${isCompleted(ex.id) ? 'completed' : ''}"
                data-index="${i}">
          ${isCompleted(ex.id) ? '<span class="check">✓</span>' : ''}${i + 1}. ${ex.title}
        </button>
      `).join('')}
    </nav>

    <div class="main-container">
      <div class="left-panel">
        <div class="exercise-info">
          <div class="exercise-title" id="exercise-title">${currentExercise.title}</div>
          <div class="exercise-instructions" id="exercise-instructions">${formatInstructions(currentExercise.instructions)}</div>
        </div>
        <div class="editor-container" id="editor-container"></div>
        <div class="hint-panel ${hintVisible ? 'visible' : ''}" id="hint-panel">
          💡 ${currentExercise.hint}
        </div>
        <div class="editor-actions">
          <button class="btn btn-primary" id="btn-check">检查</button>
          <button class="btn" id="btn-reset">重置</button>
          <button class="btn" id="btn-answer">查看答案</button>
          <button class="btn btn-hint" id="btn-hint">提示</button>
        </div>
      </div>

      <div class="right-panel">
        <div class="preview-tabs">
          <button class="preview-tab ${activeTab === 'current' ? 'active' : ''}" data-tab="current">当前结果</button>
          <button class="preview-tab ${activeTab === 'expected' ? 'active' : ''}" data-tab="expected">预期结果</button>
          <button class="preview-tab ${activeTab === 'diff' ? 'active' : ''}" data-tab="diff">差异对比</button>
        </div>
        <div class="preview-sections show-tabs" id="preview-sections">
          <div class="preview-section ${activeTab === 'current' ? 'active' : ''}" id="preview-current">
            <div class="preview-label">当前结果</div>
            <div class="preview-content" id="current-content">
              <div class="preview-placeholder">编写代码后将在此处显示结果</div>
            </div>
          </div>
          <div class="preview-section ${activeTab === 'expected' ? 'active' : ''}" id="preview-expected">
            <div class="preview-label">预期结果</div>
            <div class="preview-content" id="expected-content">
              <div class="preview-placeholder">加载中...</div>
            </div>
          </div>
          <div class="preview-section ${activeTab === 'diff' ? 'active' : ''}" id="preview-diff">
            <div class="preview-label">差异对比</div>
            <div class="preview-content" id="diff-content">
              <div class="preview-placeholder">点击"检查"按钮进行对比</div>
            </div>
          </div>
        </div>
        <div class="match-status" id="match-status" style="display:none">
          <div class="match-bar">
            <div class="match-bar-fill" id="match-bar-fill" style="width:0%"></div>
          </div>
          <div class="match-text" id="match-text">—</div>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
  setupEditor();
}

function formatInstructions(text: string): string {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function setupEventListeners(): void {
  // Exercise navigation
  document.getElementById('exercise-nav')!.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement | null;
    if (!target) return;
    const index = parseInt(target.dataset.index!, 10);
    switchExercise(exercises[index]);
  });

  // Preview tabs
  document.querySelectorAll('.preview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = (tab as HTMLElement).dataset.tab as typeof activeTab;
      updatePreviewTabs();
    });
  });

  // Action buttons
  document.getElementById('btn-check')!.addEventListener('click', checkAnswer);
  document.getElementById('btn-reset')!.addEventListener('click', resetCode);
  document.getElementById('btn-answer')!.addEventListener('click', showAnswer);
  document.getElementById('btn-hint')!.addEventListener('click', toggleHint);
}

function setupEditor(): void {
  const container = document.getElementById('editor-container')!;
  const savedCode = getSavedCode(currentExercise.id);
  const initialCode = savedCode ?? currentExercise.starterCode;

  editorView = createEditor(container, initialCode, (code) => {
    saveCode(currentExercise.id, code);
    debouncedCompile(code);
  });
}

function updatePreviewTabs(): void {
  document.querySelectorAll('.preview-tab').forEach(tab => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.tab === activeTab);
  });
  document.querySelectorAll('.preview-section').forEach(section => {
    section.classList.toggle('active', section.id === `preview-${activeTab}`);
  });
}

function switchExercise(exercise: Exercise): void {
  if (exercise.id === currentExercise.id) return;
  currentExercise = exercise;
  hintVisible = false;
  activeTab = 'current';

  // Update nav
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', exercises[i].id === exercise.id);
  });

  // Update exercise info
  document.getElementById('exercise-title')!.textContent = exercise.title;
  document.getElementById('exercise-instructions')!.innerHTML = formatInstructions(exercise.instructions);
  document.getElementById('hint-panel')!.textContent = '💡 ' + exercise.hint;
  document.getElementById('hint-panel')!.classList.remove('visible');

  // Update editor
  const savedCode = getSavedCode(exercise.id);
  setEditorContent(editorView!, savedCode ?? exercise.starterCode);

  // Reset previews
  document.getElementById('current-content')!.innerHTML = '<div class="preview-placeholder">编写代码后将在此处显示结果</div>';
  document.getElementById('diff-content')!.innerHTML = '<div class="preview-placeholder">点击"检查"按钮进行对比</div>';
  (document.getElementById('match-status')! as HTMLElement).style.display = 'none';
  updatePreviewTabs();

  // Compile expected and current
  compileExpected();
  const code = savedCode ?? exercise.starterCode;
  if (code.trim()) {
    debouncedCompile(code);
  }
}

function debouncedCompile(code: string): void {
  if (compileTimeout) clearTimeout(compileTimeout);
  compileTimeout = setTimeout(() => compileUserCode(code), 300);
}

async function compileUserCode(code: string): Promise<void> {
  if (!compilerReady) return;

  const result = await compile(code);
  const container = document.getElementById('current-content')!;

  if (result.error) {
    container.innerHTML = `<div class="preview-error">${escapeHtml(result.error)}</div>`;
  } else {
    container.innerHTML = result.svg!;
  }
}

async function compileExpected(): Promise<void> {
  if (!compilerReady) return;

  const container = document.getElementById('expected-content')!;

  // Check cache first
  if (expectedSvgCache.has(currentExercise.id)) {
    container.innerHTML = expectedSvgCache.get(currentExercise.id)!;
    return;
  }

  container.innerHTML = '<div class="preview-placeholder">编译预期结果中...</div>';

  const result = await compile(currentExercise.answerCode);
  if (result.error) {
    container.innerHTML = `<div class="preview-error">答案编译失败: ${escapeHtml(result.error)}</div>`;
  } else {
    expectedSvgCache.set(currentExercise.id, result.svg!);
    container.innerHTML = result.svg!;
  }
}

async function checkAnswer(): Promise<void> {
  if (!compilerReady) return;

  const code = editorView!.state.doc.toString();
  const [currentResult, expectedResult] = await Promise.all([
    compile(code),
    getExpectedSvg(),
  ]);

  if (currentResult.error || !expectedResult) {
    updateMatchStatus(0);
    return;
  }

  try {
    const diff = await computeDiff(currentResult.svg!, expectedResult);
    const diffContainer = document.getElementById('diff-content')!;
    diffContainer.innerHTML = '';
    diff.diffCanvas.style.maxWidth = '100%';
    diff.diffCanvas.style.height = 'auto';
    diffContainer.appendChild(diff.diffCanvas);

    updateMatchStatus(diff.matchPercentage);

    // Auto-switch to diff tab
    activeTab = 'diff';
    updatePreviewTabs();

    // Mark as completed if match is very high
    if (diff.matchPercentage >= 99.5) {
      markCompleted(currentExercise.id);
      updateProgressAndNav();
    }
  } catch (e) {
    console.error('Diff computation failed:', e);
    document.getElementById('diff-content')!.innerHTML =
      '<div class="preview-error">对比计算失败</div>';
  }
}

async function getExpectedSvg(): Promise<string | null> {
  if (expectedSvgCache.has(currentExercise.id)) {
    return expectedSvgCache.get(currentExercise.id)!;
  }
  const result = await compile(currentExercise.answerCode);
  if (result.svg) {
    expectedSvgCache.set(currentExercise.id, result.svg);
  }
  return result.svg;
}

function updateMatchStatus(percentage: number): void {
  const statusEl = document.getElementById('match-status')! as HTMLElement;
  statusEl.style.display = 'flex';

  const fillEl = document.getElementById('match-bar-fill')!;
  const textEl = document.getElementById('match-text')!;

  fillEl.style.width = percentage.toFixed(1) + '%';

  let colorClass: string;
  if (percentage >= 99.5) {
    fillEl.style.backgroundColor = 'var(--success)';
    colorClass = 'perfect';
  } else if (percentage >= 90) {
    fillEl.style.backgroundColor = 'var(--warning)';
    colorClass = 'close';
  } else {
    fillEl.style.backgroundColor = 'var(--error)';
    colorClass = 'far';
  }

  textEl.className = 'match-text ' + colorClass;
  textEl.textContent = percentage >= 99.5 ? '✓ 完美匹配!' : percentage.toFixed(1) + '%';
}

function updateProgressAndNav(): void {
  document.getElementById('progress-count')!.textContent = String(getCompletedCount());
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    const ex = exercises[i];
    if (isCompleted(ex.id)) {
      btn.classList.add('completed');
      if (!btn.querySelector('.check')) {
        btn.innerHTML = `<span class="check">✓</span>${btn.textContent!.trim()}`;
      }
    }
  });
}

function resetCode(): void {
  setEditorContent(editorView!, currentExercise.starterCode);
  saveCode(currentExercise.id, currentExercise.starterCode);
}

function showAnswer(): void {
  setEditorContent(editorView!, currentExercise.answerCode);
  saveCode(currentExercise.id, currentExercise.answerCode);
}

function toggleHint(): void {
  hintVisible = !hintVisible;
  document.getElementById('hint-panel')!.classList.toggle('visible', hintVisible);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Bootstrap
async function init(): Promise<void> {
  renderApp();

  try {
    await initCompiler();
    compilerReady = true;
    const loading = document.getElementById('loading');
    if (loading) loading.remove();

    // Compile expected result for current exercise
    await compileExpected();

    // Compile initial code if any
    const code = editorView?.state.doc.toString() ?? '';
    if (code.trim()) {
      await compileUserCode(code);
    }
  } catch (e) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <div style="color: var(--error); font-size: 16px;">编译器加载失败</div>
        <div style="color: var(--text-secondary); font-size: 13px; max-width: 400px; text-align: center;">
          ${escapeHtml(e instanceof Error ? e.message : String(e))}<br><br>
          请检查网络连接并刷新页面重试。
        </div>
      `;
    }
  }
}

init();
