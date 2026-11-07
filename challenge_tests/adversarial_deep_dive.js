/**
 * adversarial_deep_dive.js
 * Deep-dive empirical stress harness for Challenger 1 verification.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("==============================================================================");
console.log("       EMPIRICAL CHALLENGER 1 — DEEP DIVE ADVERSARIAL STRESS HARNESS          ");
console.log("==============================================================================\n");

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScriptMatch = scriptMatches.find(m => m[1].includes('text/babel'));
const babelScript = babelScriptMatch[2];

// Extract functions
const scoreFuncMatch = babelScript.match(/function calculateScaledScore\([\s\S]*?\n    \}/);
const compositeFuncMatch = babelScript.match(/function calculateCompositeScore\([\s\S]*?\n    \}/);
const gridFuncMatch = babelScript.match(/function evaluateGridIn\([\s\S]*?\n    \}/);

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(scoreFuncMatch[0], sandbox);
vm.runInContext(compositeFuncMatch[0], sandbox);
vm.runInContext(gridFuncMatch[0], sandbox);

const { calculateScaledScore, calculateCompositeScore, evaluateGridIn } = sandbox;

let assertions = 0;
let passes = 0;
let failures = 0;

function assert(condition, testName, details = "") {
  assertions++;
  if (condition) {
    passes++;
  } else {
    failures++;
    console.error(`[FAIL] ${testName} -> ${details}`);
  }
}

// ------------------------------------------------------------------------------
// 1. ALL FRACTION WITH DECIMAL VARIATIONS
// ------------------------------------------------------------------------------
console.log("1. Stress-testing decimal-in-fraction rejection...");
const badFractionPatterns = [
  "1.5/3", "3/1.5", "0.5/2", "2/0.5", "1./2", "2/1.", ".5/2", "2/.5",
  "1.0/2", "2/1.0", "-1.5/3", "-3/1.5", "-.5/2", "-2/.5", "1.25/2.5",
  " 1.5 / 3 ", "\t1.5/3\n", "0.0/1", "1/0.0", "3.14/1", "1/3.14"
];

badFractionPatterns.forEach(pat => {
  const res = evaluateGridIn(pat, "0.5");
  assert(res.isCorrect === false, `Bad fraction pattern rejected: "${pat}"`, `got isCorrect=${res.isCorrect}`);
  assert(res.message.includes("Decimals in fractions not permitted") || res.message.includes("Invalid characters"), `Rejection message for "${pat}"`, `got "${res.message}"`);
});

// ------------------------------------------------------------------------------
// 2. REPEATING DECIMAL PRECISION & TOLERANCE BOUNDARY PROBING
// ------------------------------------------------------------------------------
console.log("\n2. Stress-testing repeating decimal tolerance boundaries...");
// For 1/3 (0.3333333333333333):
// Valid truncated / rounded:
assert(evaluateGridIn("0.333", "1/3").isCorrect === true, "1/3: '0.333' accepted");
assert(evaluateGridIn(".333", "1/3").isCorrect === true, "1/3: '.333' accepted");
assert(evaluateGridIn("0.3333", "1/3").isCorrect === true, "1/3: '0.3333' accepted");
assert(evaluateGridIn(".3333", "1/3").isCorrect === true, "1/3: '.3333' accepted");
assert(evaluateGridIn("0.33333", "1/3").isCorrect === true, "1/3: '0.33333' accepted");
assert(evaluateGridIn("1/3", "1/3").isCorrect === true, "1/3: '1/3' accepted");
assert(evaluateGridIn("2/6", "1/3").isCorrect === true, "1/3: '2/6' accepted");

// Invalid / erroneous roundings that must be REJECTED:
assert(evaluateGridIn("0.3334", "1/3").isCorrect === false, "1/3: '0.3334' rejected (leak test)");
assert(evaluateGridIn("0.334", "1/3").isCorrect === false, "1/3: '0.334' rejected");
assert(evaluateGridIn("0.332", "1/3").isCorrect === false, "1/3: '0.332' rejected");
assert(evaluateGridIn("0.33", "1/3").isCorrect === false, "1/3: '0.33' rejected (under-precision)");
assert(evaluateGridIn(".33", "1/3").isCorrect === false, "1/3: '.33' rejected (under-precision)");
assert(evaluateGridIn(".334", "1/3").isCorrect === false, "1/3: '.334' rejected");

// For 2/3 (0.6666666666666666):
assert(evaluateGridIn("0.666", "2/3").isCorrect === true, "2/3: '0.666' accepted");
assert(evaluateGridIn(".666", "2/3").isCorrect === true, "2/3: '.666' accepted");
assert(evaluateGridIn("0.667", "2/3").isCorrect === true, "2/3: '0.667' accepted");
assert(evaluateGridIn(".667", "2/3").isCorrect === true, "2/3: '.667' accepted");
assert(evaluateGridIn("0.6666", "2/3").isCorrect === true, "2/3: '0.6666' accepted");
assert(evaluateGridIn("0.6667", "2/3").isCorrect === true, "2/3: '0.6667' accepted");
assert(evaluateGridIn("0.6668", "2/3").isCorrect === false, "2/3: '0.6668' rejected (leak test)");
assert(evaluateGridIn("0.665", "2/3").isCorrect === false, "2/3: '0.665' rejected");
assert(evaluateGridIn("0.668", "2/3").isCorrect === false, "2/3: '0.668' rejected");
assert(evaluateGridIn("0.67", "2/3").isCorrect === false, "2/3: '0.67' rejected (under-precision)");

// Negative repeating decimals
assert(evaluateGridIn("-0.333", "-1/3").isCorrect === true, "-1/3: '-0.333' accepted");
assert(evaluateGridIn("-.333", "-1/3").isCorrect === true, "-1/3: '-.333' accepted");
assert(evaluateGridIn("-0.3334", "-1/3").isCorrect === false, "-1/3: '-0.3334' rejected");
assert(evaluateGridIn("-0.667", "-2/3").isCorrect === true, "-2/3: '-0.667' accepted");
assert(evaluateGridIn("-.667", "-2/3").isCorrect === true, "-2/3: '-.667' accepted");
assert(evaluateGridIn("-0.6668", "-2/3").isCorrect === false, "-2/3: '-0.6668' rejected");

// ------------------------------------------------------------------------------
// 3. SCORING ENGINE ALIASING & PARAMETER ACCURACY
// ------------------------------------------------------------------------------
console.log("\n3. Stress-testing section key aliasing across raw score matrix...");
// Verify that for all 784 RW raw score combinations, calling with 'reading_writing'
// produces the EXACT SAME result as 'reading-writing' and 'rw'.
let aliasMismatches = 0;
for (let m1 = 0; m1 <= 27; m1++) {
  for (let m2 = 0; m2 <= 27; m2++) {
    const r1 = calculateScaledScore(m1, m2, 'reading-writing');
    const r2 = calculateScaledScore(m1, m2, 'reading_writing');
    const r3 = calculateScaledScore(m1, m2, 'rw');
    if (r1.scaledScore !== r2.scaledScore || r1.scaledScore !== r3.scaledScore ||
        r1.tier !== r2.tier || r1.maxRaw !== r2.maxRaw) {
      aliasMismatches++;
    }
  }
}
assert(aliasMismatches === 0, "All 784 RW raw scores yield identical results across 'reading-writing', 'reading_writing', and 'rw'", `mismatches: ${aliasMismatches}`);

// Verify Math is distinct from RW
const rwScore = calculateScaledScore(20, 20, 'reading_writing');
const mathScore = calculateScaledScore(20, 20, 'math');
assert(rwScore.scaledScore === 680, "RW (20,20) scaled score is 680", `got ${rwScore.scaledScore}`);
assert(mathScore.scaledScore === 760, "Math (20,20) scaled score is 760", `got ${mathScore.scaledScore}`);
assert(rwScore.maxRaw === 54, "RW maxRaw is 54", `got ${rwScore.maxRaw}`);
assert(mathScore.maxRaw === 44, "Math maxRaw is 44", `got ${mathScore.maxRaw}`);

// ------------------------------------------------------------------------------
// 4. MOCK 1 OPTION DISTRIBUTION & ACCURACY
// ------------------------------------------------------------------------------
console.log("\n4. Verifying Mock 1 MC distribution and question structure...");
const startIdx = babelScript.indexOf('const QUESTION_TYPES =');
const endIdx = babelScript.indexOf('class ExamScaffoldEngine');
const dataSandbox = { console };
vm.createContext(dataSandbox);
const dataSnippet = babelScript.slice(startIdx, endIdx) + '\nthis.MOCK_1_DATA = MOCK_1_DATA;\n';
vm.runInContext(dataSnippet, dataSandbox);
const mock1 = dataSandbox.MOCK_1_DATA;

const dist = { A: 0, B: 0, C: 0, D: 0 };
let totalMC = 0;
mock1.forEach(q => {
  if (q.options) {
    totalMC++;
    dist[q.correctAnswer] = (dist[q.correctAnswer] || 0) + 1;
    // Check that option text exists
    const idx = { A: 0, B: 1, C: 2, D: 3 }[q.correctAnswer];
    assert(idx !== undefined, `Valid correctAnswer letter in ${q.id}`, `got ${q.correctAnswer}`);
    assert(typeof q.options[idx] === 'string' && q.options[idx].length > 0, `Non-empty option for ${q.id}`, `option: ${q.options[idx]}`);
  }
});

assert(totalMC === 86, "Mock 1 has 86 MC questions", `got ${totalMC}`);
assert(dist.A === 22, `Option A count: 22 (25.6%)`, `got ${dist.A}`);
assert(dist.B === 22, `Option B count: 22 (25.6%)`, `got ${dist.B}`);
assert(dist.C === 21, `Option C count: 21 (24.4%)`, `got ${dist.C}`);
assert(dist.D === 21, `Option D count: 21 (24.4%)`, `got ${dist.D}`);

console.log("\n==============================================================================");
console.log(`DEEP DIVE COMPLETE: ${assertions} assertions executed, ${passes} passed, ${failures} failed.`);
console.log("==============================================================================\n");

if (failures > 0) process.exit(1);
