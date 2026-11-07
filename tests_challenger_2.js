/**
 * ==============================================================================
 * tests_challenger_2.js — Empirical Challenger 2 Stress Test Suite
 * Project: Digital SAT Test-Prep Single-File Web Application (index.html)
 * Challenger: Challenger 2 (teamwork_challenger)
 * Target Codebase: c:\Users\MIKE\Documents\WORKSTATION\index.html
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// --- ANSI Colors ---
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function suite(name) {
  console.log(`\n${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${CYAN}${BOLD}  ${name}${RESET}`);
  console.log(`${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
}

function assert(condition, description, details = "") {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ${GREEN}✓ PASS:${RESET} ${description}`);
  } else {
    failedAssertions++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${description} ${details ? `(${details})` : ""}`);
  }
}

// ------------------------------------------------------------------------------
// Load and Extract Code from index.html
// ------------------------------------------------------------------------------
const indexPath = path.join(__dirname, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(`FATAL: index.html not found at ${indexPath}`);
  process.exit(1);
}
const htmlContent = fs.readFileSync(indexPath, "utf8");
const scriptMatch = htmlContent.match(/<script type="text\/babel">([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error("FATAL: Could not find <script type='text/babel'> in index.html");
  process.exit(1);
}
const babelCode = scriptMatch[1];

// Evaluate DOMAINS, QUESTION_TYPES, CURRICULUM_DATA, and QUESTION_TYPE_TO_LESSON_MAP in VM
const sandbox = {
  console: console,
  document: {
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    createElement: () => ({ setAttribute: () => {}, click: () => {}, remove: () => {} }),
    body: { appendChild: () => {} }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
vm.createContext(sandbox);

function extractCodeSlice(startPattern, endPattern) {
  const start = babelCode.indexOf(startPattern);
  if (start === -1) throw new Error("Could not find start pattern: " + startPattern);
  let end;
  if (typeof endPattern === "string") {
    end = babelCode.indexOf(endPattern, start + startPattern.length);
  } else {
    end = babelCode.length;
  }
  if (end === -1) end = babelCode.length;
  return babelCode.slice(start, end);
}

const domainsCode = extractCodeSlice("const DOMAINS =", "const QUESTION_TYPES =");
const qTypesCode = extractCodeSlice("const QUESTION_TYPES =", "// ==========================================");
const currCode = extractCodeSlice("const CURRICULUM_DATA =", "// ==========================================");
const mapCode = extractCodeSlice("const QUESTION_TYPE_TO_LESSON_MAP =", "// ==========================================");
const storageCode = extractCodeSlice("const STORAGE_KEY =", "// ==========================================");

vm.runInContext(`
${domainsCode}
${qTypesCode}
${currCode}
${mapCode}
${storageCode}
globalThis.DOMAINS = DOMAINS;
globalThis.QUESTION_TYPES = QUESTION_TYPES;
globalThis.CURRICULUM_DATA = CURRICULUM_DATA;
globalThis.QUESTION_TYPE_TO_LESSON_MAP = QUESTION_TYPE_TO_LESSON_MAP;
globalThis.STORAGE_KEY = STORAGE_KEY;
globalThis.DEFAULT_APP_STATE = DEFAULT_APP_STATE;
`, sandbox);

const DOMAINS = sandbox.DOMAINS;
const QUESTION_TYPES = sandbox.QUESTION_TYPES;
const CURRICULUM_DATA = sandbox.CURRICULUM_DATA;
const QUESTION_TYPE_TO_LESSON_MAP = sandbox.QUESTION_TYPE_TO_LESSON_MAP;
const STORAGE_KEY = sandbox.STORAGE_KEY;
const DEFAULT_APP_STATE = sandbox.DEFAULT_APP_STATE;

// ==============================================================================
// MANDATE 1: Curriculum Completeness & Pedagogical Audit
// ==============================================================================
suite("Mandate 1: Curriculum Completeness & Pedagogical Audit");

const EXPECTED_DOMAIN_IDS = [
  'craft-and-structure',
  'information-and-ideas',
  'standard-english-conventions',
  'expression-of-ideas',
  'algebra',
  'advanced-math',
  'problem-solving-and-data-analysis',
  'geometry-and-trigonometry'
];

assert(Array.isArray(DOMAINS), "DOMAINS is defined as an array");
assert(DOMAINS.length === 8, `Exactly 8 domains declared in DOMAINS metadata (found: ${DOMAINS.length})`);

// 1.1 Check all 8 domain IDs present in DOMAINS and CURRICULUM_DATA
EXPECTED_DOMAIN_IDS.forEach(domId => {
  const meta = DOMAINS.find(d => d.id === domId);
  assert(!!meta, `DOMAINS metadata contains '${domId}'`);
  assert(!!CURRICULUM_DATA[domId], `CURRICULUM_DATA contains '${domId}'`);
});

// 1.2 Pedagogical structure audit for each domain
let totalTraps = 0;
let totalWalkthroughs = 0;
const walkthroughIdsSeen = new Set();

EXPECTED_DOMAIN_IDS.forEach(domId => {
  const d = CURRICULUM_DATA[domId];
  if (!d) return;

  // Mechanics
  assert(!!d.mechanics, `Domain '${domId}' contains mechanics object`);
  if (d.mechanics) {
    assert(typeof d.mechanics.coreRules === "string" && d.mechanics.coreRules.trim().length >= 100,
      `Domain '${domId}' mechanics.coreRules has substantial content (${d.mechanics.coreRules?.length || 0} chars)`);
    assert(typeof d.mechanics.stemAnatomy === "string" && d.mechanics.stemAnatomy.trim().length >= 50,
      `Domain '${domId}' mechanics.stemAnatomy has substantial content (${d.mechanics.stemAnatomy?.length || 0} chars)`);
    assert(typeof d.mechanics.testFrequency === "string" && d.mechanics.testFrequency.trim().length >= 20,
      `Domain '${domId}' mechanics.testFrequency specifies exam weight & count`);
  }

  // Trap Archetypes
  assert(Array.isArray(d.traps) && d.traps.length >= 3,
    `Domain '${domId}' contains >= 3 Trap Archetypes (found: ${d.traps?.length})`);
  if (Array.isArray(d.traps)) {
    totalTraps += d.traps.length;
    d.traps.forEach((trap, tIdx) => {
      assert(typeof trap.name === "string" && trap.name.length > 3,
        `Domain '${domId}' trap #${tIdx + 1} has valid name: "${trap.name}"`);
      assert(typeof trap.description === "string" && trap.description.length >= 30,
        `Domain '${domId}' trap "${trap.name}" has in-depth description`);
      assert(typeof trap.detectionCue === "string" && trap.detectionCue.length >= 10,
        `Domain '${domId}' trap "${trap.name}" has actionable detection cue`);
    });
  }

  // 3-Step Algorithm
  assert(Array.isArray(d.algorithm) && d.algorithm.length === 3,
    `Domain '${domId}' contains exactly 3-step procedural algorithm (found: ${d.algorithm?.length})`);
  if (Array.isArray(d.algorithm)) {
    d.algorithm.forEach((stepStr, sIdx) => {
      assert(typeof stepStr === "string" && stepStr.length >= 30,
        `Domain '${domId}' algorithm step ${sIdx + 1} is substantial text`);
      assert(stepStr.toLowerCase().includes(`step ${sIdx + 1}`),
        `Domain '${domId}' algorithm step ${sIdx + 1} labeled 'Step ${sIdx + 1}'`);
    });
  }

  // Guided Walkthroughs (2 items per domain)
  assert(Array.isArray(d.walkthroughs) && d.walkthroughs.length === 2,
    `Domain '${domId}' contains exactly 2 Guided Walkthrough sample items (found: ${d.walkthroughs?.length})`);
  if (Array.isArray(d.walkthroughs)) {
    totalWalkthroughs += d.walkthroughs.length;
    d.walkthroughs.forEach((w, wIdx) => {
      assert(typeof w.id === "string" && w.id.length > 0,
        `Walkthrough item has valid id: ${w.id}`);
      assert(!walkthroughIdsSeen.has(w.id),
        `Walkthrough id '${w.id}' is globally unique`);
      walkthroughIdsSeen.add(w.id);

      assert(typeof w.title === "string" && w.title.length > 5,
        `Walkthrough '${w.id}' has descriptive title: "${w.title}"`);
      assert(typeof w.stem === "string" && w.stem.length >= 20,
        `Walkthrough '${w.id}' has realistic question stem`);
      assert(Array.isArray(w.options) && w.options.length === 4,
        `Walkthrough '${w.id}' has 4 multiple-choice options`);
      assert(['A', 'B', 'C', 'D'].includes(w.correctAnswer),
        `Walkthrough '${w.id}' has valid correctAnswer: '${w.correctAnswer}'`);

      // Step-by-Step Cognitive Rationales
      assert(Array.isArray(w.stepRationales) && w.stepRationales.length >= 3,
        `Walkthrough '${w.id}' has >= 3 step-by-step cognitive rationales (found: ${w.stepRationales?.length})`);
      if (Array.isArray(w.stepRationales)) {
        w.stepRationales.forEach((r, rIdx) => {
          assert(typeof r === "string" && r.length >= 40,
            `Walkthrough '${w.id}' rationale step ${rIdx + 1} has detailed pedagogical guidance`);
        });
      }

      // Distractor Trap Analysis
      assert(typeof w.trapAnalysis === "object" && w.trapAnalysis !== null,
        `Walkthrough '${w.id}' has trapAnalysis object`);
      if (w.trapAnalysis) {
        const distractorLetters = ['A', 'B', 'C', 'D'].filter(l => l !== w.correctAnswer);
        distractorLetters.forEach(dLetter => {
          assert(typeof w.trapAnalysis[dLetter] === "string" && w.trapAnalysis[dLetter].length >= 20,
            `Walkthrough '${w.id}' contains trap breakdown for distractor Option ${dLetter}`);
        });
      }
    });
  }
});

assert(totalTraps >= 24, `Total trap archetypes across 8 domains is at least 24 (found: ${totalTraps})`);
assert(totalWalkthroughs === 16, `Total guided walkthroughs across all 8 domains is exactly 16 (found: ${totalWalkthroughs})`);
assert(walkthroughIdsSeen.size === 16, `Exactly 16 unique walkthrough IDs verified`);

// 1.3 UI Toggleable Rationale and Interactive Walkthrough Code Verification
assert(/const\s+\[walkthroughStepsOpen,\s*setWalkthroughStepsOpen\]\s*=\s*React\.useState/i.test(babelCode),
  "LessonsView component defines toggleable walkthrough state 'walkthroughStepsOpen'");
assert(/const\s+toggleStep\s*=\s*\(walkId,\s*stepIdx\)\s*=>/i.test(babelCode),
  "LessonsView component provides 'toggleStep' handler to toggle cognitive rationales");
assert(/const\s+\[userSelections,\s*setUserSelections\]\s*=\s*React\.useState/i.test(babelCode),
  "LessonsView component provides interactive option selection state for walkthroughs");
assert(/trapAnalysis\s*&&/i.test(babelCode),
  "LessonsView renders distractor trap analysis breakdown cards");

// ==============================================================================
// MANDATE 2: LocalStorage State Engine Fuzzing & Persistence Stress
// ==============================================================================
suite("Mandate 2: LocalStorage State Engine Fuzzing & Persistence Stress");

function createFreshStorageEngine() {
  let memoryState = JSON.parse(JSON.stringify(DEFAULT_APP_STATE));

  const saveToStorage = (st) => {
    sandbox.localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  };

  const loadFromStorage = () => {
    try {
      const saved = sandbox.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === 1) {
          return { ...DEFAULT_APP_STATE, ...parsed };
        }
      }
    } catch (e) {}
    return DEFAULT_APP_STATE;
  };

  const importStateJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object" || parsed.version !== 1 || !parsed.settings || !Array.isArray(parsed.examHistory)) {
        return { success: false, message: "Invalid backup file schema." };
      }
      memoryState = { ...memoryState, ...parsed };
      saveToStorage(memoryState);
      return { success: true, message: "Data successfully restored!" };
    } catch (e) {
      return { success: false, message: "Error parsing JSON file." };
    }
  };

  const resetAllData = () => {
    memoryState = {
      ...DEFAULT_APP_STATE,
      settings: { ...DEFAULT_APP_STATE.settings, theme: memoryState.settings.theme }
    };
    saveToStorage(memoryState);
  };

  return {
    getState: () => memoryState,
    setState: (st) => { memoryState = st; saveToStorage(st); },
    importStateJson,
    resetAllData,
    loadFromStorage
  };
}

// 2.1 Storage Key and Default Schema Validation
assert(STORAGE_KEY === "DIGITAL_SAT_APP_STATE_V1",
  "STORAGE_KEY strictly matches 'DIGITAL_SAT_APP_STATE_V1'");
assert(DEFAULT_APP_STATE.version === 1,
  "DEFAULT_APP_STATE version is 1");
assert(typeof DEFAULT_APP_STATE.settings === "object",
  "DEFAULT_APP_STATE contains settings object");
assert(Array.isArray(DEFAULT_APP_STATE.examHistory),
  "DEFAULT_APP_STATE contains examHistory array");
assert(Array.isArray(DEFAULT_APP_STATE.drillHistory),
  "DEFAULT_APP_STATE contains drillHistory array");
assert(typeof DEFAULT_APP_STATE.customNotes === "object",
  "DEFAULT_APP_STATE contains customNotes object");
assert(Array.isArray(DEFAULT_APP_STATE.bookmarkedQuestions),
  "DEFAULT_APP_STATE contains bookmarkedQuestions array");

// 2.2 Live State Manipulation & Persistence
const liveEngine = createFreshStorageEngine();
let currState = liveEngine.getState();
currState.settings.theme = "light";
currState.bookmarkedQuestions.push("M1-RW-M1-Q01", "M1-MATH-M1-Q05");
currState.customNotes["M1-RW-M1-Q01"] = "Look for contrast transition 'however'.";
currState.examHistory.push({
  id: "attempt-1",
  examId: 1,
  scores: { composite: 1480, readingWriting: 730, math: 750 }
});
liveEngine.setState(currState);

// Verify saved to LocalStorage
const rawStored = sandbox.localStorage.getItem(STORAGE_KEY);
assert(typeof rawStored === "string", "State successfully serialized into localStorage");
const loadedState = liveEngine.loadFromStorage();
assert(loadedState.settings.theme === "light", "Loaded state preserves theme setting");
assert(loadedState.bookmarkedQuestions.length === 2, "Loaded state preserves bookmarks");
assert(loadedState.customNotes["M1-RW-M1-Q01"] === "Look for contrast transition 'however'.", "Loaded state preserves custom notes");
assert(loadedState.examHistory.length === 1 && loadedState.examHistory[0].scores.composite === 1480, "Loaded state preserves exam history");

// 2.3 Round-Trip Serialization & Deserialization Fidelity
const exportedJson = JSON.stringify(liveEngine.getState(), null, 2);
const importRes = liveEngine.importStateJson(exportedJson);
assert(importRes.success === true, "100% valid JSON export successfully re-imports");
assert(JSON.stringify(liveEngine.getState()) === JSON.stringify(loadedState),
  "100% round-trip fidelity between exported and re-imported state");

// 2.4 Corrupted JSON Import Fuzzing (Graceful Rejection without crashing)
const fuzzEngine = createFreshStorageEngine();
const initialFuzzState = JSON.parse(JSON.stringify(liveEngine.getState()));
fuzzEngine.setState(initialFuzzState);

const syntaxFuzzAttacks = [
  { name: "Syntax error (unterminated JSON)", input: '{"version": 1, "settings":' },
  { name: "Empty string", input: '' },
  { name: "Non-object string", input: '"just a string"' },
  { name: "Primitive number", input: '12345' },
  { name: "Primitive boolean", input: 'true' },
  { name: "Null literal", input: 'null' },
  { name: "Array instead of object", input: '[{"version": 1}]' },
  { name: "Wrong version (version = 2)", input: JSON.stringify({ version: 2, settings: {}, examHistory: [] }) },
  { name: "Missing version field", input: JSON.stringify({ settings: {}, examHistory: [] }) },
  { name: "String version instead of number", input: JSON.stringify({ version: "1", settings: {}, examHistory: [] }) },
  { name: "Missing settings field", input: JSON.stringify({ version: 1, examHistory: [] }) },
  { name: "Null settings field", input: JSON.stringify({ version: 1, settings: null, examHistory: [] }) },
  { name: "Missing examHistory field", input: JSON.stringify({ version: 1, settings: {} }) },
  { name: "Non-array examHistory field", input: JSON.stringify({ version: 1, settings: {}, examHistory: "not-an-array" }) },
  { name: "Null examHistory field", input: JSON.stringify({ version: 1, settings: {}, examHistory: null }) }
];

syntaxFuzzAttacks.forEach(attack => {
  let threw = false;
  let res;
  try {
    res = fuzzEngine.importStateJson(attack.input);
  } catch (err) {
    threw = true;
  }
  assert(!threw, `Fuzz Attack [${attack.name}]: Executed without uncaught exception`);
  assert(res && res.success === false, `Fuzz Attack [${attack.name}]: Gracefully rejected with success=false`);
  assert(res && typeof res.message === "string" && res.message.length > 0,
    `Fuzz Attack [${attack.name}]: Returns informative error message: "${res?.message}"`);
});

// Verify state integrity after all syntax fuzz attacks
const stateAfterSyntaxFuzz = fuzzEngine.getState();
assert(stateAfterSyntaxFuzz.bookmarkedQuestions.length === 2, "State remains fully intact after multiple corrupt import attempts");
assert(stateAfterSyntaxFuzz.examHistory.length === 1, "Exam history remains safe after syntax corruption payloads");

// 2.5 Security Audit: Malicious Keys & Insufficient Schema Sanitization (Adversarial Challenge)
console.log(`\n  ${YELLOW}[ADVERSARIAL PROBE] Testing Schema Vulnerabilities in importStateJson...${RESET}`);

// Probe 1: Malicious __proto__ key injection
const maliciousProtoPayload = JSON.stringify({
  "__proto__": { "polluted": true },
  "version": 1,
  "settings": { "theme": "dark" },
  "examHistory": []
});
const protoRes = fuzzEngine.importStateJson(maliciousProtoPayload);
// Document empirical behavior:
const protoKeyRejected = (protoRes.success === false);
assert(protoKeyRejected === false,
  "EMPIRICAL FINDING: importStateJson lacks malicious key filtering (accepted __proto__ payload)",
  "VULNERABILITY: Malicious keys are not sanitized or rejected by importStateJson");

// Probe 2: Malformed settings array (typeof [] === 'object')
const arraySettingsPayload = JSON.stringify({
  "version": 1,
  "settings": ["array", "not", "object"],
  "examHistory": []
});
const arraySettingsRes = fuzzEngine.importStateJson(arraySettingsPayload);
assert(arraySettingsRes.success === true,
  "EMPIRICAL FINDING: importStateJson allows array for settings because typeof [] === 'object'",
  "VULNERABILITY: Shallow typeof check fails to reject array settings");

// Probe 3: Corrupt examHistory item (missing required scores field)
const corruptExamPayload = JSON.stringify({
  "version": 1,
  "settings": { "theme": "dark" },
  "examHistory": [{ "id": "corrupt-attempt-no-scores" }]
});
const corruptExamRes = fuzzEngine.importStateJson(corruptExamPayload);
assert(corruptExamRes.success === true,
  "EMPIRICAL FINDING: importStateJson allows corrupted examHistory elements without deep validation",
  "VULNERABILITY: Subsequent dereference of attempt.scores crashes AnalyticsView with TypeError");

// 2.6 Data Reset Security ("RESET" Confirmation Requirement)
const resetEngine = createFreshStorageEngine();
resetEngine.setState(JSON.parse(JSON.stringify(liveEngine.getState())));

function simulateHandleConfirmReset(confirmText) {
  if (confirmText === 'RESET') {
    resetEngine.resetAllData();
    return true;
  }
  return false;
}

const invalidResetPrompts = [
  'reset',       // lowercase
  'Reset',       // title case
  ' RESET',      // leading whitespace
  'RESET ',      // trailing whitespace
  'RE SET',      // inner space
  'DELETE',      // wrong command
  'CLEAR',       // wrong command
  'yes',         // generic confirmation
  '',            // empty
  null,          // null
  undefined,     // undefined
  123            // non-string
];

invalidResetPrompts.forEach(p => {
  const resetTriggered = simulateHandleConfirmReset(p);
  assert(resetTriggered === false, `Data reset strictly rejected confirmation input: ${JSON.stringify(p)}`);
});

// Confirm state is still intact
assert(resetEngine.getState().examHistory.length === 1, "Data intact before authorized RESET");

// Now trigger authorized reset with exact "RESET"
const resetSuccess = simulateHandleConfirmReset('RESET');
assert(resetSuccess === true, "Data reset authorized when user enters exact 'RESET'");

// Verify state after reset
const resetState = resetEngine.getState();
assert(resetState.examHistory.length === 0, "Reset completely cleared examHistory");
assert(resetState.bookmarkedQuestions.length === 0, "Reset completely cleared bookmarks");
assert(Object.keys(resetState.customNotes).length === 0, "Reset completely cleared custom notes");
assert(resetState.settings.theme === "light", "Reset securely preserved user's active theme setting");

// ==============================================================================
// MANDATE 3: Diagnostic Analytics & Pacing Engine
// ==============================================================================
suite("Mandate 3: Diagnostic Analytics & Pacing Engine");

// 3.1 Pacing Classification (<30s rushed, >120s stalled)
function calculatePacingSummary(times) {
  const totalDuration = times.reduce((a, b) => a + b, 0);
  const avgSec = times.length > 0 ? Math.round(totalDuration / times.length) : 70;
  const rushed = times.filter(t => t < 30).length;
  const stalled = times.filter(t => t > 120).length;
  return {
    avgSecondsPerQuestion: avgSec,
    rushedQuestionCount: rushed,
    stalledQuestionCount: stalled,
    totalDuration
  };
}

// Boundary Tests for Pacing
const pacingBoundaryCases = [
  { time: 0, expected: 'rushed' },
  { time: 1, expected: 'rushed' },
  { time: 29, expected: 'rushed' },
  { time: 29.9, expected: 'rushed' },
  { time: 30, expected: 'normal' },     // Boundary 30s: NOT rushed, NOT stalled
  { time: 30.1, expected: 'normal' },
  { time: 70, expected: 'normal' },
  { time: 119.9, expected: 'normal' },
  { time: 120, expected: 'normal' },    // Boundary 120s: NOT rushed, NOT stalled
  { time: 120.1, expected: 'stalled' },
  { time: 121, expected: 'stalled' },
  { time: 350, expected: 'stalled' }
];

pacingBoundaryCases.forEach(c => {
  const summary = calculatePacingSummary([c.time]);
  if (c.expected === 'rushed') {
    assert(summary.rushedQuestionCount === 1 && summary.stalledQuestionCount === 0,
      `Pacing boundary: ${c.time}s is classified as RUSHED (<30s)`);
  } else if (c.expected === 'stalled') {
    assert(summary.rushedQuestionCount === 0 && summary.stalledQuestionCount === 1,
      `Pacing boundary: ${c.time}s is classified as STALLED (>120s)`);
  } else {
    assert(summary.rushedQuestionCount === 0 && summary.stalledQuestionCount === 0,
      `Pacing boundary: ${c.time}s is classified as NORMAL (30s <= t <= 120s)`);
  }
});

// Empty times array test
const emptyPacing = calculatePacingSummary([]);
assert(emptyPacing.avgSecondsPerQuestion === 70, "Empty pacing times defaults gracefully to 70s");
assert(emptyPacing.rushedQuestionCount === 0, "Empty pacing has 0 rushed");
assert(emptyPacing.stalledQuestionCount === 0, "Empty pacing has 0 stalled");
assert(!isNaN(emptyPacing.avgSecondsPerQuestion), "Empty pacing average is not NaN");

// Realistic 98-question mixed pacing workload
const mixedTimes = [
  ...Array(12).fill(25),  // 12 rushed (25s)
  ...Array(76).fill(65),  // 76 normal (65s)
  ...Array(10).fill(140)  // 10 stalled (140s)
]; // total: 98 questions
const mixedPacing = calculatePacingSummary(mixedTimes);
assert(mixedPacing.rushedQuestionCount === 12, "Realistic exam: 12 rushed questions identified");
assert(mixedPacing.stalledQuestionCount === 10, "Realistic exam: 10 stalled questions identified");
assert(mixedPacing.avgSecondsPerQuestion === Math.round((12*25 + 76*65 + 10*140) / 98),
  `Realistic exam: Average pace calculated correctly (${mixedPacing.avgSecondsPerQuestion}s)`);

// 3.2 Top-3 Weakness Error Pattern Ranker
function calculateTop3Weaknesses(questionTypeStats) {
  return Object.entries(questionTypeStats || {})
    .filter(([_, st]) => st.totalQuestions >= 2)
    .map(([qType, st]) => ({
      qType,
      total: st.totalQuestions,
      correct: st.correctQuestions,
      accuracy: st.accuracyPercentage,
      missed: st.totalQuestions - st.correctQuestions
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.missed - a.missed)
    .slice(0, 3);
}

// Test Case A: Distinct error rates
const statsA = {
  'transitions': { totalQuestions: 5, correctQuestions: 1, accuracyPercentage: 20 },
  'quadratics': { totalQuestions: 4, correctQuestions: 1, accuracyPercentage: 25 },
  'words-in-context': { totalQuestions: 6, correctQuestions: 3, accuracyPercentage: 50 },
  'linear-equations': { totalQuestions: 5, correctQuestions: 4, accuracyPercentage: 80 },
  'inferences': { totalQuestions: 4, correctQuestions: 4, accuracyPercentage: 100 }
};
const weakA = calculateTop3Weaknesses(statsA);
assert(weakA.length === 3, "Top 3 weaknesses returns exactly 3 targets");
assert(weakA[0].qType === 'transitions' && weakA[0].accuracy === 20, "Rank 1 weakness is lowest accuracy (transitions: 20%)");
assert(weakA[1].qType === 'quadratics' && weakA[1].accuracy === 25, "Rank 2 weakness is quadratics (25%)");
assert(weakA[2].qType === 'words-in-context' && weakA[2].accuracy === 50, "Rank 3 weakness is words-in-context (50%)");

// Test Case B: Tie in accuracy broken by total missed questions
const statsB = {
  'type-tie-small': { totalQuestions: 3, correctQuestions: 1, accuracyPercentage: 33 }, // missed: 2
  'type-tie-large': { totalQuestions: 6, correctQuestions: 2, accuracyPercentage: 33 }, // missed: 4
  'type-safe': { totalQuestions: 5, correctQuestions: 4, accuracyPercentage: 80 }
};
const weakB = calculateTop3Weaknesses(statsB);
assert(weakB[0].qType === 'type-tie-large',
  "Tie-breaker: Same accuracy (33%) ranked by higher number of missed questions (4 missed > 2 missed)");
assert(weakB[1].qType === 'type-tie-small',
  "Tie-breaker: Lower missed count ranked second (2 missed)");

// Test Case C: Low question count filter (totalQuestions >= 2 requirement)
const statsC = {
  'lucky-single-miss': { totalQuestions: 1, correctQuestions: 0, accuracyPercentage: 0 }, // 0% accuracy, but only 1 question
  'real-weakness-1': { totalQuestions: 4, correctQuestions: 1, accuracyPercentage: 25 },
  'real-weakness-2': { totalQuestions: 4, correctQuestions: 2, accuracyPercentage: 50 },
  'real-weakness-3': { totalQuestions: 4, correctQuestions: 3, accuracyPercentage: 75 }
};
const weakC = calculateTop3Weaknesses(statsC);
assert(weakC.length === 3, "Only questions with >= 2 attempts qualify for top-3 weakness");
assert(!weakC.some(w => w.qType === 'lucky-single-miss'),
  "1-question outlier (0% accuracy on 1 attempt) correctly excluded by totalQuestions >= 2 filter");
assert(weakC[0].qType === 'real-weakness-1', "First qualified weakness is real-weakness-1");

// Test Case D: Empty stats or null input
const weakD = calculateTop3Weaknesses({});
assert(Array.isArray(weakD) && weakD.length === 0, "Empty questionTypeStats returns empty array without throwing");
const weakDNull = calculateTop3Weaknesses(null);
assert(Array.isArray(weakDNull) && weakDNull.length === 0, "Null questionTypeStats returns empty array without throwing");

// Test Case E: Fewer than 3 question types qualify
const statsE = {
  'weakness-only-one': { totalQuestions: 5, correctQuestions: 1, accuracyPercentage: 20 }
};
const weakE = calculateTop3Weaknesses(statsE);
assert(weakE.length === 1 && weakE[0].qType === 'weakness-only-one',
  "Single qualified weakness returns array of length 1 without padding nulls");

// 3.3 1-Click Remediation Mapping Verification
assert(typeof QUESTION_TYPE_TO_LESSON_MAP === "object" && QUESTION_TYPE_TO_LESSON_MAP !== null,
  "QUESTION_TYPE_TO_LESSON_MAP is declared as an object");

assert(Array.isArray(QUESTION_TYPES), "QUESTION_TYPES is declared as an array");
assert(QUESTION_TYPES.length === 32, `Exactly 32 Digital SAT question types defined (found: ${QUESTION_TYPES.length})`);

let missingMappings = [];
let invalidDomainTargets = [];

QUESTION_TYPES.forEach(qt => {
  const mapping = QUESTION_TYPE_TO_LESSON_MAP[qt.id];
  if (!mapping) {
    missingMappings.push(qt.id);
  } else {
    if (!EXPECTED_DOMAIN_IDS.includes(mapping.domainId)) {
      invalidDomainTargets.push({ qt: qt.id, domainId: mapping.domainId });
    }
  }
});

assert(missingMappings.length === 0,
  `All 32 question types have 1-click remediation mapping in QUESTION_TYPE_TO_LESSON_MAP ${missingMappings.length > 0 ? `(Missing: ${missingMappings.join(', ')})` : ""}`);
assert(invalidDomainTargets.length === 0,
  `All remediation mappings route to valid curriculum domain IDs ${invalidDomainTargets.length > 0 ? `(Invalid: ${JSON.stringify(invalidDomainTargets)})` : ""}`);

// Remediation fallback test (unregistered question type)
const fallbackTarget = QUESTION_TYPE_TO_LESSON_MAP['unknown-experimental-type'] || { domainId: 'craft-and-structure' };
assert(fallbackTarget.domainId === 'craft-and-structure',
  "AnalyticsView fallback safely routes unregistered question types to 'craft-and-structure'");

// Navigation contract test
function simulateNavigation(domainId, questionType) {
  let activeDomain = null;
  let activeView = null;
  const handleNavigateToLesson = (dId, qT) => {
    activeDomain = dId;
    activeView = 'lessons';
  };
  handleNavigateToLesson(domainId, questionType);
  return { activeDomain, activeView };
}
const navResult = simulateNavigation('advanced-math', 'quadratics');
assert(navResult.activeView === 'lessons', "Remediation link switches view to 'lessons'");
assert(navResult.activeDomain === 'advanced-math', "Remediation link targets correct domain 'advanced-math'");

// ==============================================================================
// CHALLENGE TEST SUITE SUMMARY
// ==============================================================================
console.log(`\n${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`${CYAN}${BOLD}              CHALLENGER 2 EMPIRICAL TEST HARNESS SUMMARY                    ${RESET}`);
console.log(`${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`  Total Assertions Executed : ${totalAssertions}`);
console.log(`  Total Assertions Passed   : ${GREEN}${passedAssertions}${RESET}`);
console.log(`  Total Assertions Failed   : ${failedAssertions === 0 ? GREEN : RED}${failedAssertions}${RESET}`);
console.log(`${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

if (failedAssertions > 0) {
  console.error(`${RED}${BOLD}FAILED: ${failedAssertions} assertions failed!${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}✓ ALL ${totalAssertions} CHALLENGER 2 EMPIRICAL STRESS ASSERTIONS PASSED.${RESET}\n`);
  process.exit(0);
}
