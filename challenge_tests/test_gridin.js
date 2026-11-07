const fs = require('fs');
const vm = require('vm');

// Extract evaluateGridIn from index.html
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];

// Extract the function evaluateGridIn
const funcMatch = babelScript.match(/function evaluateGridIn\([\s\S]*?\n    \}/);
if (!funcMatch) {
  console.error("Could not extract evaluateGridIn from index.html");
  process.exit(1);
}

const context = {};
vm.createContext(context);
vm.runInContext(funcMatch[0], context);
const evaluateGridIn = context.evaluateGridIn;

console.log("Successfully loaded evaluateGridIn from index.html");

// Let's test a battery of cases
const tests = [
  // Exact integers
  { user: "42", target: "42", expected: true, desc: "Exact integer" },
  { user: "0", target: "0", expected: true, desc: "Exact zero" },
  { user: "-5", target: "-5", expected: true, desc: "Negative integer" },

  // Leading / trailing zeroes
  { user: "007", target: "7", expected: true, desc: "Leading zeroes integer" },
  { user: "0.5", target: "0.5", expected: true, desc: "Decimal with leading zero" },
  { user: ".5", target: "0.5", expected: true, desc: "Decimal without leading zero (.5)" },
  { user: "2.500", target: "2.5", expected: true, desc: "Trailing zeroes decimal" },
  { user: "00.500", target: "0.5", expected: true, desc: "Leading and trailing zeroes" },

  // Whitespace
  { user: "  3/4  ", target: "3/4", expected: true, desc: "Whitespace padding fraction" },
  { user: "\t12.5\n", target: "12.5", expected: true, desc: "Whitespace tab/newline" },

  // Fractions & unsimplified
  { user: "3/4", target: "3/4", expected: true, desc: "Exact fraction" },
  { user: "6/8", target: "3/4", expected: true, desc: "Unsimplified fraction" },
  { user: "144/12", target: "12", expected: true, desc: "Unsimplified improper fraction" },
  { user: "-7/2", target: "-3.5", expected: true, desc: "Negative fraction to decimal" },
  { user: "-3.5", target: "-7/2", expected: true, desc: "Negative decimal to fraction" },
  { user: "-.75", target: "-3/4", expected: true, desc: "Negative leading dot to fraction" },

  // Repeating decimals (1/3)
  { user: "0.333", target: "1/3", expected: true, desc: "1/3 truncated 3 digits" },
  { user: ".333", target: "1/3", expected: true, desc: "1/3 leading dot truncated 3 digits" },
  { user: "0.3333", target: "1/3", expected: true, desc: "1/3 truncated 4 digits" },
  { user: ".3333", target: "1/3", expected: true, desc: "1/3 leading dot truncated 4 digits" },
  { user: "0.33333", target: "1/3", expected: true, desc: "1/3 5 digits" },
  { user: "0.334", target: "1/3", expected: false, desc: "1/3 false rounding 0.334" },
  { user: "0.3334", target: "1/3", expected: false, desc: "1/3 false rounding 0.3334" },

  // Repeating decimals (2/3)
  { user: "0.666", target: "2/3", expected: true, desc: "2/3 truncated 3 digits" },
  { user: ".666", target: "2/3", expected: true, desc: "2/3 leading dot truncated 3 digits" },
  { user: "0.667", target: "2/3", expected: true, desc: "2/3 rounded 3 digits" },
  { user: ".667", target: "2/3", expected: true, desc: "2/3 leading dot rounded 3 digits" },
  { user: "0.6666", target: "2/3", expected: true, desc: "2/3 truncated 4 digits" },
  { user: "0.6667", target: "2/3", expected: true, desc: "2/3 rounded 4 digits" },
  { user: "0.665", target: "2/3", expected: false, desc: "2/3 incorrect rounding 0.665" },
  { user: "0.668", target: "2/3", expected: false, desc: "2/3 incorrect rounding 0.668" },

  // Repeating decimals (1/6 = 0.16666...)
  { user: "0.166", target: "1/6", expected: true, desc: "1/6 truncated 3 digits" },
  { user: "0.167", target: "1/6", expected: true, desc: "1/6 rounded 3 digits" },

  // Array of valid targets
  { user: "25/2", target: ["25/2", "12.5"], expected: true, desc: "Target array fraction" },
  { user: "12.5", target: ["25/2", "12.5"], expected: true, desc: "Target array decimal" },

  // Illegal inputs
  { user: "1 1/2", target: "1.5", expected: false, desc: "Mixed number '1 1/2'" },
  { user: "1/2/3", target: "0.1666", expected: false, desc: "Multiple slashes '1/2/3'" },
  { user: "1.2.3", target: "1.23", expected: false, desc: "Multiple decimals '1.2.3'" },
  { user: "..5", target: "0.5", expected: false, desc: "Double dot '..5'" },
  { user: "--5", target: "5", expected: false, desc: "Double negative '--5'" },
  { user: "5-2", target: "3", expected: false, desc: "Embedded subtraction '5-2'" },
  { user: "-", target: "0", expected: false, desc: "Lone dash '-'" },
  { user: "/", target: "0", expected: false, desc: "Lone slash '/'" },
  { user: ".", target: "0", expected: false, desc: "Lone dot '.'" },
  { user: "-.", target: "0", expected: false, desc: "Lone negative dot '-.'" },
  { user: "5/0", target: "5", expected: false, desc: "Division by zero '5/0'" },
  { user: "-5/0", target: "-5", expected: false, desc: "Negative division by zero '-5/0'" },
  { user: "0/0", target: "0", expected: false, desc: "Zero divided by zero '0/0'" },
  { user: "0/1", target: "0", expected: true, desc: "Zero numerator '0/1'" },
  { user: "abc", target: "5", expected: false, desc: "Alphabetic 'abc'" },
  { user: "5x", target: "5", expected: false, desc: "Alphanumeric '5x'" },
  { user: "$10", target: "10", expected: false, desc: "Symbol '$10'" },
  { user: "50%", target: "0.5", expected: false, desc: "Percent '50%'" },
  { user: "", target: "5", expected: false, desc: "Empty string" },
  { user: "   ", target: "5", expected: false, desc: "Whitespace string" },
  { user: null, target: "5", expected: false, desc: "null" },
  { user: undefined, target: "5", expected: false, desc: "undefined" },
  { user: "1e5", target: "100000", expected: false, desc: "Scientific notation '1e5'" },
  { user: "NaN", target: "0", expected: false, desc: "'NaN' string" },
  { user: "Infinity", target: "0", expected: false, desc: "'Infinity' string" },

  // Edge cases: Decimal inside fraction
  { user: "1.5/3", target: "0.5", expected: false, desc: "Decimal inside fraction '1.5/3' (SAT prohibits)" },
  { user: "3/1.5", target: "2", expected: false, desc: "Decimal in denominator '3/1.5' (SAT prohibits)" },

  // Tolerance leak checks
  { user: "0.3334", target: "1/3", expected: false, desc: "Tolerance leak: 0.3334 for 1/3" },
  { user: "0.6668", target: "2/3", expected: false, desc: "Tolerance leak: 0.6668 for 2/3" },
];

let passed = 0;
let failed = 0;
const failures = [];

tests.forEach((t, i) => {
  const res = evaluateGridIn(t.user, t.target);
  const ok = res.isCorrect === t.expected;
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push({
      index: i + 1,
      desc: t.desc,
      user: t.user,
      target: t.target,
      expected: t.expected,
      actual: res.isCorrect,
      message: res.message
    });
  }
});

console.log(`\nGrid-In Test Results: ${passed} passed, ${failed} failed (Total: ${tests.length})`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach(f => {
    console.log(`[#${f.index}] ${f.desc} | input: "${f.user}", target: "${f.target}" | expected: ${f.expected}, got: ${f.actual} (msg: ${f.message})`);
  });
}
