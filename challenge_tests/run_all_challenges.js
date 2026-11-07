/**
 * ==============================================================================
 * run_all_challenges.js — Empirical Challenge Test Harness
 * Project: Digital SAT Test-Prep Single-File Web Application (index.html)
 * Challenger: teamwork_challenger (Challenger 1)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("==============================================================================");
console.log("          EMPIRICAL CHALLENGER 1 — ADVERSARIAL STRESS TEST SUITE              ");
console.log("==============================================================================\n");

// 1. Read index.html directly
const htmlPath = path.resolve(__dirname, '..', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error(`FATAL: Target codebase not found at ${htmlPath}`);
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract babel script
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScriptMatch = scriptMatches.find(m => m[1].includes('text/babel'));
if (!babelScriptMatch) {
  console.error("FATAL: text/babel script not found in index.html");
  process.exit(1);
}
const babelScript = babelScriptMatch[2];

// Metrics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureLog = [];

function recordResult(passed, category, testName, details = "") {
  totalTests++;
  if (passed) {
    passedTests++;
  } else {
    failedTests++;
    failureLog.push({ category, testName, details });
    console.error(`  [FAIL] [${category}] ${testName} ${details ? `-> ${details}` : ""}`);
  }
}

// ==============================================================================
// CHALLENGE SUITE 1: SCORING ENGINE EXHAUSTIVE STRESS & BOUNDARY TESTS
// ==============================================================================
console.log("------------------------------------------------------------------------------");
console.log("CHALLENGE SUITE 1: Scoring Engine Exhaustive Combinatorial Stress Test");
console.log("------------------------------------------------------------------------------");

// Extract scoring functions directly from index.html
const scoreFuncMatch = babelScript.match(/function calculateScaledScore\([\s\S]*?\n    \}/);
const compositeFuncMatch = babelScript.match(/function calculateCompositeScore\([\s\S]*?\n    \}/);

if (!scoreFuncMatch || !compositeFuncMatch) {
  console.error("FATAL: Could not extract scoring functions from index.html");
  process.exit(1);
}

const scoreSandbox = {};
vm.createContext(scoreSandbox);
vm.runInContext(scoreFuncMatch[0], scoreSandbox);
vm.runInContext(compositeFuncMatch[0], scoreSandbox);
const { calculateScaledScore, calculateCompositeScore } = scoreSandbox;

// 1.1 Reading & Writing: All 784 combinations (m1: 0..27, m2: 0..27)
const rwThreshold = 18;
const rwGrid = [];
let rwEasyCount = 0;
let rwHardCount = 0;

for (let m1 = 0; m1 <= 27; m1++) {
  rwGrid[m1] = [];
  for (let m2 = 0; m2 <= 27; m2++) {
    const res = calculateScaledScore(m1, m2, 'reading-writing');
    const score = res.scaledScore;
    const tier = res.tier;
    const expectedTier = m1 >= rwThreshold ? 'hard' : 'easy';
    rwGrid[m1][m2] = score;

    if (expectedTier === 'easy') rwEasyCount++;
    else rwHardCount++;

    // Tier correctness
    recordResult(tier === expectedTier, "Scoring-RW", `RW (${m1}, ${m2}) Tier Determination`, `got ${tier}, expected ${expectedTier}`);
    // Score range [200, 800]
    recordResult(score >= 200 && score <= 800, "Scoring-RW", `RW (${m1}, ${m2}) Score Range [200, 800]`, `got ${score}`);
    // 10-point quantization
    recordResult(score % 10 === 0, "Scoring-RW", `RW (${m1}, ${m2}) 10-Point Rounding`, `got ${score}`);
    // Easy cap <= 590
    if (expectedTier === 'easy') {
      recordResult(score <= 590, "Scoring-RW", `RW (${m1}, ${m2}) Easy Track Cap <= 590`, `got ${score}`);
    }
    // Hard floor >= 480
    if (expectedTier === 'hard') {
      recordResult(score >= 480, "Scoring-RW", `RW (${m1}, ${m2}) Hard Track Floor >= 480`, `got ${score}`);
    }
  }
}

// 1.2 Monotonicity in RW
// A) Increasing m2 for fixed m1
for (let m1 = 0; m1 <= 27; m1++) {
  for (let m2 = 0; m2 < 27; m2++) {
    const pass = rwGrid[m1][m2 + 1] >= rwGrid[m1][m2];
    recordResult(pass, "Scoring-RW-Monotonicity", `RW Monotonicity m2: m1=${m1}, m2=${m2}->${m2+1}`, `${rwGrid[m1][m2]} -> ${rwGrid[m1][m2+1]}`);
  }
}
// B) Increasing m1 within Easy (0..17)
for (let m1 = 0; m1 < 17; m1++) {
  for (let m2 = 0; m2 <= 27; m2++) {
    const pass = rwGrid[m1 + 1][m2] >= rwGrid[m1][m2];
    recordResult(pass, "Scoring-RW-Monotonicity", `RW Easy Monotonicity m1: m1=${m1}->${m1+1}, m2=${m2}`, `${rwGrid[m1][m2]} -> ${rwGrid[m1+1][m2]}`);
  }
}
// C) Increasing m1 within Hard (18..27)
for (let m1 = 18; m1 < 27; m1++) {
  for (let m2 = 0; m2 <= 27; m2++) {
    const pass = rwGrid[m1 + 1][m2] >= rwGrid[m1][m2];
    recordResult(pass, "Scoring-RW-Monotonicity", `RW Hard Monotonicity m1: m1=${m1}->${m1+1}, m2=${m2}`, `${rwGrid[m1][m2]} -> ${rwGrid[m1+1][m2]}`);
  }
}

// 1.3 Math: All 529 combinations (m1: 0..22, m2: 0..22)
const mathThreshold = 15;
const mathGrid = [];
let mathEasyCount = 0;
let mathHardCount = 0;

for (let m1 = 0; m1 <= 22; m1++) {
  mathGrid[m1] = [];
  for (let m2 = 0; m2 <= 22; m2++) {
    const res = calculateScaledScore(m1, m2, 'math');
    const score = res.scaledScore;
    const tier = res.tier;
    const expectedTier = m1 >= mathThreshold ? 'hard' : 'easy';
    mathGrid[m1][m2] = score;

    if (expectedTier === 'easy') mathEasyCount++;
    else mathHardCount++;

    // Tier correctness
    recordResult(tier === expectedTier, "Scoring-Math", `Math (${m1}, ${m2}) Tier Determination`, `got ${tier}, expected ${expectedTier}`);
    // Score range [200, 800]
    recordResult(score >= 200 && score <= 800, "Scoring-Math", `Math (${m1}, ${m2}) Score Range [200, 800]`, `got ${score}`);
    // 10-point quantization
    recordResult(score % 10 === 0, "Scoring-Math", `Math (${m1}, ${m2}) 10-Point Rounding`, `got ${score}`);
    // Easy cap <= 590
    if (expectedTier === 'easy') {
      recordResult(score <= 590, "Scoring-Math", `Math (${m1}, ${m2}) Easy Track Cap <= 590`, `got ${score}`);
    }
    // Hard floor >= 440
    if (expectedTier === 'hard') {
      recordResult(score >= 440, "Scoring-Math", `Math (${m1}, ${m2}) Hard Track Floor >= 440`, `got ${score}`);
    }
  }
}

// 1.4 Monotonicity in Math
for (let m1 = 0; m1 <= 22; m1++) {
  for (let m2 = 0; m2 < 22; m2++) {
    const pass = mathGrid[m1][m2 + 1] >= mathGrid[m1][m2];
    recordResult(pass, "Scoring-Math-Monotonicity", `Math Monotonicity m2: m1=${m1}, m2=${m2}->${m2+1}`, `${mathGrid[m1][m2]} -> ${mathGrid[m1][m2+1]}`);
  }
}
for (let m1 = 0; m1 < 14; m1++) {
  for (let m2 = 0; m2 <= 22; m2++) {
    const pass = mathGrid[m1 + 1][m2] >= mathGrid[m1][m2];
    recordResult(pass, "Scoring-Math-Monotonicity", `Math Easy Monotonicity m1: m1=${m1}->${m1+1}, m2=${m2}`, `${mathGrid[m1][m2]} -> ${mathGrid[m1+1][m2]}`);
  }
}
for (let m1 = 15; m1 < 22; m1++) {
  for (let m2 = 0; m2 <= 22; m2++) {
    const pass = mathGrid[m1 + 1][m2] >= mathGrid[m1][m2];
    recordResult(pass, "Scoring-Math-Monotonicity", `Math Hard Monotonicity m1: m1=${m1}->${m1+1}, m2=${m2}`, `${mathGrid[m1][m2]} -> ${mathGrid[m1+1][m2]}`);
  }
}

// 1.5 Composite Scoring (3,477 combinations)
const possibleRWScores = new Set();
const possibleMathScores = new Set();
for (let m1 = 0; m1 <= 27; m1++) for (let m2 = 0; m2 <= 27; m2++) possibleRWScores.add(rwGrid[m1][m2]);
for (let m1 = 0; m1 <= 22; m1++) for (let m2 = 0; m2 <= 22; m2++) possibleMathScores.add(mathGrid[m1][m2]);

for (const rw of possibleRWScores) {
  for (const math of possibleMathScores) {
    const comp = calculateCompositeScore(rw, math);
    recordResult(comp.composite >= 400 && comp.composite <= 1600, "Scoring-Composite", `Composite Bounds [400, 1600] for (${rw}, ${math})`, `got ${comp.composite}`);
    recordResult(comp.composite === rw + math, "Scoring-Composite", `Composite Sum Equality for (${rw}, ${math})`, `got ${comp.composite} !== ${rw + math}`);
    recordResult(comp.composite % 10 === 0, "Scoring-Composite", `Composite 10-Point Rounding for (${rw}, ${math})`, `got ${comp.composite}`);
  }
}

// 1.6 Section Name Alias Robustness (Adversarial challenge)
const rwHyphen = calculateScaledScore(20, 20, 'reading-writing');
const rwShort = calculateScaledScore(20, 20, 'rw');
const rwUnderscore = calculateScaledScore(20, 20, 'reading_writing');
recordResult(rwHyphen.scaledScore === rwShort.scaledScore, "Scoring-Alias", "Alias 'reading-writing' equals 'rw'", `${rwHyphen.scaledScore} vs ${rwShort.scaledScore}`);
recordResult(rwHyphen.scaledScore === rwUnderscore.scaledScore, "Scoring-Alias", "Alias 'reading_writing' (underscore canonical schema) correctly routed to RW scoring", `got score ${rwUnderscore.scaledScore} (Math scaling) instead of ${rwHyphen.scaledScore} (RW scaling)`);

console.log(`  Scoring Engine Tested: 1,313 Raw Pairs + 3,477 Composite Pairs = 4,790 Calculations`);
console.log(`  RW Easy Combinations: ${rwEasyCount}, RW Hard Combinations: ${rwHardCount}`);
console.log(`  Math Easy Combinations: ${mathEasyCount}, Math Hard Combinations: ${mathHardCount}`);


// ==============================================================================
// CHALLENGE SUITE 2: EVALUATEGRIDIN ADVERSARIAL FUZZING & BOUNDARY TESTS
// ==============================================================================
console.log("\n------------------------------------------------------------------------------");
console.log("CHALLENGE SUITE 2: Student-Produced Response evaluateGridIn Adversarial Fuzzing");
console.log("------------------------------------------------------------------------------");

const gridFuncMatch = babelScript.match(/function evaluateGridIn\([\s\S]*?\n    \}/);
if (!gridFuncMatch) {
  console.error("FATAL: Could not extract evaluateGridIn from index.html");
  process.exit(1);
}
const gridSandbox = {};
vm.createContext(gridSandbox);
vm.runInContext(gridFuncMatch[0], gridSandbox);
const evaluateGridIn = gridSandbox.evaluateGridIn;

const gridInCases = [
  // Integers
  { u: "42", t: "42", exp: true, desc: "Exact integer" },
  { u: "0", t: "0", exp: true, desc: "Exact zero" },
  { u: "-5", t: "-5", exp: true, desc: "Negative integer" },
  { u: "007", t: "7", exp: true, desc: "Leading zeroes integer" },

  // Decimals
  { u: "0.5", t: "0.5", exp: true, desc: "Decimal with leading zero" },
  { u: ".5", t: "0.5", exp: true, desc: "Decimal without leading zero (.5)" },
  { u: "2.500", t: "2.5", exp: true, desc: "Trailing zeroes decimal" },
  { u: "-2.5", t: "-5/2", exp: true, desc: "Negative decimal to fraction" },
  { u: "-.75", t: "-3/4", exp: true, desc: "Negative leading dot to fraction" },

  // Fractions & unsimplified
  { u: "3/4", t: "3/4", exp: true, desc: "Exact fraction" },
  { u: "6/8", t: "3/4", exp: true, desc: "Unsimplified fraction" },
  { u: "144/12", t: "12", exp: true, desc: "Unsimplified improper fraction" },
  { u: "-7/2", t: "-3.5", exp: true, desc: "Negative fraction to decimal" },
  { u: "0/1", t: "0", exp: true, desc: "Zero numerator fraction 0/1" },
  { u: "0/5", t: "0", exp: true, desc: "Zero numerator fraction 0/5" },

  // Whitespace trimming
  { u: "  3/4  ", t: "3/4", exp: true, desc: "Whitespace padding fraction" },
  { u: "\t12.5\n", t: "12.5", exp: true, desc: "Whitespace tab/newline" },

  // Target Arrays
  { u: "25/2", t: ["25/2", "12.5"], exp: true, desc: "Target array fraction" },
  { u: "12.5", t: ["25/2", "12.5"], exp: true, desc: "Target array decimal" },

  // Repeating Decimals (1/3)
  { u: "0.333", t: "1/3", exp: true, desc: "1/3 truncated 3 digits" },
  { u: ".333", t: "1/3", exp: true, desc: "1/3 leading dot truncated 3 digits" },
  { u: "0.3333", t: "1/3", exp: true, desc: "1/3 truncated 4 digits" },
  { u: ".3333", t: "1/3", exp: true, desc: "1/3 leading dot truncated 4 digits" },
  { u: "0.33333", t: "1/3", exp: true, desc: "1/3 5 digits" },
  { u: "0.334", t: "1/3", exp: false, desc: "1/3 false rounding 0.334" },
  { u: "0.332", t: "1/3", exp: false, desc: "1/3 false rounding 0.332" },

  // Repeating Decimals (2/3)
  { u: "0.666", t: "2/3", exp: true, desc: "2/3 truncated 3 digits" },
  { u: ".666", t: "2/3", exp: true, desc: "2/3 leading dot truncated 3 digits" },
  { u: "0.667", t: "2/3", exp: true, desc: "2/3 rounded 3 digits" },
  { u: ".667", t: "2/3", exp: true, desc: "2/3 leading dot rounded 3 digits" },
  { u: "0.6666", t: "2/3", exp: true, desc: "2/3 truncated 4 digits" },
  { u: "0.6667", t: "2/3", exp: true, desc: "2/3 rounded 4 digits" },
  { u: "0.665", t: "2/3", exp: false, desc: "2/3 false rounding 0.665" },
  { u: "0.668", t: "2/3", exp: false, desc: "2/3 false rounding 0.668" },

  // Repeating Decimals (1/6 = 0.16666...)
  { u: "0.166", t: "1/6", exp: true, desc: "1/6 truncated 3 digits" },
  { u: "0.167", t: "1/6", exp: true, desc: "1/6 rounded 3 digits" },

  // Negative Repeating Decimals (-2/3)
  { u: "-0.666", t: "-2/3", exp: true, desc: "-2/3 truncated 3 digits" },
  { u: "-.666", t: "-2/3", exp: true, desc: "-2/3 leading dot truncated 3 digits" },
  { u: "-0.667", t: "-2/3", exp: true, desc: "-2/3 rounded 3 digits" },
  { u: "-.667", t: "-2/3", exp: true, desc: "-2/3 leading dot rounded 3 digits" },

  // Illegal Formats
  { u: "1 1/2", t: "1.5", exp: false, desc: "Mixed number '1 1/2'" },
  { u: "1/2/3", t: "0.1666", exp: false, desc: "Multiple slashes '1/2/3'" },
  { u: "1.2.3", t: "1.23", exp: false, desc: "Multiple decimals '1.2.3'" },
  { u: "..5", t: "0.5", exp: false, desc: "Double dot '..5'" },
  { u: "--5", t: "5", exp: false, desc: "Double negative '--5'" },
  { u: "5-2", t: "3", exp: false, desc: "Embedded subtraction '5-2'" },
  { u: "-", t: "0", exp: false, desc: "Lone dash '-'" },
  { u: "/", t: "0", exp: false, desc: "Lone slash '/'" },
  { u: ".", t: "0", exp: false, desc: "Lone dot '.'" },
  { u: "-.", t: "0", exp: false, desc: "Lone negative dot '-.'" },
  { u: "5/0", t: "5", exp: false, desc: "Division by zero '5/0'" },
  { u: "-5/0", t: "-5", exp: false, desc: "Negative division by zero '-5/0'" },
  { u: "0/0", t: "0", exp: false, desc: "Zero divided by zero '0/0'" },
  { u: "abc", t: "5", exp: false, desc: "Alphabetic 'abc'" },
  { u: "5x", t: "5", exp: false, desc: "Alphanumeric '5x'" },
  { u: "$10", t: "10", exp: false, desc: "Symbol '$10'" },
  { u: "50%", t: "0.5", exp: false, desc: "Percent '50%'" },
  { u: "", t: "5", exp: false, desc: "Empty string" },
  { u: "   ", t: "5", exp: false, desc: "Whitespace string" },
  { u: null, t: "5", exp: false, desc: "null" },
  { u: undefined, t: "5", exp: false, desc: "undefined" },
  { u: "1e5", t: "100000", exp: false, desc: "Scientific notation '1e5'" },
  { u: "NaN", t: "0", exp: false, desc: "'NaN' string" },
  { u: "Infinity", t: "0", exp: false, desc: "'Infinity' string" },

  // Adversarial: Decimals inside fractions (SAT Prohibits)
  { u: "1.5/3", t: "0.5", exp: false, desc: "Decimal in numerator '1.5/3' (SAT Prohibits)" },
  { u: "3/1.5", t: "2", exp: false, desc: "Decimal in denominator '3/1.5' (SAT Prohibits)" },
  { u: "0.5/2", t: "0.25", exp: false, desc: "Decimal in numerator '0.5/2' (SAT Prohibits)" },

  // Adversarial: Tolerance Leakage
  { u: "0.3334", t: "1/3", exp: false, desc: "Tolerance leak check: 0.3334 for 1/3" },
  { u: "0.6668", t: "2/3", exp: false, desc: "Tolerance leak check: 0.6668 for 2/3" },
];

gridInCases.forEach(c => {
  const res = evaluateGridIn(c.u, c.t);
  recordResult(res.isCorrect === c.exp, "GridIn-Fuzz", c.desc, `input: "${c.u}", target: "${c.t}" -> expected ${c.exp}, got ${res.isCorrect} (msg: ${res.message})`);
});

console.log(`  Grid-In Fuzz Cases Executed: ${gridInCases.length}`);


// ==============================================================================
// CHALLENGE SUITE 3: MOCK 1 QUESTION BANK & SCHEMA INTEGRITY
// ==============================================================================
console.log("\n------------------------------------------------------------------------------");
console.log("CHALLENGE SUITE 3: Mock 1 Question Bank & Schema Conformance Integrity");
console.log("------------------------------------------------------------------------------");

const startIdx = babelScript.indexOf('const QUESTION_TYPES =');
const endIdx = babelScript.indexOf('class ExamScaffoldEngine');
const dataSandbox = { console };
vm.createContext(dataSandbox);
const dataSnippet = babelScript.slice(startIdx, endIdx) + '\nthis.MOCK_1_DATA = MOCK_1_DATA;\n';
vm.runInContext(dataSnippet, dataSandbox);
const mock1 = dataSandbox.MOCK_1_DATA;

// Counts
recordResult(Array.isArray(mock1), "Mock1-Schema", "Mock 1 is valid array", `type: ${typeof mock1}`);
recordResult(mock1.length === 98, "Mock1-Schema", "Mock 1 total questions == 98", `got ${mock1.length}`);

const rw1Qs = mock1.filter(q => q.section === 'reading-writing' && q.module === 1);
const rw2Qs = mock1.filter(q => q.section === 'reading-writing' && q.module === 2);
const math1Qs = mock1.filter(q => q.section === 'math' && q.module === 1);
const math2Qs = mock1.filter(q => q.section === 'math' && q.module === 2);

recordResult(rw1Qs.length === 27, "Mock1-Schema", "RW Module 1 has exactly 27 questions", `got ${rw1Qs.length}`);
recordResult(rw2Qs.length === 27, "Mock1-Schema", "RW Module 2 has exactly 27 questions", `got ${rw2Qs.length}`);
recordResult(math1Qs.length === 22, "Mock1-Schema", "Math Module 1 has exactly 22 questions", `got ${math1Qs.length}`);
recordResult(math2Qs.length === 22, "Mock1-Schema", "Math Module 2 has exactly 22 questions", `got ${math2Qs.length}`);

// ID Uniqueness
const idSet = new Set();
let duplicates = 0;
mock1.forEach(q => {
  if (idSet.has(q.id)) duplicates++;
  idSet.add(q.id);
});
recordResult(duplicates === 0, "Mock1-Schema", "All 98 question IDs are strictly unique", `duplicates: ${duplicates}`);

// Math Grid-Ins
const gridIns = mock1.filter(q => q.section === 'math' && (q.options === null || q.options === undefined));
const gridInM1 = gridIns.filter(q => q.module === 1);
const gridInM2 = gridIns.filter(q => q.module === 2);
recordResult(gridIns.length === 12, "Mock1-Schema", "Math has exactly 12 grid-in questions", `got ${gridIns.length}`);
recordResult(gridInM1.length === 6, "Mock1-Schema", "Math Module 1 has exactly 6 grid-in questions", `got ${gridInM1.length}`);
recordResult(gridInM2.length === 6, "Mock1-Schema", "Math Module 2 has exactly 6 grid-in questions", `got ${gridInM2.length}`);

// Domain validation and Schema fields
const validDomains = new Set([
  "craft-and-structure", "information-and-ideas",
  "standard-english-conventions", "expression-of-ideas",
  "algebra", "advanced-math",
  "problem-solving-and-data-analysis", "geometry-and-trigonometry"
]);

const answerKeyTally = { A: 0, B: 0, C: 0, D: 0, other: 0 };
let invalidDomains = 0;
let emptyStems = 0;
let emptyExplanations = 0;
let invalidOptions = 0;

mock1.forEach(q => {
  if (!validDomains.has(q.domain)) invalidDomains++;
  if (!q.stem || q.stem.trim() === '') emptyStems++;
  if (!q.explanation || q.explanation.trim() === '') emptyExplanations++;

  if (q.options) {
    if (q.options.length !== 4) invalidOptions++;
    const ans = String(q.correctAnswer).trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(ans)) {
      answerKeyTally[ans]++;
    } else {
      answerKeyTally.other++;
    }
  }
});

recordResult(invalidDomains === 0, "Mock1-Schema", "All 98 questions belong to valid SAT domains", `invalid: ${invalidDomains}`);
recordResult(emptyStems === 0, "Mock1-Schema", "All 98 questions have non-empty stems", `empty: ${emptyStems}`);
recordResult(emptyExplanations === 0, "Mock1-Schema", "All 98 questions have non-empty explanations", `empty: ${emptyExplanations}`);
recordResult(invalidOptions === 0, "Mock1-Schema", "All 86 MC questions have exactly 4 choices", `invalid: ${invalidOptions}`);

// Adversarial: Proper Answer Distribution Test
// A standard 4-choice standardized exam must balance answers across A, B, C, D (each ~20%-30%).
// An exam where any single option exceeds 50% or options have 0% violates proper answer distributions.
const mcTotal = mock1.length - gridIns.length; // 86
const aPercentage = Math.round((answerKeyTally.A / mcTotal) * 100);
const cPercentage = Math.round((answerKeyTally.C / mcTotal) * 100);
const dPercentage = Math.round((answerKeyTally.D / mcTotal) * 100);

console.log(`  MC Answer Key Counts: A: ${answerKeyTally.A} (${aPercentage}%), B: ${answerKeyTally.B}, C: ${answerKeyTally.C} (${cPercentage}%), D: ${answerKeyTally.D} (${dPercentage}%)`);

recordResult(aPercentage < 50, "Mock1-Distribution", "MC Answer Key Distribution: Option A < 50%", `Option A constitutes ${aPercentage}% (82 of 86 MC items)!`);
recordResult(answerKeyTally.C > 0, "Mock1-Distribution", "MC Answer Key Distribution: Option C > 0 items", `Option C has 0 items!`);
recordResult(answerKeyTally.D > 0, "Mock1-Distribution", "MC Answer Key Distribution: Option D > 0 items", `Option D has 0 items!`);


// ==============================================================================
// EMPIRICAL SUMMARY & REPORT GENERATION
// ==============================================================================
console.log("\n==============================================================================");
console.log("                       EMPIRICAL CHALLENGE SUMMARY                            ");
console.log("==============================================================================");
console.log(`Total Empirical Checks Executed : ${totalTests}`);
console.log(`Total Passed Checks             : ${passedTests}`);
console.log(`Total Failures / Vulnerabilities: ${failedTests}`);
console.log("==============================================================================\n");

if (failedTests > 0) {
  console.log(`Identified Defect / Failure Breakdown (${failedTests} failures):`);
  failureLog.forEach((f, idx) => {
    console.log(`  [Defect #${idx + 1}] [${f.category}] ${f.testName}`);
    if (f.details) console.log(`      Details: ${f.details}`);
  });
}

// Write JSON summary for report compiler
fs.writeFileSync(
  path.resolve(__dirname, 'challenge_results.json'),
  JSON.stringify({ totalTests, passedTests, failedTests, failureLog }, null, 2),
  'utf8'
);

console.log("\nSaved detailed test output to challenge_results.json");
