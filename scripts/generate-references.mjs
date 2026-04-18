// scripts/generate-references.mjs
// Generates reference PNG images from exercise answer files using typst CLI
import { execSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const exercisesDir = 'exercises';
const outputDir = 'public/references';
const preamblePath = join(exercisesDir, 'preamble.typ');

mkdirSync(outputDir, { recursive: true });

const preamble = readFileSync(preamblePath, 'utf-8');
const dirs = readdirSync(exercisesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const dir of dirs) {
  const answerPath = join(exercisesDir, dir, 'answer.typ');
  if (!existsSync(answerPath)) continue;

  const answer = readFileSync(answerPath, 'utf-8');
  const combined = preamble + '\n' + answer;

  // Write temp file
  const tmpPath = join(exercisesDir, dir, '_combined.typ');
  writeFileSync(tmpPath, combined);

  const outPath = join(outputDir, `${dir}.png`);

  try {
    execSync(`typst compile "${tmpPath}" "${outPath}"`, { stdio: 'inherit' });
    console.log(`✓ Generated ${outPath}`);
  } catch (e) {
    console.error(`✗ Failed to generate ${outPath}:`, e.message);
  } finally {
    unlinkSync(tmpPath);
  }
}

console.log('\nReference generation complete.');
