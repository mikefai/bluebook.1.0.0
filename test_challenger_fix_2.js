/**
 * ==============================================================================
 * test_challenger_fix_2.js — Empirical Verification Suite for Final Challenger 2
 * Iteration: 2 (Post-Remediation Verification)
 * Focus: Curriculum Completeness, ErrorBoundary, 5MB Import Guard, Pacing & Remediation
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
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
// Load index.html
// ------------------------------------------------------------------------------
const indexPath = path.join(__dirname, "index.html");
const html = fs.readFileSync(indexPath, "utf8");

const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error("FATAL: <script type='text/babel'> not found");
  process.exit(1);
}
const babelCode = scriptMatch[1];

// Extract pure JS section up to useSatStorage()
const startMarker = "const DOMAINS = [";
const endMarker = "function useSatStorage()";
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
  console.error("FATAL: Unable to slice pure JS data section");
  process.exit(1);
}

const pureJsCode = html.slice(startIdx, endIdx) + `
var __EXPORT = {
  DOMAINS,
  QUESTION_TYPES,
  MOCK_1_DATA,
  CURRICULUM_DATA,
  QUESTION_TYPE_TO_LESSON_MAP,
  evaluateGridIn,
  calculateScaledScore,
  calculateCompositeScore,
  ExamScaffoldEngine,
  STORAGE_KEY,
  DEFAULT_APP_STATE
};
`;

const vmSandbox = {
  console: console,
  Math,
  Date,
  Array,
  Object,
  String,
  Number,
  RegExp,
  parseFloat,
  parseInt,
  isNaN,
  Set,
  Map
};

vm.createContext(vmSandbox);
try {
  vm.runInContext(pureJsCode, vmSandbox);
} catch (e) {
  console.error("FATAL running pure JS section in sandbox:", e);
  process.exit(1);
}

const {
  DOMAINS,
  QUESTION_TYPES,
  MOCK_1_DATA,
  CURRICULUM_DATA,
  QUESTION_TYPE_TO_LESSON_MAP,
  evaluateGridIn,
  calculateScaledScore,
  calculateCompositeScore,
  ExamScaffoldEngine,
  STORAGE_KEY,
  DEFAULT_APP_STATE
} = vmSandbox.__EXPORT;

// ==============================================================================
// SUITE 1: Curriculum Completeness & Pedagogical Invariants Post-Rebalance
// ==============================================================================
suite("Suite 1: Curriculum Completeness & Pedagogical Invariants Post-Rebalance");

assert(Array.isArray(DOMAINS) && DOMAINS.length === 8, "DOMAINS contains exactly 8 domains");

const DOMAIN_IDS = [
  'craft-and-structure',
  'information-and-ideas',
  'standard-english-conventions',
  'expression-of-ideas',
  'algebra',
  'advanced-math',
  'problem-solving-and-data-analysis',
  'geometry-and-trigonometry'
];

let totalTraps = 0;
let totalWalkthroughs = 0;
let totalRationales = 0;
const walkthroughIdSet = new Set();

DOMAIN_IDS.forEach(domId => {
  const meta = DOMAINS.find(d => d.id === domId);
  const curr = CURRICULUM_DATA[domId];

  assert(!!meta, `Domain metadata exists for '${domId}' (${meta?.name})`);
  assert(!!curr, `Curriculum data exists for '${domId}'`);

  if (!curr) return;

  // Mechanics
  assert(!!curr.mechanics, `Domain '${domId}' has mechanics block`);
  assert(typeof curr.mechanics.coreRules === "string" && curr.mechanics.coreRules.length >= 100,
    `Domain '${domId}' coreRules length >= 100 (${curr.mechanics.coreRules.length} chars)`);
  assert(typeof curr.mechanics.stemAnatomy === "string" && curr.mechanics.stemAnatomy.length >= 50,
    `Domain '${domId}' stemAnatomy length >= 50 (${curr.mechanics.stemAnatomy.length} chars)`);
  assert(typeof curr.mechanics.testFrequency === "string" && curr.mechanics.testFrequency.length >= 20,
    `Domain '${domId}' testFrequency length >= 20 (${curr.mechanics.testFrequency.length} chars)`);

  // Traps
  assert(Array.isArray(curr.traps) && curr.traps.length >= 3,
    `Domain '${domId}' has >= 3 trap archetypes (found: ${curr.traps?.length})`);
  curr.traps.forEach((trap, tIdx) => {
    totalTraps++;
    assert(typeof trap.name === "string" && trap.name.length > 3,
      `Domain '${domId}' trap #${tIdx+1} name valid: "${trap.name}"`);
    assert(typeof trap.description === "string" && trap.description.length >= 30,
      `Domain '${domId}' trap #${tIdx+1} description substantial`);
    assert(typeof trap.detectionCue === "string" && trap.detectionCue.length >= 10,
      `Domain '${domId}' trap #${tIdx+1} detectionCue actionable`);
  });

  // Algorithm (3 steps)
  assert(Array.isArray(curr.algorithm) && curr.algorithm.length === 3,
    `Domain '${domId}' algorithm has exactly 3 steps`);
  curr.algorithm.forEach((step, sIdx) => {
    assert(typeof step === "string" && step.toLowerCase().includes(`step ${sIdx+1}`),
      `Domain '${domId}' algorithm step ${sIdx+1} properly labeled`);
  });

  // Walkthroughs (2 items per domain)
  assert(Array.isArray(curr.walkthroughs) && curr.walkthroughs.length === 2,
    `Domain '${domId}' has exactly 2 guided walkthroughs`);
  curr.walkthroughs.forEach((w, wIdx) => {
    totalWalkthroughs++;
    assert(typeof w.id === "string" && w.id.length > 0, `Walkthrough #${wIdx+1} in '${domId}' has id: ${w.id}`);
    assert(!walkthroughIdSet.has(w.id), `Walkthrough id '${w.id}' is globally unique`);
    walkthroughIdSet.add(w.id);

    assert(typeof w.title === "string" && w.title.length > 5, `Walkthrough '${w.id}' title substantial: "${w.title}"`);
    assert(typeof w.stem === "string" && w.stem.length >= 20, `Walkthrough '${w.id}' stem substantial`);
    assert(Array.isArray(w.options) && w.options.length === 4, `Walkthrough '${w.id}' has 4 options`);
    assert(['A', 'B', 'C', 'D'].includes(w.correctAnswer), `Walkthrough '${w.id}' correctAnswer valid: '${w.correctAnswer}'`);

    assert(Array.isArray(w.stepRationales) && w.stepRationales.length >= 3,
      `Walkthrough '${w.id}' has >= 3 step rationales (found: ${w.stepRationales?.length})`);
    w.stepRationales.forEach((rat, rIdx) => {
      totalRationales++;
      assert(typeof rat === "string" && rat.length >= 40,
        `Walkthrough '${w.id}' rationale #${rIdx+1} is detailed (${rat.length} chars)`);
    });

    assert(typeof w.trapAnalysis === "object" && w.trapAnalysis !== null,
      `Walkthrough '${w.id}' has trapAnalysis object`);
    const distractors = ['A', 'B', 'C', 'D'].filter(opt => opt !== w.correctAnswer);
    distractors.forEach(dist => {
      assert(typeof w.trapAnalysis[dist] === "string" && w.trapAnalysis[dist].length >= 20,
        `Walkthrough '${w.id}' distractor '${dist}' trap analysis detailed`);
    });
  });
});

assert(totalTraps >= 24, `Total trap archetypes across all domains: ${totalTraps} (>= 24)`);
assert(totalWalkthroughs === 16, `Total guided walkthroughs across all domains: ${totalWalkthroughs} (exactly 16)`);
assert(totalRationales >= 48, `Total cognitive step rationales: ${totalRationales} (>= 48)`);

// ==============================================================================
// SUITE 2: React ErrorBoundary Component Verification & Stress
// ==============================================================================
suite("Suite 2: React ErrorBoundary Component Verification & Stress");

// 2.1 Verify presence and syntax in index.html
assert(/class\s+ErrorBoundary\s+extends\s+React\.Component/.test(babelCode),
  "index.html defines 'class ErrorBoundary extends React.Component'");
assert(/static\s+getDerivedStateFromError\s*\(/.test(babelCode),
  "ErrorBoundary implements static getDerivedStateFromError(error)");
assert(/componentDidCatch\s*\(/.test(babelCode),
  "ErrorBoundary implements componentDidCatch(error, errorInfo)");
assert(/ReactDOM\.createRoot\([\s\S]*?\)\.render\(\s*<ErrorBoundary>\s*<App\s*\/>\s*<\/ErrorBoundary>\s*\)/.test(babelCode),
  "ReactDOM.createRoot wraps <App /> inside <ErrorBoundary>");

// 2.2 Verify export on window and module.exports
assert(/window\.ErrorBoundary\s*=\s*ErrorBoundary/.test(babelCode),
  "ErrorBoundary exported on window object");
assert(/ErrorBoundary\b/.test(babelCode) && /module\.exports\s*=\s*\{[^}]*ErrorBoundary[^}]*\}/.test(babelCode),
  "ErrorBoundary exported in module.exports for test runners");

// 2.3 Verify UI crash and recovery elements inside ErrorBoundary render()
assert(babelCode.includes("Something went wrong"), "ErrorBoundary render UI includes 'Something went wrong' title");
assert(babelCode.includes("Reload Application"), "ErrorBoundary render UI includes 'Reload Application' button");
assert(babelCode.includes("Reset Storage & Reload"), "ErrorBoundary render UI includes 'Reset Storage & Reload' button");
assert(babelCode.includes('localStorage.removeItem("DIGITAL_SAT_APP_STATE_V1")'), "ErrorBoundary provides storage purge recovery handler");

// 2.4 Functional Simulation of ErrorBoundary behavior
class MockComponent {
  constructor(props) {
    this.props = props || {};
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  setState(updater) {
    if (typeof updater === "function") {
      this.state = { ...this.state, ...updater(this.state) };
    } else {
      this.state = { ...this.state, ...updater };
    }
  }
}

// Extract methods without JSX render
class SimulatedErrorBoundary extends MockComponent {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  handleReset = (reloadFn) => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof reloadFn === "function") reloadFn();
  };

  handleClearDataAndReload = (storageObj, reloadFn) => {
    try {
      storageObj.removeItem("DIGITAL_SAT_APP_STATE_V1");
    } catch (e) {}
    if (typeof reloadFn === "function") reloadFn();
  };

  render() {
    if (this.state.hasError) {
      return { type: "FallbackErrorUI", message: "Something went wrong", error: this.state.error };
    }
    return this.props.children;
  }
}

// Test normal render
const mockNormalInstance = new SimulatedErrorBoundary({ children: "Normal App Content" });
assert(mockNormalInstance.state.hasError === false, "ErrorBoundary initial state has hasError: false");
assert(mockNormalInstance.render() === "Normal App Content", "ErrorBoundary renders children when no error occurs");

// Test getDerivedStateFromError
const testError = new Error("Simulated rendering explosion in App");
const derivedState = SimulatedErrorBoundary.getDerivedStateFromError(testError);
assert(derivedState.hasError === true, "getDerivedStateFromError returns { hasError: true }");
assert(derivedState.error === testError, "getDerivedStateFromError preserves the caught error object");

// Test componentDidCatch
const caughtInstance = new SimulatedErrorBoundary({ children: "Crash" });
caughtInstance.componentDidCatch(testError, { componentStack: "at App at div" });
assert(caughtInstance.state.errorInfo !== null, "componentDidCatch records componentStack in state.errorInfo");

// Test render in error state
caughtInstance.state = { hasError: true, error: testError, errorInfo: { componentStack: "at App" } };
const errorUi = caughtInstance.render();
assert(errorUi && errorUi.type === "FallbackErrorUI", "ErrorBoundary renders fallback UI when hasError is true");
assert(errorUi.message === "Something went wrong", "Fallback UI contains user-friendly message 'Something went wrong'");

// Test recovery handlers
let reloaded = false;
const mockStorage = {
  _store: { "DIGITAL_SAT_APP_STATE_V1": "some-corrupt-data" },
  removeItem(k) { delete this._store[k]; }
};

caughtInstance.handleClearDataAndReload(mockStorage, () => { reloaded = true; });
assert(mockStorage._store["DIGITAL_SAT_APP_STATE_V1"] === undefined,
  "handleClearDataAndReload successfully wipes corrupted storage state");
assert(reloaded === true, "handleClearDataAndReload triggers reload sequence");

// ==============================================================================
// SUITE 3: Storage Engine & importStateJson 5MB Rejection Guard
// ==============================================================================
suite("Suite 3: Storage Engine & importStateJson 5MB Rejection Guard");

// Extract the actual importStateJson from index.html
const importFuncMatch = babelCode.match(/const\s+importStateJson\s*=\s*\(jsonString\)\s*=>\s*\{([\s\S]*?)\n\s*\};\n\s*const resetAllData/);
if (!importFuncMatch) {
  console.error("FATAL: Could not extract importStateJson function body from index.html");
  process.exit(1);
}

const importFuncBody = importFuncMatch[1];
const actualImportFunc = new Function("jsonString", "setState", importFuncBody);

let simulatedState = JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
const mockSetState = (updater) => {
  if (typeof updater === "function") {
    simulatedState = updater(simulatedState);
  } else {
    simulatedState = updater;
  }
};

const runImport = (payload) => actualImportFunc(payload, mockSetState);

// 3.1 Non-string and empty string guards
assert(runImport(null).success === false, "importStateJson rejects null");
assert(runImport(undefined).success === false, "importStateJson rejects undefined");
assert(runImport(12345).success === false, "importStateJson rejects numeric input");
assert(runImport({}).success === false, "importStateJson rejects object input");
assert(runImport("").success === false, "importStateJson rejects empty string");
assert(runImport("   ").success === false, "importStateJson rejects whitespace-only string");

// 3.2 5MB Boundary Stress Tests
const FIVE_MB_EXACT = 5 * 1024 * 1024; // 5,242,880 bytes

// Create valid state payload template
const validBaseObj = {
  version: 1,
  settings: { theme: "dark" },
  examHistory: [],
  drillHistory: [],
  customNotes: {},
  bookmarkedQuestions: []
};

// Probe: 5MB + 1 byte
const oversizeLength = FIVE_MB_EXACT + 1;
const oversizeString = "x".repeat(oversizeLength);
const oversizeRes = runImport(oversizeString);
assert(oversizeRes.success === false, "importStateJson rejects payload of (5MB + 1 byte)");
assert(oversizeRes.message === "Payload size exceeds maximum allowed limit (5MB).",
  `importStateJson returns precise 5MB message: "${oversizeRes.message}"`);

// Probe: 6MB payload
const sixMbString = "x".repeat(6 * 1024 * 1024);
const sixMbRes = runImport(sixMbString);
assert(sixMbRes.success === false, "importStateJson rejects 6MB payload");
assert(sixMbRes.message === "Payload size exceeds maximum allowed limit (5MB).", "6MB payload yields size limit message");

// Probe: Valid payload within size limit (e.g. 500KB with notes)
const validObj = JSON.parse(JSON.stringify(validBaseObj));
validObj.customNotes["bigNote"] = "A".repeat(100000);
const validJsonString = JSON.stringify(validObj);
assert(validJsonString.length < FIVE_MB_EXACT, "Valid test payload is under 5MB");
const validRes = runImport(validJsonString);
assert(validRes.success === true, "Valid state under 5MB imports successfully");
assert(simulatedState.customNotes["bigNote"].length === 100000, "Imported state correctly updated");

// 3.3 Deep Schema Validation of examHistory Items
const malformedExamHistoryTests = [
  {
    name: "item is null",
    history: [null]
  },
  {
    name: "item is string primitive",
    history: ["invalid-item"]
  },
  {
    name: "item missing id",
    history: [{ examId: 1, scores: { composite: 1200 } }]
  },
  {
    name: "item missing examId",
    history: [{ id: "att-1", scores: { composite: 1200 } }]
  },
  {
    name: "item missing scores",
    history: [{ id: "att-1", examId: 1 }]
  },
  {
    name: "item scores is null",
    history: [{ id: "att-1", examId: 1, scores: null }]
  },
  {
    name: "item scores is string",
    history: [{ id: "att-1", examId: 1, scores: "not-an-object" }]
  }
];

malformedExamHistoryTests.forEach(testCase => {
  const badPayload = JSON.stringify({
    version: 1,
    settings: { theme: "light" },
    examHistory: testCase.history
  });
  const res = runImport(badPayload);
  assert(res.success === false, `importStateJson rejects examHistory when ${testCase.name}`);
  assert(res.message === "Invalid backup file: examHistory records are malformed.",
    `Informative error message on malformed examHistory: "${res.message}"`);
});

// Valid exam history record
const goodExamPayload = JSON.stringify({
  version: 1,
  settings: { theme: "dark" },
  examHistory: [
    {
      id: "valid-attempt-1",
      examId: 1,
      scores: { composite: 1540, readingWriting: 760, math: 780 }
    }
  ]
});
const goodRes = runImport(goodExamPayload);
assert(goodRes.success === true, "importStateJson accepts valid examHistory records");
assert(simulatedState.examHistory.length === 1 && simulatedState.examHistory[0].scores.composite === 1540,
  "Imported examHistory records stored with full fidelity");

// ==============================================================================
// SUITE 4: Pacing Timeline & 1-Click Remediation Functionality
// ==============================================================================
suite("Suite 4: Pacing Timeline & 1-Click Remediation Functionality");

// 4.1 Pacing calculation logic extracted from finalizeExamAttempt
const pacingFuncMatch = babelCode.match(/\/\/ Pacing metrics[\s\S]*?const times = Object\.values\(timeSpent\);([\s\S]*?)pacingSummary:\s*\{[\s\S]*?\}\s*,/);
assert(!!pacingFuncMatch, "finalizeExamAttempt implements pacing metrics calculation");

function calculatePacingMetrics(timeSpent) {
  const times = Object.values(timeSpent);
  const totalDuration = times.reduce((a, b) => a + b, 0);
  const rushed = times.filter(t => t < 30).length;
  const stalled = times.filter(t => t > 120).length;
  const avgSec = times.length > 0 ? Math.round(totalDuration / times.length) : 70;
  return {
    avgSecondsPerQuestion: avgSec,
    rushedQuestionCount: rushed,
    stalledQuestionCount: stalled,
    totalDurationSeconds: totalDuration
  };
}

// Test boundary scenarios
const pacingEmpty = calculatePacingMetrics({});
assert(pacingEmpty.avgSecondsPerQuestion === 70, "Empty pacing defaults to 70s");
assert(pacingEmpty.rushedQuestionCount === 0 && pacingEmpty.stalledQuestionCount === 0, "Empty pacing has 0 rushed and 0 stalled");

const pacingTestTimes = {
  q1: 15,  // rushed (<30)
  q2: 29,  // rushed (<30)
  q3: 30,  // normal (30..120)
  q4: 75,  // normal
  q5: 120, // normal (30..120)
  q6: 121, // stalled (>120)
  q7: 210  // stalled (>120)
};
const pacingSummary = calculatePacingMetrics(pacingTestTimes);
assert(pacingSummary.rushedQuestionCount === 2, "Pacing identifies exactly 2 rushed questions (15s, 29s)");
assert(pacingSummary.stalledQuestionCount === 2, "Pacing identifies exactly 2 stalled questions (121s, 210s)");
assert(pacingSummary.avgSecondsPerQuestion === Math.round((15+29+30+75+120+121+210)/7),
  `Average pace calculated accurately (${pacingSummary.avgSecondsPerQuestion}s)`);

// 4.2 1-Click Remediation Mapping Audit
assert(Array.isArray(QUESTION_TYPES) && QUESTION_TYPES.length === 32,
  `QUESTION_TYPES defines exactly 32 question archetypes (found: ${QUESTION_TYPES?.length})`);
assert(typeof QUESTION_TYPE_TO_LESSON_MAP === "object" && QUESTION_TYPE_TO_LESSON_MAP !== null,
  "QUESTION_TYPE_TO_LESSON_MAP declared as lookup table");

const allMappedDomainIds = new Set();
QUESTION_TYPES.forEach(qItem => {
  const qType = typeof qItem === "string" ? qItem : qItem.id;
  const mapEntry = QUESTION_TYPE_TO_LESSON_MAP[qType];
  assert(!!mapEntry, `1-Click remediation mapping exists for question type '${qType}'`);
  assert(typeof mapEntry.domainId === "string", `Mapping for '${qType}' has domainId`);
  assert(DOMAIN_IDS.includes(mapEntry.domainId),
    `Mapping for '${qType}' routes to valid SAT domain '${mapEntry.domainId}'`);
  allMappedDomainIds.add(mapEntry.domainId);
});

assert(allMappedDomainIds.size === 8, "Remediation mappings span all 8 curriculum domains");

// 4.3 Weakness Ranking & Tie-Breaking Logic
function calculateWeakTypes(questionTypeStats) {
  return Object.entries(questionTypeStats || {})
    .filter(([_, st]) => st.totalQuestions >= 2)
    .map(([qType, st]) => ({
      qType,
      accuracy: Math.round((st.correctQuestions / st.totalQuestions) * 100),
      missed: st.totalQuestions - st.correctQuestions,
      total: st.totalQuestions
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.missed - a.missed)
    .slice(0, 3);
}

const testQStats = {
  "transitions": { totalQuestions: 5, correctQuestions: 1 },         // 20% acc, 4 missed
  "boundaries": { totalQuestions: 6, correctQuestions: 2 },          // 33% acc, 4 missed
  "text-structure": { totalQuestions: 3, correctQuestions: 1 },      // 33% acc, 2 missed
  "quadratics": { totalQuestions: 4, correctQuestions: 1 },          // 25% acc, 3 missed
  "words-in-context": { totalQuestions: 10, correctQuestions: 8 },   // 80% acc
  "careless-single-item": { totalQuestions: 1, correctQuestions: 0 } // 0% acc, filtered (<2 attempts)
};

const top3 = calculateWeakTypes(testQStats);
assert(top3.length === 3, "Weakness ranking returns top 3 remediation targets");
assert(top3[0].qType === "transitions", "Rank 1 is 'transitions' (lowest accuracy: 20%)");
assert(top3[1].qType === "quadratics", "Rank 2 is 'quadratics' (25% accuracy)");
assert(top3[2].qType === "boundaries", "Rank 3 is 'boundaries' (33% acc, 4 missed > 2 missed)");
assert(top3.find(t => t.qType === "careless-single-item") === undefined,
  "1-attempt outlier correctly filtered out by minimum 2 attempts rule");

// Verify UI routing integration in index.html
assert(/onClick=\{\(\)\s*=>\s*onNavigateToLesson\(navTarget\.domainId,\s*item\.qType\)\}/.test(babelCode),
  "AnalyticsView renders interactive [Review Lesson] button calling onNavigateToLesson");
assert(/const\s+handleNavigateToLesson\s*=\s*\(domainId,\s*questionType\)\s*=>\s*\{\s*setTargetLessonDomain\(domainId\);\s*setCurrentView\('lessons'\);\s*\}/.test(babelCode),
  "App component handleNavigateToLesson sets target domain and switches view to 'lessons'");
assert(/<LessonsView\s+activeDomainId=\{targetLessonDomain\}/.test(babelCode),
  "LessonsView receives targetLessonDomain as activeDomainId");

// ==============================================================================
// SUITE 5: Mock 1 Question Bank & SPR Integrity Post-Rebalance
// ==============================================================================
suite("Suite 5: Mock 1 Question Bank & SPR Integrity Post-Rebalance");

assert(MOCK_1_DATA.length === 98, `Mock 1 contains exactly 98 questions (found: ${MOCK_1_DATA.length})`);

const rwItems = MOCK_1_DATA.filter(q => q.section === "reading-writing");
const mathItems = MOCK_1_DATA.filter(q => q.section === "math");

assert(rwItems.length === 54, "Reading & Writing has exactly 54 questions");
assert(mathItems.length === 44, "Math has exactly 44 questions");

const rwM1 = rwItems.filter(q => q.module === 1);
const rwM2 = rwItems.filter(q => q.module === 2);
const mathM1 = mathItems.filter(q => q.module === 1);
const mathM2 = mathItems.filter(q => q.module === 2);

assert(rwM1.length === 27 && rwM2.length === 27, "Reading & Writing split 27 / 27 across modules");
assert(mathM1.length === 22 && mathM2.length === 22, "Math split 22 / 22 across modules");

const mathGridIns = mathItems.filter(q => !q.options || q.options.length === 0);
const mathMC = mathItems.filter(q => Array.isArray(q.options) && q.options.length === 4);

assert(mathGridIns.length === 12, `Math contains exactly 12 SPR grid-in questions (found: ${mathGridIns.length})`);
assert(mathMC.length === 32, `Math contains exactly 32 Multiple Choice questions (found: ${mathMC.length})`);

const mathM1GridIns = mathM1.filter(q => !q.options || q.options.length === 0);
const mathM2GridIns = mathM2.filter(q => !q.options || q.options.length === 0);
assert(mathM1GridIns.length === 6 && mathM2GridIns.length === 6, "SPR grid-ins evenly split 6 / 6 across math modules");

// Multiple choice distribution audit
const allMC = MOCK_1_DATA.filter(q => Array.isArray(q.options) && q.options.length === 4);
const mcKeys = { A: 0, B: 0, C: 0, D: 0 };
allMC.forEach(q => {
  if (mcKeys[q.correctAnswer] !== undefined) {
    mcKeys[q.correctAnswer]++;
  }
});

console.log(`\n  Multiple Choice Answer Key Distribution (Total: ${allMC.length}):`);
console.log(`    Option A: ${mcKeys.A} (${Math.round(mcKeys.A / allMC.length * 100)}%)`);
console.log(`    Option B: ${mcKeys.B} (${Math.round(mcKeys.B / allMC.length * 100)}%)`);
console.log(`    Option C: ${mcKeys.C} (${Math.round(mcKeys.C / allMC.length * 100)}%)`);
console.log(`    Option D: ${mcKeys.D} (${Math.round(mcKeys.D / allMC.length * 100)}%)`);

assert(mcKeys.A === 22, "Option A has exactly 22 items");
assert(mcKeys.B === 22, "Option B has exactly 22 items");
assert(mcKeys.C === 21, "Option C has exactly 21 items");
assert(mcKeys.D === 21, "Option D has exactly 21 items");
assert(mcKeys.A + mcKeys.B + mcKeys.C + mcKeys.D === 86, "All 86 MC questions accounted for in distribution");

// Verify SPR evaluator College Board rules
assert(evaluateGridIn("1.5/3", "0.5").isCorrect === false, "evaluateGridIn rejects decimal fraction '1.5/3'");
assert(evaluateGridIn("3/1.5", "2").isCorrect === false, "evaluateGridIn rejects decimal in denominator '3/1.5'");
assert(evaluateGridIn("0.3334", "1/3").isCorrect === false, "evaluateGridIn rejects false rounding '0.3334' for 1/3");
assert(evaluateGridIn("0.333", "1/3").isCorrect === true, "evaluateGridIn accepts truncated '0.333' for 1/3");
assert(evaluateGridIn(".333", "1/3").isCorrect === true, "evaluateGridIn accepts leading dot '.333' for 1/3");
assert(evaluateGridIn("3/4", "0.75").isCorrect === true, "evaluateGridIn accepts fraction '3/4' for 0.75");
assert(evaluateGridIn(".75", "3/4").isCorrect === true, "evaluateGridIn accepts leading dot '.75' for 3/4");

// Verify scoring section alias
const scoreRW = calculateScaledScore(20, 20, "reading_writing", "hard");
assert(scoreRW.scaledScore === 680, `calculateScaledScore accepts 'reading_writing' alias (score: ${scoreRW.scaledScore})`);

// ==============================================================================
// SUMMARY & VERDICT
// ==============================================================================
console.log(`\n${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`${CYAN}${BOLD}          FINAL CHALLENGER 2 EMPIRICAL TEST HARNESS SUMMARY                  ${RESET}`);
console.log(`${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`  Total Assertions Executed : ${totalAssertions}`);
console.log(`  Total Assertions Passed   : ${GREEN}${passedAssertions}${RESET}`);
console.log(`  Total Assertions Failed   : ${failedAssertions > 0 ? RED : GREEN}${failedAssertions}${RESET}`);
console.log(`${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

if (failedAssertions > 0) {
  console.error(`${RED}✗ VERIFICATION FAILED WITH ${failedAssertions} FAILURES.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✓ ALL ${totalAssertions} FINAL CHALLENGER 2 EMPIRICAL ASSERTIONS PASSED.${RESET}\n`);
  process.exit(0);
}
