const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
console.log('Total characters:', html.length);
console.log('Total lines:', html.split('\n').length);

const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
console.log('Script tags count:', scriptMatches.length);
scriptMatches.forEach((m, i) => {
  console.log(`Script ${i}: attributes: "${m[1].trim()}" - inner length: ${m[2].length}`);
});
