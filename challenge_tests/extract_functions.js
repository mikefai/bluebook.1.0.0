const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const babelScript = scriptMatches.find(m => m[1].includes('text/babel'))[2];
const lines = babelScript.split('\n');

console.log('=== evaluateGridIn ===');
for (let i = 2665; i < 2775; i++) {
  console.log(`${i}: ${lines[i]}`);
}

console.log('\n=== calculateScaledScore ===');
for (let i = 2775; i < 2815; i++) {
  console.log(`${i}: ${lines[i]}`);
}
