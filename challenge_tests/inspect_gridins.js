const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];
const startIdx = babelScript.indexOf('const QUESTION_TYPES =');
const endIdx = babelScript.indexOf('class ExamScaffoldEngine');
const dataCode = babelScript.slice(startIdx, endIdx) + '\nthis.MOCK_1_DATA = MOCK_1_DATA;\n';

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);

const gridIns = sandbox.MOCK_1_DATA.filter(q => q.options === null);
console.log('Total Math Grid-In Questions in Mock 1:', gridIns.length);
gridIns.forEach((q, i) => {
  console.log(`[${i + 1}] ID: ${q.id} (Module ${q.module})`);
  console.log(`    Domain: ${q.domain} | Type: ${q.questionType} | Difficulty: ${q.difficulty}`);
  console.log(`    Stem: ${q.stem}`);
  console.log(`    Answer: ${JSON.stringify(q.correctAnswer)}`);
  console.log(`    Explanation: ${q.explanation}\n`);
});
