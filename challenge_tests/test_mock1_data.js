const fs = require('fs');
const vm = require('vm');

// Extract Mock 1 data from index.html
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];

// Extract MOCK_1_RW_M1, MOCK_1_RW_M2, MOCK_1_MATH_M1, MOCK_1_MATH_M2, MOCK_1_DATA
// Let's create a sandbox with React/window mocks if needed
const sandbox = {
  console: console,
  window: {}
};
vm.createContext(sandbox);

// We can slice from `const QUESTION_TYPES` up to `const MOCK_1_DATA = ... ;`
const startIdx = babelScript.indexOf('const QUESTION_TYPES =');
const endIdx = babelScript.indexOf('class ExamScaffoldEngine');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end index for Mock 1 data in index.html");
  console.log("startIdx:", startIdx, "endIdx:", endIdx);
  process.exit(1);
}

const dataCode = babelScript.slice(startIdx, endIdx) + '\nthis.MOCK_1_DATA = MOCK_1_DATA;\n';
try {
  vm.runInContext(dataCode, sandbox);
} catch (e) {
  console.error("Error executing Mock 1 data snippet in VM:", e.message);
  process.exit(1);
}

const mock1Data = sandbox.MOCK_1_DATA;
console.log(`Successfully extracted MOCK_1_DATA! Total questions: ${mock1Data ? mock1Data.length : 0}\n`);

if (!Array.isArray(mock1Data)) {
  console.error("MOCK_1_DATA is not an array!");
  process.exit(1);
}

const issues = [];

// 1. Overall and Section counts
const rwM1 = mock1Data.filter(q => (q.section === 'reading-writing' || q.section === 'rw' || q.section === 'reading_writing') && q.module === 1);
const rwM2 = mock1Data.filter(q => (q.section === 'reading-writing' || q.section === 'rw' || q.section === 'reading_writing') && q.module === 2);
const mathM1 = mock1Data.filter(q => q.section === 'math' && q.module === 1);
const mathM2 = mock1Data.filter(q => q.section === 'math' && q.module === 2);

console.log(`RW M1 count: ${rwM1.length} (expected 27)`);
console.log(`RW M2 count: ${rwM2.length} (expected 27)`);
console.log(`Math M1 count: ${mathM1.length} (expected 22)`);
console.log(`Math M2 count: ${mathM2.length} (expected 22)`);
console.log(`Total count: ${mock1Data.length} (expected 98)\n`);

if (mock1Data.length !== 98) issues.push(`Total questions count ${mock1Data.length} !== 98`);
if (rwM1.length !== 27) issues.push(`RW M1 count ${rwM1.length} !== 27`);
if (rwM2.length !== 27) issues.push(`RW M2 count ${rwM2.length} !== 27`);
if (mathM1.length !== 22) issues.push(`Math M1 count ${mathM1.length} !== 22`);
if (mathM2.length !== 22) issues.push(`Math M2 count ${mathM2.length} !== 22`);

// 2. ID Uniqueness
const ids = new Set();
const duplicateIds = [];
mock1Data.forEach(q => {
  if (!q.id) {
    issues.push(`Question without ID found!`);
  } else if (ids.has(q.id)) {
    duplicateIds.push(q.id);
  } else {
    ids.add(q.id);
  }
});
if (duplicateIds.length > 0) {
  issues.push(`Duplicate question IDs found: ${duplicateIds.join(', ')}`);
} else {
  console.log(`✓ All ${ids.size} question IDs are strictly unique.`);
}

// 3. Grid-In question counts and verification
const mathGridIns = mock1Data.filter(q => q.section === 'math' && (q.options === null || q.options === undefined));
const mathGridInM1 = mathGridIns.filter(q => q.module === 1);
const mathGridInM2 = mathGridIns.filter(q => q.module === 2);
const mathMC = mock1Data.filter(q => q.section === 'math' && Array.isArray(q.options));

console.log(`Math Grid-In total: ${mathGridIns.length} (expected 12)`);
console.log(`Math Grid-In M1: ${mathGridInM1.length} (expected 6)`);
console.log(`Math Grid-In M2: ${mathGridInM2.length} (expected 6)`);
console.log(`Math MC total: ${mathMC.length} (expected 32)\n`);

if (mathGridIns.length !== 12) issues.push(`Math Grid-In total ${mathGridIns.length} !== 12`);
if (mathGridInM1.length !== 6) issues.push(`Math Grid-In M1 ${mathGridInM1.length} !== 6`);
if (mathGridInM2.length !== 6) issues.push(`Math Grid-In M2 ${mathGridInM2.length} !== 6`);
if (mathMC.length !== 32) issues.push(`Math MC total ${mathMC.length} !== 32`);

