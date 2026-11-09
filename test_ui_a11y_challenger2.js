/**
 * test_ui_a11y_challenger2.js
 * 
 * Comprehensive Empirical UI, Accessibility, and Button Hierarchy Test Harness
 * Designed for Challenger 2 (teamwork_challenger)
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const content = fs.readFileSync(htmlPath, 'utf8');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function suite(name, fn) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  fn();
}

// Extract components from index.html
const shellMatch = content.match(/function ExamProctoredShell\(\{[\s\S]*?\n\s*\/\/ ==========================================\s*\n\s*\/\/ 14\./);
const shellCode = shellMatch ? shellMatch[0] : '';

const drillsMatch = content.match(/function DrillsView\(\{[\s\S]*?\n\s*\/\/ ==========================================\s*\n\s*\/\/ 16\./);
const drillsCode = drillsMatch ? drillsMatch[0] : '';

const appMatch = content.match(/function App\(\)\s*\{[\s\S]*?\n\s*\/\/ ==========================================\s*\n\s*\/\/ 16\./);
const appCode = appMatch ? appMatch[0] : '';

const matrixMatch = content.match(/function QuestionReviewMatrixModal\(\{[\s\S]*?\n\s*\/\/ Pause Modal/);
const matrixCode = matrixMatch ? matrixMatch[0] : '';

// ============================================================================
// SUITE 1: Multiple-Choice Option Accessibility & Keyboard Semantics
// ============================================================================
suite('Suite 1: Multiple-Choice Option Accessibility & Keyboard Semantics', () => {
  assert(shellCode.length > 0, 'ExamProctoredShell function extracted from index.html');
  assert(drillsCode.length > 0, 'DrillsView function extracted from index.html');

  // Check ExamProctoredShell MC options
  assert(shellCode.includes('role="radiogroup"'), 'ExamProctoredShell contains container with role="radiogroup"');
  assert(shellCode.includes('aria-label="Answer options"'), 'ExamProctoredShell radiogroup has aria-label="Answer options"');
  assert(shellCode.includes('role="radio"'), 'ExamProctoredShell option cards have role="radio"');
  assert(shellCode.includes('aria-checked={isSelected}'), 'ExamProctoredShell options bind aria-checked={isSelected}');
  assert(shellCode.includes('aria-disabled={isEliminated}'), 'ExamProctoredShell options bind aria-disabled={isEliminated}');
  assert(shellCode.includes('tabIndex={0}'), 'ExamProctoredShell option cards have tabIndex={0} for keyboard focusability');
  assert(/onKeyDown=\{\(e\)\s*=>\s*\{[\s\S]*?(?:e\.key\s*===\s*['"] ['"]|e\.key\s*===\s*['"]Enter['"])[\s\S]*?handleAnswerSelect\(letter\)/.test(shellCode),
    'ExamProctoredShell options handle onKeyDown with Space and Enter to trigger handleAnswerSelect');
  assert(shellCode.includes('focus-visible:ring-2'), 'ExamProctoredShell options specify focus-visible:ring-2');
  assert(shellCode.includes('focus-visible:ring-indigo-500'), 'ExamProctoredShell options specify focus-visible:ring-indigo-500');
  assert(shellCode.includes('focus-visible:outline-none'), 'ExamProctoredShell options specify focus-visible:outline-none');
  assert(shellCode.includes('active:scale-[0.99]'), 'ExamProctoredShell options specify tactile active scaling');

  // Check DrillsView MC options
  assert(drillsCode.includes('role="radiogroup"'), 'DrillsView contains container with role="radiogroup"');
  assert(drillsCode.includes('aria-label="Drill options"'), 'DrillsView radiogroup has aria-label="Drill options"');
  assert(drillsCode.includes('role="radio"'), 'DrillsView option buttons have role="radio"');
  assert(drillsCode.includes('aria-checked={isSelected}'), 'DrillsView options bind aria-checked={isSelected}');
  assert(drillsCode.includes('focus-visible:ring-2'), 'DrillsView option buttons specify focus-visible:ring-2');
  assert(drillsCode.includes('focus-visible:ring-indigo-500'), 'DrillsView option buttons specify focus-visible:ring-indigo-500');
  assert(drillsCode.includes('active:scale-[0.99]'), 'DrillsView option buttons specify active:scale-[0.99]');
});

// ============================================================================
// SUITE 2: Option Eliminator Keyboard Focusability & Visibility
// ============================================================================
suite('Suite 2: Option Eliminator Keyboard Focusability & Visibility', () => {
  const eliminatorMatch = content.match(/<button\s+onClick=\{\(e\)\s*=>\s*toggleEliminate\(e,\s*letter\)\}[\s\S]*?<\/button>/);
  assert(!!eliminatorMatch, 'Option eliminator toggle button element found');
  const elCode = eliminatorMatch ? eliminatorMatch[0] : '';

  assert(elCode.includes('aria-label={`Eliminate option ${letter}`}') || elCode.includes('aria-label="Eliminate option'),
    'Eliminator button specifies descriptive aria-label with option letter');
  assert(elCode.includes('title="Eliminate Option"'), 'Eliminator button has title="Eliminate Option" tooltip');
  assert(elCode.includes('focus-visible:ring-2'), 'Eliminator button has focus-visible:ring-2 for keyboard visibility');
  assert(elCode.includes('focus-visible:ring-indigo-500'), 'Eliminator button has focus-visible:ring-indigo-500 focus indicator');
  assert(elCode.includes('focus:opacity-100') || elCode.includes('group-focus-within:opacity-100'),
    'Eliminator button becomes fully visible on keyboard focus (focus:opacity-100 / group-focus-within:opacity-100)');
  assert(elCode.includes('active:scale-95') || elCode.includes('active:scale-[0.98]'),
    'Eliminator button has tactile active scaling feedback');
  assert(elCode.includes('line-through font-bold">ABC</span>'), 'Eliminator button contains ABC strikethrough icon');
});

// ============================================================================
// SUITE 3: Button Visual Hierarchy, Tactile Feedback & Focus Rings
// ============================================================================
suite('Suite 3: Button Visual Hierarchy, Tactile Feedback & Focus Rings', () => {
  // Check Primary Button Classes in index.html
  const primaryPattern = /bg-indigo-600\s+hover:bg-indigo-700[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/g;
  const primaryMatches = content.match(primaryPattern) || [];
  assert(primaryMatches.length >= 5, `Primary buttons consistently implement active:scale-[0.98] and focus-visible:ring-2 (found: ${primaryMatches.length})`);

  // Check Danger Button Classes
  const dangerPattern = /bg-rose-600\s+hover:bg-rose-700[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/g;
  const dangerMatches = content.match(dangerPattern) || [];
  assert(dangerMatches.length >= 1, `Danger buttons implement active:scale-[0.98] and focus-visible:ring-2 (found: ${dangerMatches.length})`);

  // Check Secondary Button Classes
  const secondaryPattern = /bg-slate-100[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/g;
  const secondaryMatches = content.match(secondaryPattern) || [];
  assert(secondaryMatches.length >= 3, `Secondary buttons implement active:scale-[0.98] and focus-visible:ring-2 (found: ${secondaryMatches.length})`);

  // Check Icon-Only Button Classes
  const iconOnlyPattern = /p-2\s+rounded-xl\s+text-slate-500[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/g;
  const iconMatches = content.match(iconOnlyPattern) || [];
  assert(iconMatches.length >= 1, `Icon-Only buttons implement active:scale-[0.98] and focus-visible:ring-2 (found: ${iconMatches.length})`);

  // Verify Exam Shell Specific Interactive Controls
  assert(/toggleBookmark[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/.test(shellCode),
    'Mark for review button has active:scale-[0.98] and focus-visible:ring-2');

  assert(/onClick=\{handleNext\}[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/.test(shellCode),
    'Next question button has active:scale-[0.98] and focus-visible:ring-2');
  assert(/onClick=\{handlePrev\}[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/.test(shellCode),
    'Back question button has active:scale-[0.98] and focus-visible:ring-2');

  assert(/setIsReviewOpen\(true\)[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/.test(shellCode),
    'Review matrix button in footer has active:scale-[0.98] and focus-visible:ring-2');

  assert(/onClick=\{onExitExam\}[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2/.test(shellCode),
    'Exit Test button has active:scale-[0.98] and focus-visible:ring-2');
});

// ============================================================================
// SUITE 4: Navigation Bar ARIA Tablist & Tab Semantics
// ============================================================================
suite('Suite 4: Navigation Bar ARIA Tablist & Tab Semantics', () => {
  assert(appCode.length > 0, 'App component extracted from index.html');

  // Navigation tablist container
  assert(appCode.includes('role="tablist"'), 'Navigation container has role="tablist"');
  assert(appCode.includes('aria-label="Main Navigation"'), 'Navigation tablist has aria-label="Main Navigation"');

  // Navigation tabs
  assert(appCode.includes('role="tab"'), 'Navigation buttons have role="tab"');
  assert(appCode.includes('aria-selected={isActive}'), 'Navigation tabs bind aria-selected={isActive}');
  assert(/role="tab"[\s\S]*?active:scale-\[0\.98\][\s\S]*?focus-visible:ring-2\s+focus-visible:ring-indigo-500/.test(appCode),
    'Navigation tabs feature active:scale-[0.98] and focus-visible:ring-2 indicators');

  // 5 standard tabs present
  assert(appCode.includes("id: 'lessons'"), "Tablist contains 'lessons' tab");
  assert(appCode.includes("id: 'drills'"), "Tablist contains 'drills' tab");
  assert(appCode.includes("id: 'mocks'"), "Tablist contains 'mocks' tab");
  assert(appCode.includes("id: 'analytics'"), "Tablist contains 'analytics' tab");
  assert(appCode.includes("id: 'settings'"), "Tablist contains 'settings' tab");
});

// ============================================================================
// SUITE 5: Active Exam Preservation & Zero-Reload State Invariants
// ============================================================================
suite('Suite 5: Active Exam Preservation & Zero-Reload State Invariants', () => {
  // 1. ExamProctoredShell remains mounted in memory
  const shellMountRegex = /\{activeExamId\s*&&\s*\(\s*<div\s+className=\{currentView\s*===\s*['"]exam['"]\s*\?\s*['"]fixed inset-0 z-50 flex flex-col bg-slate-900['"]\s*:\s*['"]hidden['"]\}>[\s\S]*?<ExamProctoredShell/;
  assert(shellMountRegex.test(appCode),
    'ExamProctoredShell remains mounted in DOM with CSS hidden class when switching away from exam view (preserving answers & timer in memory)');

  // 2. handleExitExam keeps activeExamId alive
  const exitHandlerRegex = /const handleExitExam\s*=\s*\(\)\s*=>\s*\{[\s\S]*?confirm\("Are you sure you want to exit the exam\? Your progress will be saved in memory\."\)[\s\S]*?setCurrentView\(['"]mocks['"]\);[\s\S]*?\};/;
  assert(exitHandlerRegex.test(appCode),
    'handleExitExam prompts confirmation and sets currentView to "mocks" without clearing activeExamId');

  // 3. handleFinishExam correctly finalizes exam
  const finishHandlerRegex = /const handleFinishExam\s*=\s*\(attemptRecord\)\s*=>\s*\{[\s\S]*?saveExamAttempt\(attemptRecord\);[\s\S]*?setActiveExamId\(null\);[\s\S]*?setCurrentView\(['"]analytics['"]\);[\s\S]*?\};/;
  assert(finishHandlerRegex.test(appCode),
    'handleFinishExam saves attempt record, resets activeExamId to null, and routes to analytics');

  // 4. Resume Mock header button
  const headerResumeRegex = /\{activeExamId\s*\?\s*\(\s*<button[\s\S]*?onClick=\{\(\)\s*=>\s*setCurrentView\(['"]exam['"]\)\}[\s\S]*?Resume Mock\s*\{activeExamId\}/;
  assert(headerResumeRegex.test(appCode),
    'Header renders pulsing "Resume Mock {activeExamId}" button whenever activeExamId is set');

  // 5. MocksHubView receives activeExamId
  assert(appCode.includes('<MocksHubView') && appCode.includes('activeExamId={activeExamId}'),
    'MocksHubView component receives activeExamId prop');

  // 6. MocksHubView card displays Resume Exam for active mock
  const mocksHubMatch = content.match(/function MocksHubView\(\{[\s\S]*?\n\s*\/\/ ==========================================\s*\n\s*\/\/ 17\./);
  const mocksHubCode = mocksHubMatch ? mocksHubMatch[0] : '';

  assert(mocksHubCode.includes('Resume Exam'), 'MocksHubView renders "Resume Exam" label on active exam card');
  assert(mocksHubCode.includes('Resume Mock ${activeExamId}') || mocksHubCode.includes('Resume Mock '),
    'MocksHubView hero banner renders "Resume Mock {activeExamId}" when an exam is active');
  assert(mocksHubCode.includes('animate-pulse'), 'Active mock button on MocksHubView features animate-pulse styling');

  // 7. Lifted drill state in App
  assert(appCode.includes('const [drillAnswers, setDrillAnswers] = React.useState({});'),
    'App manages lifted drillAnswers state to prevent state loss across view changes');
  assert(appCode.includes('const [drillSubmitted, setDrillSubmitted] = React.useState({});'),
    'App manages lifted drillSubmitted state to prevent submission loss across view changes');
  assert(appCode.includes('externalAnswers={drillAnswers}') && appCode.includes('setExternalAnswers={setDrillAnswers}'),
    'App passes lifted drill state and setter to DrillsView (externalAnswers / setExternalAnswers)');
});

// ============================================================================
// SUITE 6: Modal Dialog Accessibility (Review Matrix & Modals)
// ============================================================================
suite('Suite 6: Modal Dialog Accessibility (Review Matrix & Modals)', () => {
  assert(matrixCode.length > 0, 'QuestionReviewMatrixModal extracted from index.html');
  assert(matrixCode.includes('role="dialog"'), 'Question Review Matrix has role="dialog"');
  assert(matrixCode.includes('aria-modal="true"'), 'Question Review Matrix has aria-modal="true"');
  assert(matrixCode.includes('aria-labelledby="matrix-title"'), 'Question Review Matrix has aria-labelledby="matrix-title"');
  assert(matrixCode.includes('id="matrix-title"'), 'Review Matrix modal header has matching id="matrix-title"');
  assert(matrixCode.includes('aria-label="Close Review Matrix"'), 'Review Matrix close button has aria-label="Close Review Matrix"');
  assert(matrixCode.includes('aria-label={`Question ${idx + 1}:'),
    'Review Matrix cell buttons have detailed dynamic aria-labels reporting question status');
  assert(matrixCode.includes('active:scale-95') && matrixCode.includes('focus-visible:ring-2'),
    'Review Matrix cell buttons feature active:scale-95 and focus-visible:ring-2');
});

// ============================================================================
// SUITE 7: Space Optimization & View Spacing Reductions
// ============================================================================
suite('Suite 7: Space Optimization & View Spacing Reductions', () => {
  // Test Runner Split View Padding
  assert(content.includes('p-5 sm:p-6 overflow-y-auto'), 'Test runner question and passage panes use compact p-5 sm:p-6 padding');
  assert(content.includes('h-9 px-4 sm:px-6'), 'Test runner pane headers use compact h-9 height');
  assert(content.includes('h-14 bg-white dark:bg-zinc-900 border-t'), 'Test runner shell footer uses compact h-14 height');
  assert(content.includes('mb-4 leading-relaxed'), 'Question stems use tight mb-4 bottom margin');
  assert(content.includes('space-y-2.5'), 'Multiple choice options use compact space-y-2.5 vertical gap');

  // Top Nav Header
  assert(content.includes('h-14 flex items-center justify-between'), 'Top navigation header compacted to h-14');
  assert(content.includes('py-2'), 'Student motivation banner compacted to py-2');

  // Lessons, Drills, and Analytics View Containers
  assert(content.includes('max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6'), 'LessonsView container uses compact py-5 sm:py-6 padding');
  assert(drillsCode.includes('max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6'), 'DrillsView container uses compact py-5 sm:py-6 padding');
  assert(content.includes('max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-6'), 'SettingsView container uses compact py-5 sm:py-6 padding');
  assert(content.includes('max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6'), 'AnalyticsView container uses compact py-5 sm:py-6 padding');
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  UI & ACCESSIBILITY STRESS TEST HARNESS SUMMARY`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Total Assertions Executed : ${totalAssertions}`);
console.log(`  Total Passed              : ${passedAssertions}`);
console.log(`  Total Failed              : ${failedAssertions}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (failedAssertions > 0) {
  console.error(`✗ TEST SUITE FAILED: ${failedAssertions} assertions failed.`);
  process.exit(1);
} else {
  console.log(`✓ ALL ${totalAssertions} UI & ACCESSIBILITY ASSERTIONS PASSED WITH ZERO FAILURES.\n`);
  process.exit(0);
}
