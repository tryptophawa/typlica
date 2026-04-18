import answer01 from '../exercises/01-hello-world/answer.typ?raw';
import answer02 from '../exercises/02-text-styling/answer.typ?raw';
import answer03 from '../exercises/03-headings/answer.typ?raw';
import answer04 from '../exercises/04-lists/answer.typ?raw';
import answer05 from '../exercises/05-math/answer.typ?raw';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  answerCode: string;
  hint: string;
}

export const exercises: Exercise[] = [
  {
    id: '01-hello-world',
    title: '你好，世界！',
    description: '编写你的第一个 Typst 文档',
    instructions: '编写 Typst 代码，使输出内容为加粗的 "Hello, World!" 文本。\n\n提示：在 Typst 中，使用 `*文本*` 来加粗文字。',
    starterCode: '// 在下方编写你的第一个 Typst 文档\n',
    answerCode: answer01,
    hint: '直接输入 *Hello, World!* 试试看？',
  },
  {
    id: '02-text-styling',
    title: '文本样式',
    description: '学习使用粗体、斜体等文本样式',
    instructions: '使用 Typst 的文本样式语法，使输出满足以下要求：\n\n1. 第一行：用粗体写 "Typst"\n2. 第二行：用斜体写 "is awesome"\n3. 第三行：同时用粗体和斜体写 "really"',
    starterCode: '// 使用 *粗体* 和 _斜体_ 语法\n',
    answerCode: answer02,
    hint: '粗体用 *...* 包围，斜体用 _..._ 包围。嵌套使用可以同时生效。',
  },
  {
    id: '03-headings',
    title: '标题层级',
    description: '创建不同级别的标题',
    instructions: '创建一个包含不同级别标题的文档：\n\n1. 一级标题 "Introduction"\n2. 二级标题 "Background"\n3. 在二级标题下写一行正文 "Typst is a new typesetting system."\n4. 二级标题 "Goals"',
    starterCode: '// 使用 = 创建标题，== 创建二级标题\n',
    answerCode: answer03,
    hint: '= 是一级标题，== 是二级标题，=== 是三级标题。标题后面需要一个空格。',
  },
  {
    id: '04-lists',
    title: '列表',
    description: '创建有序和无序列表',
    instructions: '创建以下列表结构：\n\n一个无序列表包含：\n- Apples\n- Bananas\n- Cherries\n\n然后一个有序列表包含：\n1. First\n2. Second\n3. Third',
    starterCode: '// 用 - 创建无序列表，+ 创建有序列表\n',
    answerCode: answer04,
    hint: '无序列表用 - 开头，有序列表用 + 开头。每项之间需要换行。',
  },
  {
    id: '05-math',
    title: '数学公式',
    description: '编写数学方程式',
    instructions: '编写以下数学公式：\n\n1. 行内公式：写出 "The equation " 后跟行内公式 a² + b² = c²\n2. 换行后，写一个独立的块级公式：二次方程求根公式\n   x = (-b ± √(b² - 4ac)) / 2a',
    starterCode: '// 行内公式用 $...$，块级公式用 $ ... $（前后有空格/换行）\n',
    answerCode: answer05,
    hint: '行内公式 $a^2 + b^2 = c^2$，块级公式前后留空格。上标用 ^，分数用 /，根号用 sqrt()。',
  },
];

const STORAGE_KEY = 'typlica-progress';

interface Progress {
  [exerciseId: string]: {
    code: string;
    completed: boolean;
  };
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getSavedCode(exerciseId: string): string | null {
  const progress = loadProgress();
  return progress[exerciseId]?.code ?? null;
}

export function saveCode(exerciseId: string, code: string): void {
  const progress = loadProgress();
  if (!progress[exerciseId]) {
    progress[exerciseId] = { code, completed: false };
  } else {
    progress[exerciseId].code = code;
  }
  saveProgress(progress);
}

export function markCompleted(exerciseId: string): void {
  const progress = loadProgress();
  if (!progress[exerciseId]) {
    progress[exerciseId] = { code: '', completed: true };
  } else {
    progress[exerciseId].completed = true;
  }
  saveProgress(progress);
}

export function isCompleted(exerciseId: string): boolean {
  const progress = loadProgress();
  return progress[exerciseId]?.completed ?? false;
}

export function getCompletedCount(): number {
  const progress = loadProgress();
  return Object.values(progress).filter(p => p.completed).length;
}
