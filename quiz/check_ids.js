const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

// Find all document.getElementById('...')
const regex = /document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/g;
let match;
const idsInScript = new Set();
while ((match = regex.exec(script)) !== null) {
  idsInScript.add(match[1]);
}

const missingIds = [];
for (const id of idsInScript) {
  const pattern1 = 'id="' + id + '"';
  const pattern2 = "id='" + id + "'";
  if (!html.includes(pattern1) && !html.includes(pattern2)) {
    missingIds.push(id);
  }
}

console.log('Total IDs found in script:', idsInScript.size);
console.log('Missing IDs from index.html:', missingIds);
