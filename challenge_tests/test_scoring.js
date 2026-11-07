const fs = require('fs');
const vm = require('vm');

// Extract calculateScaledScore and calculateCompositeScore from index.html
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];

const scoreFuncMatch = babelScript.match(/function calculateScaledScore\([\s\S]*?\n    \}/);
const compositeFuncMatch = babelScript.match(/function calculateCompositeScore\([\s\S]*?\n    \}/);

if (!scoreFuncMatch || !compositeFuncMatch) {
  console.error("Could not extract scoring functions from index.html");
  process.exit(1);
}

const context = {};
vm.createContext(context);
vm.runInContext(scoreFuncMatch[0], context);
vm.runInContext(compositeFuncMatch[0], context);

const { calculateScaledScore, calculateCompositeScore } = context;
console.log("Successfully extracted calculateScaledScore and calculateCompositeScore from index.html\n");

const violations = [];
let totalScoringTests = 0;

// =========================================================================
// 1. Reading & Writing: All combinations (m1: 0..27, m2: 0..27) = 784 pairs
// =========================================================================
console.log("=== Testing Reading & Writing Scoring Grid (28 x 28 = 784 combinations) ===");
const rwThreshold = 18;
const rwGrid = [];

for (let m1 = 0; m1 <= 27; m1++) {
  rwGrid[m1] = [];
  for (let m2 = 0; m2 <= 27; m2++) {
    totalScoringTests++;
    const res = calculateScaledScore(m1, m2, 'reading-writing');
    const score = res.scaledScore;
    const tier = res.tier;
    const expectedTier = m1 >= rwThreshold ? 'hard' : 'easy';
    rwGrid[m1][m2] = score;

    // Check tier determination
    if (tier !== expectedTier) {
      violations.push(`RW (${m1}, ${m2}): tier is ${tier}, expected ${expectedTier}`);
    }

    // Check bounds: [200, 800]
    if (score < 200 || score > 800) {
      violations.push(`RW (${m1}, ${m2}): score ${score} out of bounds [200, 800]`);
    }

    // Check 10-point rounding
    if (score % 10 !== 0) {
      violations.push(`RW (${m1}, ${m2}): score ${score} not quantized to multiple of 10`);
    }

    // Check Easy track cap (<= 590)
    if (expectedTier === 'easy' && score > 590) {
      violations.push(`RW (${m1}, ${m2}) Easy tier: score ${score} exceeds cap of 590`);
    }

    // Check Hard track floor (>= 480)
    if (expectedTier === 'hard' && score < 480) {
      violations.push(`RW (${m1}, ${m2}) Hard tier: score ${score} below floor of 480`);
    }
  }
}

// Check RW Monotonicity:
// A) Monotonicity with respect to m2 for every fixed m1
for (let m1 = 0; m1 <= 27; m1++) {
  for (let m2 = 0; m2 < 27; m2++) {
    if (rwGrid[m1][m2 + 1] < rwGrid[m1][m2]) {
      violations.push(`RW Monotonicity failure: m1=${m1}, m2=${m2} (${rwGrid[m1][m2]}) > m2=${m2 + 1} (${rwGrid[m1][m2 + 1]})`);
    }
  }
}

// B) Monotonicity with respect to m1 within Easy tier (0..17)
for (let m1 = 0; m1 < 17; m1++) {
  for (let m2 = 0; m2 <= 27; m2++) {
    if (rwGrid[m1 + 1][m2] < rwGrid[m1][m2]) {
      violations.push(`RW Easy tier m1 Monotonicity failure: m1=${m1} (${rwGrid[m1][m2]}) > m1=${m1 + 1} (${rwGrid[m1 + 1][m2]}) at m2=${m2}`);
    }
  }
}

// C) Monotonicity with respect to m1 within Hard tier (18..27)
for (let m1 = 18; m1 < 27; m1++) {
  for (let m2 = 0; m2 <= 27; m2++) {
    if (rwGrid[m1 + 1][m2] < rwGrid[m1][m2]) {
      violations.push(`RW Hard tier m1 Monotonicity failure: m1=${m1} (${rwGrid[m1][m2]}) > m1=${m1 + 1} (${rwGrid[m1 + 1][m2]}) at m2=${m2}`);
    }
  }
}

// =========================================================================
// 2. Math: All combinations (m1: 0..22, m2: 0..22) = 529 pairs
// =========================================================================
console.log("=== Testing Math Scoring Grid (23 x 23 = 529 combinations) ===");
const mathThreshold = 15;
const mathGrid = [];

for (let m1 = 0; m1 <= 22; m1++) {
  mathGrid[m1] = [];
  for (let m2 = 0; m2 <= 22; m2++) {
    totalScoringTests++;
    const res = calculateScaledScore(m1, m2, 'math');
    const score = res.scaledScore;
    const tier = res.tier;
    const expectedTier = m1 >= mathThreshold ? 'hard' : 'easy';
    mathGrid[m1][m2] = score;

    // Check tier determination
    if (tier !== expectedTier) {
      violations.push(`Math (${m1}, ${m2}): tier is ${tier}, expected ${expectedTier}`);
    }

    // Check bounds: [200, 800]
    if (score < 200 || score > 800) {
      violations.push(`Math (${m1}, ${m2}): score ${score} out of bounds [200, 800]`);
    }

    // Check 10-point rounding
    if (score % 10 !== 0) {
      violations.push(`Math (${m1}, ${m2}): score ${score} not quantized to multiple of 10`);
    }

    // Check Easy track cap (<= 590)
    if (expectedTier === 'easy' && score > 590) {
      violations.push(`Math (${m1}, ${m2}) Easy tier: score ${score} exceeds cap of 590`);
    }

    // Check Hard track floor (>= 440 per dispatch mandate)
    if (expectedTier === 'hard' && score < 440) {
      violations.push(`Math (${m1}, ${m2}) Hard tier: score ${score} below floor of 440`);
    }
  }
}