// 4. Schema verification on all 98 items
const validDomains = new Set([
  "craft-and-structure", "craft_and_structure",
  "information-and-ideas", "information_and_ideas",
  "standard-english-conventions", "standard_english_conventions",
  "expression-of-ideas", "expression_of_ideas",
  "algebra",
  "advanced-math", "advanced_math",
  "problem-solving-and-data-analysis", "problem_solving_data_analysis", "problem-solving-data-analysis",
  "geometry-and-trigonometry", "geometry_trigonometry", "geometry-trigonometry"
]);

const domainCounts = {};
const answerDist = { A: 0, B: 0, C: 0, D: 0, other: 0 };
let emptyExplanations = 0;
let invalidOptions = 0;
let missingStems = 0;

mock1Data.forEach((q, idx) => {
  // Domain check
  if (!q.domain || !validDomains.has(q.domain)) {
    issues.push(`Q[${idx}] ${q.id}: Invalid or missing domain '${q.domain}'`);
  }
  domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;

  // Stem check
  if (!q.stem || typeof q.stem !== 'string' || q.stem.trim() === '') {
    issues.push(`Q[${idx}] ${q.id}: Empty stem`);
    missingStems++;
  }

  // Explanation check
  if (!q.explanation || (typeof q.explanation === 'string' && q.explanation.trim() === '')) {
    issues.push(`Q[${idx}] ${q.id}: Missing or empty explanation`);
    emptyExplanations++;
  }

  // Options check
  const isGrid = q.options === null || q.options === undefined;
  if (!isGrid) {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      issues.push(`Q[${idx}] ${q.id}: Multiple choice options length !== 4 (got ${q.options ? q.options.length : 0})`);
      invalidOptions++;
    } else {
      q.options.forEach((opt, optIdx) => {
        if (typeof opt !== 'string' || opt.trim() === '') {
          issues.push(`Q[${idx}] ${q.id}: Option ${optIdx} is empty or not string`);
        }
      });
    }

    // Check MC correctAnswer
    const ans = String(q.correctAnswer).trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(ans)) {
      answerDist[ans]++;
    } else {
      answerDist.other++;
      issues.push(`Q[${idx}] ${q.id}: Non-standard MC correctAnswer '${q.correctAnswer}'`);
    }
  } else {
    // Grid-in correctAnswer check
    if (!q.correctAnswer) {
      issues.push(`Q[${idx}] ${q.id}: Grid-in question missing correctAnswer`);
    }
  }
});

console.log("Domain Distribution in Mock 1:");
Object.keys(domainCounts).sort().forEach(d => {
  console.log(`  ${d.padEnd(35)}: ${domainCounts[d]} questions`);
});

console.log("\nMultiple Choice Answer Distribution:");
console.log(`  A: ${answerDist.A} (${Math.round(answerDist.A / (mock1Data.length - 12) * 100)}%)`);
console.log(`  B: ${answerDist.B} (${Math.round(answerDist.B / (mock1Data.length - 12) * 100)}%)`);
console.log(`  C: ${answerDist.C} (${Math.round(answerDist.C / (mock1Data.length - 12) * 100)}%)`);
console.log(`  D: ${answerDist.D} (${Math.round(answerDist.D / (mock1Data.length - 12) * 100)}%)`);
if (answerDist.other > 0) {
  console.log(`  Other: ${answerDist.other}`);
}

console.log(`\nGrid-In Questions Sample:`);
mathGridIns.forEach((q, i) => {
  console.log(`  [${i + 1}] ID: ${q.id} | Domain: ${q.domain} | Answer: ${JSON.stringify(q.correctAnswer)} | Stem preview: "${q.stem.slice(0, 50)}..."`);
});

console.log(`\n======================================================`);
console.log(`Mock 1 Data Integrity Summary:`);
console.log(`Total questions analyzed: ${mock1Data.length}`);
console.log(`Total issues found: ${issues.length}`);
console.log(`======================================================`);

if (issues.length > 0) {
  console.log("\nIssues List:");
  issues.forEach((iss, i) => console.log(`  [${i + 1}] ${iss}`));
} else {
  console.log("\n✓ ALL 98 MOCK 1 QUESTIONS STRICTLY CONFORM TO BLUEPRINT AND SCHEMA!");
}
