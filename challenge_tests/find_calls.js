const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];
const lines = babelScript.split('\n');

lines.forEach((line, i) => {
  if (line.includes('calculateScaledScore')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
