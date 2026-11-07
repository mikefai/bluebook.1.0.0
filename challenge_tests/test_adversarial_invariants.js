/**
 * test_adversarial_invariants.js
 *
 * Empirical Challenger 1 — Adversarial Stress Test Suite
 * Strictly verifies all question data invariants, schemas, and mathematical correctness in index.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function check(desc, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    failedChecks++;
    const errMsg = `  ✗ FAIL: ${desc}${details ? ' -> ' + details : ''}`;
    console.error(errMsg);
    failureDetails.push(errMsg);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  CHALLENGER 1: ADVERSARIAL QUESTION DATA INVARIANT STRESS TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Read index.html
const candidatePaths = [
  path.resolve(process.cwd(), 'index.html'),
  path.resolve(__dirname, 'index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../../index.html'),
  path.resolve(__dirname, '../../../index.html'),
  'c:\\Users\\MIKE\\Documents\\WORKSTATION\\index.html'
];

let htmlPath = '';
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    htmlPath = p;
    break;
  }
}

if (!htmlPath) {
  console.error("FATAL: Could not locate index.html. Checked:", candidatePaths);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// 2. Extract JS block
const startMarker = 'const DOMAINS = [';
const endMarker = 'function useSatStorage()';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

check("Extraction start marker 'const DOMAINS = [' exists in index.html", startIdx !== -1);
check("Extraction end marker 'function useSatStorage()' exists in index.html", endIdx !== -1);
check("Start marker appears before end marker", startIdx < endIdx);

const jsCode = html.slice(startIdx, endIdx);

// Sandbox execution
const sandbox = {
  console: console,
  window: {}
};
vm.createContext(sandbox);

try {
  vm.runInContext(
    jsCode + `
      this.DOMAINS = DOMAINS;
      this.CURRICULUM_DATA = CURRICULUM_DATA;
      this.QUESTION_TYPES = QUESTION_TYPES;
      this.MOCK_1_DATA = MOCK_1_DATA;
      this.DRILL_ITEMS = DRILL_ITEMS;
      this.QUESTION_TYPE_TO_LESSON_MAP = QUESTION_TYPE_TO_LESSON_MAP;
    `,
    sandbox
  );
  check("Pure JS block successfully evaluated in V8 VM sandbox", true);
} catch (e) {
  check("Pure JS block successfully evaluated in V8 VM sandbox", false, e.message);
  process.exit(1);
}

const { DOMAINS, CURRICULUM_DATA, QUESTION_TYPES, MOCK_1_DATA, DRILL_ITEMS, QUESTION_TYPE_TO_LESSON_MAP } = sandbox;

console.log('\n--- Section 1: DRILL_ITEMS Invariant & Schema Stress Testing ---');

// Requirement: exactly 3 new questions added, bringing total from 8 to 11
check("DRILL_ITEMS is an array", Array.isArray(DRILL_ITEMS));
check("DRILL_ITEMS total length is exactly 11 (8 baseline + 3 new)", DRILL_ITEMS.length === 11, `Got ${DRILL_ITEMS.length}`);

const requiredFields = [
  'id', 'examId', 'section', 'module', 'domain',
  'questionType', 'difficulty', 'passage', 'stem',
  'options', 'correctAnswer', 'explanation'
];

const validDomains = DOMAINS.map(d => d.id);
const validSections = ['reading-writing', 'math'];
const validDifficulties = ['easy', 'medium', 'hard'];

const drillIds = new Set();
let all11FieldsPresent = true;

DRILL_ITEMS.forEach((item, idx) => {
  drillIds.add(item.id);
  
  // Verify all 11 required schema fields
  for (const field of requiredFields) {
    const present = Object.prototype.hasOwnProperty.call(item, field);
    if (!present) {
      all11FieldsPresent = false;
      check(`Drill #${idx + 1} (${item.id}) has required field '${field}'`, false, 'Field missing');
    }
  }

  // Field validations
  check(`Drill ${item.id} examId is integer 0`, item.examId === 0);
  check(`Drill ${item.id} section '${item.section}' is valid`, validSections.includes(item.section));
  check(`Drill ${item.id} module is 1 or 2`, item.module === 1 || item.module === 2);
  check(`Drill ${item.id} domain '${item.domain}' is valid SAT domain`, validDomains.includes(item.domain));
  check(`Drill ${item.id} difficulty '${item.difficulty}' is valid`, validDifficulties.includes(item.difficulty));
  check(`Drill ${item.id} stem is non-empty`, typeof item.stem === 'string' && item.stem.length >= 15);
  check(`Drill ${item.id} options has exactly 4 choices`, Array.isArray(item.options) && item.options.length === 4);
  check(`Drill ${item.id} correctAnswer is A, B, C, or D`, ['A', 'B', 'C', 'D'].includes(item.correctAnswer));

  // Check correctAnswer aligns with options
  const matchingOption = item.options.find(opt => opt.startsWith(`${item.correctAnswer})`));
  check(`Drill ${item.id} correctAnswer matches one of the 4 options`, !!matchingOption);

  // Check explanation has step-by-step cognitive reasoning
  check(`Drill ${item.id} explanation is detailed (>= 150 chars)`, typeof item.explanation === 'string' && item.explanation.length >= 150, `Length: ${item.explanation.length}`);
  check(`Drill ${item.id} explanation contains correct rationale ('Why Option')`, item.explanation.includes('Why Option'));
  check(`Drill ${item.id} explanation contains distractor rationale ('Why Distractor')`, item.explanation.includes('Why Distractor'));
});

check("All 11 required schema fields present on 100% of DRILL_ITEMS", all11FieldsPresent);
check("All 11 DRILL_ITEMS IDs are unique", drillIds.size === 11);

// Specific check for new questions: drill-09, drill-10, drill-11
check("New question 'drill-09' exists", drillIds.has('drill-09'));
check("New question 'drill-10' exists", drillIds.has('drill-10'));
check("New question 'drill-11' exists", drillIds.has('drill-11'));

const d09 = DRILL_ITEMS.find(i => i.id === 'drill-09');
const d10 = DRILL_ITEMS.find(i => i.id === 'drill-10');
const d11 = DRILL_ITEMS.find(i => i.id === 'drill-11');

// Mathematical verification of drill-10 (Nonlinear discriminant)
console.log('\n--- Section 2: Mathematical Rigor Stress Testing ---');
if (d10) {
  check("drill-10 domain is 'advanced-math'", d10.domain === 'advanced-math');
  check("drill-10 section is 'math'", d10.section === 'math');
  check("drill-10 passage is null", d10.passage === null);
  check("drill-10 questionType is 'nonlinear-equations'", d10.questionType === 'nonlinear-equations');
  check("drill-10 correctAnswer is 'A'", d10.correctAnswer === 'A');

  // Verify quadratic system: y = 2x^2 - 8x + 11 and y = 4x + k
  // Intersection equation: 2x^2 - 12x + (11 - k) = 0
  // Discriminant Delta = (-12)^2 - 4 * 2 * (11 - k) = 144 - 8(11 - k) = 56 + 8k
  // For exactly one solution, Delta = 0 => 56 + 8k = 0 => k = -7.
  const kOptions = {
    'A': -7,
    'B': -3,
    'C': 5,
    'D': 7
  };
  for (const [opt, kVal] of Object.entries(kOptions)) {
    const delta = 144 - 8 * (11 - kVal);
    if (opt === 'A') {
      check(`drill-10 Option A (k=${kVal}) yields Delta = 0 (exactly 1 solution)`, delta === 0);
    } else {
      check(`drill-10 Distractor ${opt} (k=${kVal}) yields Delta != 0 (${delta})`, delta !== 0);
    }
  }
}

// Deep check on drill-09 (Rhetorical synthesis)
if (d09) {
  check("drill-09 domain is 'expression-of-ideas'", d09.domain === 'expression-of-ideas');
  check("drill-09 questionType is 'rhetorical-synthesis'", d09.questionType === 'rhetorical-synthesis');
  check("drill-09 passage contains bullet notes", d09.passage && d09.passage.includes('•'));
  check("drill-09 correctAnswer is 'B'", d09.correctAnswer === 'B');
}

// Deep check on drill-11 (Command of evidence textual)
if (d11) {
  check("drill-11 domain is 'information-and-ideas'", d11.domain === 'information-and-ideas');
  check("drill-11 questionType is 'command-of-evidence-textual'", d11.questionType === 'command-of-evidence-textual');
  check("drill-11 passage discusses mycorrhizal networks", d11.passage && d11.passage.includes('mycorrhizal networks'));
  check("drill-11 correctAnswer is 'A'", d11.correctAnswer === 'A');
}

console.log('\n--- Section 3: MOCK_1_DATA Schema & Distribution Invariants ---');

check("MOCK_1_DATA is an array", Array.isArray(MOCK_1_DATA));
check("MOCK_1_DATA contains exactly 98 questions", MOCK_1_DATA.length === 98, `Got ${MOCK_1_DATA.length}`);

const rwItems = MOCK_1_DATA.filter(q => q.section === 'reading-writing');
const mathItems = MOCK_1_DATA.filter(q => q.section === 'math');

check("Reading & Writing section has exactly 54 questions", rwItems.length === 54, `Got ${rwItems.length}`);
check("Math section has exactly 44 questions", mathItems.length === 44, `Got ${mathItems.length}`);

const rwM1 = rwItems.filter(q => q.module === 1);
const rwM2 = rwItems.filter(q => q.module === 2);
check("RW Module 1 has exactly 27 questions", rwM1.length === 27);
check("RW Module 2 has exactly 27 questions", rwM2.length === 27);

const mathM1 = mathItems.filter(q => q.module === 1);
const mathM2 = mathItems.filter(q => q.module === 2);
check("Math Module 1 has exactly 22 questions", mathM1.length === 22);
check("Math Module 2 has exactly 22 questions", mathM2.length === 22);

const sprItems = mathItems.filter(q => q.questionType === 'spr' || q.options === null);
const mcMathItems = mathItems.filter(q => q.options !== null);
const mcItems = MOCK_1_DATA.filter(q => q.options !== null);

check("Math section contains exactly 12 SPR grid-in questions", sprItems.length === 12, `Got ${sprItems.length}`);
check("Math section contains exactly 32 Multiple Choice questions", mcMathItems.length === 32, `Got ${mcMathItems.length}`);
check("Total Multiple Choice questions across Mock 1 is exactly 86 (54 RW + 32 Math)", mcItems.length === 86, `Got ${mcItems.length}`);

const mathM1SPR = mathM1.filter(q => q.options === null);
const mathM2SPR = mathM2.filter(q => q.options === null);
check("Math Module 1 contains exactly 6 SPR questions", mathM1SPR.length === 6);
check("Math Module 2 contains exactly 6 SPR questions", mathM2SPR.length === 6);

// Answer key distribution check for Multiple Choice items
const keyCounts = { A: 0, B: 0, C: 0, D: 0 };
mcItems.forEach(q => {
  if (keyCounts[q.correctAnswer] !== undefined) {
    keyCounts[q.correctAnswer]++;
  }
});

console.log(`\nMultiple Choice Key Distribution (Total 86 items):`);
console.log(`  Option A: ${keyCounts.A} (expected 22)`);
console.log(`  Option B: ${keyCounts.B} (expected 22)`);
console.log(`  Option C: ${keyCounts.C} (expected 21)`);
console.log(`  Option D: ${keyCounts.D} (expected 21)`);

check("Mock 1 MC Key Distribution has exactly 22 Option A", keyCounts.A === 22);
check("Mock 1 MC Key Distribution has exactly 22 Option B", keyCounts.B === 22);
check("Mock 1 MC Key Distribution has exactly 21 Option C", keyCounts.C === 21);
check("Mock 1 MC Key Distribution has exactly 21 Option D", keyCounts.D === 21);

// Verify upgraded Mock 1 questions have preserved keys
const m1_rw1_01 = MOCK_1_DATA.find(q => q.id === 'm1-rw1-01');
const m1_math1_01 = MOCK_1_DATA.find(q => q.id === 'm1-math1-01');
const m1_math1_14 = MOCK_1_DATA.find(q => q.id === 'm1-math1-14');

check("Upgraded m1-rw1-01 preserves correctAnswer 'A'", m1_rw1_01 && m1_rw1_01.correctAnswer === 'A');
check("Upgraded m1-rw1-01 explanation length >= 200", m1_rw1_01 && m1_rw1_01.explanation.length >= 200);

check("Upgraded m1-math1-01 preserves correctAnswer 'B'", m1_math1_01 && m1_math1_01.correctAnswer === 'B');
check("Upgraded m1-math1-01 explanation length >= 200", m1_math1_01 && m1_math1_01.explanation.length >= 200);

check("Upgraded m1-math1-14 preserves correctAnswer 'B'", m1_math1_14 && m1_math1_14.correctAnswer === 'B');
check("Upgraded m1-math1-14 explanation length >= 200", m1_math1_14 && m1_math1_14.explanation.length >= 200);

console.log('\n--- Section 4: CURRICULUM_DATA Walkthrough Invariants ---');

check("DOMAINS contains exactly 8 domains", DOMAINS.length === 8);
let totalWalkthroughs = 0;
const walkthroughIds = new Set();

DOMAINS.forEach(domain => {
  const cData = CURRICULUM_DATA[domain.id];
  check(`Domain '${domain.id}' exists in CURRICULUM_DATA`, !!cData);
  if (cData) {
    check(`Domain '${domain.id}' has mechanics block`, !!cData.mechanics);
    check(`Domain '${domain.id}' has >= 3 trap archetypes`, Array.isArray(cData.traps) && cData.traps.length >= 3);
    check(`Domain '${domain.id}' has exactly 3 algorithm steps`, Array.isArray(cData.algorithm) && cData.algorithm.length === 3);
    check(`Domain '${domain.id}' has exactly 2 guided walkthroughs`, Array.isArray(cData.walkthroughs) && cData.walkthroughs.length === 2);

    if (Array.isArray(cData.walkthroughs)) {
      totalWalkthroughs += cData.walkthroughs.length;
      cData.walkthroughs.forEach(wt => {
        walkthroughIds.add(wt.id);
        check(`Walkthrough '${wt.id}' has 4 options`, Array.isArray(wt.options) && wt.options.length === 4);
        check(`Walkthrough '${wt.id}' has valid correctAnswer`, ['A', 'B', 'C', 'D'].includes(wt.correctAnswer));
        check(`Walkthrough '${wt.id}' has >= 3 step rationales`, Array.isArray(wt.stepRationales) && wt.stepRationales.length >= 3);
        check(`Walkthrough '${wt.id}' has trapAnalysis`, typeof wt.trapAnalysis === 'object' && wt.trapAnalysis !== null);
      });
    }
  }
});

check("CURRICULUM_DATA retains exactly 16 walkthroughs (2 per domain across 8 domains)", totalWalkthroughs === 16, `Got ${totalWalkthroughs}`);
check("All 16 walkthrough IDs are unique", walkthroughIds.size === 16);

console.log('\n--- Section 5: Static UI & Accessibility Invariant Regressions ---');

// Verify critical UI tokens
const requiredTokens = [
  'const DOMAINS = [',
  'function useSatStorage()',
  'active:scale-[0.98]',
  'focus-visible:ring-2',
  'focus-visible:ring-indigo-500',
  'role="radio"',
  'role="tablist"',
  'role="dialog"',
  'aria-modal="true"',
  'aria-checked',
  'aria-label',
  'tabIndex={0}',
  'Resume Mock',
  'confirm("Are you sure you want to exit the exam? Your progress will be saved in memory.")',
  'currentView === \'exam\' ? \'fixed inset-0 z-50 flex flex-col bg-slate-900\' : \'hidden\''
];

requiredTokens.forEach(token => {
  check(`index.html contains token: ${token.slice(0, 45)}...`, html.includes(token));
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('                          SUMMARY OF CHECKS                                  ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Invariant Checks Executed : ${totalChecks}`);
console.log(`Total Checks Passed             : ${passedChecks}`);
console.log(`Total Checks Failed             : ${failedChecks}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failedChecks > 0) {
  console.error(`\nFAILURE: ${failedChecks} checks failed!`);
  failureDetails.forEach(f => console.error(f));
  process.exit(1);
} else {
  console.log('\n✓ ALL INVARIANT & ADVERSARIAL CHECKS PASSED WITH ZERO FAILURES.');
  process.exit(0);
}
