const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];

console.log('Babel script length:', babelScript.length);

// Search for function definitions and const declarations
const lines = babelScript.split('\n');
console.log('Total lines in babel script:', lines.length);

// Find functions or constants related to score, grid, question, mock, eval
const matches = [];
lines.forEach((line, index) => {
  if (/function\s+[a-zA-Z0-9_]+/i.test(line) || /const\s+[a-zA-Z0-9_]+\s*=/i.test(line)) {
    if (/score|grid|eval|mock|question|answer|rw|math|adaptive|scale/i.test(line)) {
      matches.push({ lineNum: index + 1, content: line.trim() });
    }
  }
});

console.log(`Found ${matches.length} matching declarations:`);
matches.slice(0, 50).forEach(m => console.log(`L${m.lineNum}: ${m.content}`));
if (matches.length > 50) {
  console.log(`... and ${matches.length - 50} more`);
}