// Check Math Monotonicity:
// A) Monotonicity with respect to m2 for every fixed m1
for (let m1 = 0; m1 <= 22; m1++) {
  for (let m2 = 0; m2 < 22; m2++) {
    if (mathGrid[m1][m2 + 1] < mathGrid[m1][m2]) {
      violations.push(`Math Monotonicity failure: m1=${m1}, m2=${m2} (${mathGrid[m1][m2]}) > m2=${m2 + 1} (${mathGrid[m1][m2 + 1]})`);
    }
  }
}

// B) Monotonicity with respect to m1 within Easy tier (0..14)
for (let m1 = 0; m1 < 14; m1++) {
  for (let m2 = 0; m2 <= 22; m2++) {
    if (mathGrid[m1 + 1][m2] < mathGrid[m1][m2]) {
      violations.push(`Math Easy tier m1 Monotonicity failure: m1=${m1} (${mathGrid[m1][m2]}) > m1=${m1 + 1} (${mathGrid[m1 + 1][m2]}) at m2=${m2}`);
    }
  }
}

// C) Monotonicity with respect to m1 within Hard tier (15..22)
for (let m1 = 15; m1 < 22; m1++) {
  for (let m2 = 0; m2 <= 22; m2++) {
    if (mathGrid[m1 + 1][m2] < mathGrid[m1][m2]) {
      violations.push(`Math Hard tier m1 Monotonicity failure: m1=${m1} (${mathGrid[m1][m2]}) > m1=${m1 + 1} (${mathGrid[m1 + 1][m2]}) at m2=${m2}`);
    }
  }
}

// =========================================================================
// 3. Composite Score Stress Testing
// =========================================================================
console.log("=== Testing Composite Scores across entire Section Matrix ===");
let compositeViolations = 0;
// Test all possible pairs of (RW score, Math score)
const possibleRWScores = new Set();
const possibleMathScores = new Set();
for (let m1 = 0; m1 <= 27; m1++) for (let m2 = 0; m2 <= 27; m2++) possibleRWScores.add(rwGrid[m1][m2]);
for (let m1 = 0; m1 <= 22; m1++) for (let m2 = 0; m2 <= 22; m2++) possibleMathScores.add(mathGrid[m1][m2]);

console.log(`Unique RW scaled scores: ${possibleRWScores.size} (min: ${Math.min(...possibleRWScores)}, max: ${Math.max(...possibleRWScores)})`);
console.log(`Unique Math scaled scores: ${possibleMathScores.size} (min: ${Math.min(...possibleMathScores)}, max: ${Math.max(...possibleMathScores)})`);

for (const rw of possibleRWScores) {
  for (const math of possibleMathScores) {
    const comp = calculateCompositeScore(rw, math);
    if (comp.composite < 400 || comp.composite > 1600) {
      violations.push(`Composite out of range: ${rw} + ${math} = ${comp.composite}`);
      compositeViolations++;
    }
    if (comp.composite !== rw + math) {
      violations.push(`Composite sum mismatch: ${comp.composite} !== ${rw} + ${math}`);
      compositeViolations++;
    }
    if (comp.composite % 10 !== 0) {
      violations.push(`Composite not quantized to 10: ${comp.composite}`);
      compositeViolations++;
    }
  }
}

// =========================================================================
// 4. Section string name robustness test
// =========================================================================
console.log("=== Testing Section Name Aliases ===");
const rw1 = calculateScaledScore(20, 20, 'reading-writing');
const rw2 = calculateScaledScore(20, 20, 'rw');
const rw3 = calculateScaledScore(20, 20, 'reading_writing');
if (rw1.scaledScore !== rw2.scaledScore) {
  violations.push(`Section alias inconsistency: 'reading-writing' (${rw1.scaledScore}) !== 'rw' (${rw2.scaledScore})`);
}
if (rw1.scaledScore !== rw3.scaledScore) {
  violations.push(`Section alias BUG: 'reading_writing' (underscore) yields Math scaling (${rw3.scaledScore}) instead of RW (${rw1.scaledScore})!`);
}

console.log(`\n======================================================`);
console.log(`Scoring Engine Stress Test Complete:`);
console.log(`Total Score Calculations Tested: ${totalScoringTests}`);
console.log(`Total Violations / Bugs Found: ${violations.length}`);
console.log(`======================================================`);

if (violations.length > 0) {
  console.log("\nViolations List:");
  violations.forEach((v, idx) => console.log(`  [${idx + 1}] ${v}`));
} else {
  console.log("\n✓ ALL SCORING ENGINE STRESS ASSERTIONS PASSED!");
}
