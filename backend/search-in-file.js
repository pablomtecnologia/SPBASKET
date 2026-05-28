const fs = require('fs');

const content = fs.readFileSync('owbasket.js', 'utf8');
let log = '';

const contexts = [];
const regex = /\/calendar\/|\/schedule\/|\/matches\//g;
let match;
while ((match = regex.exec(content)) != null) {
    contexts.push(match.index);
}

log += 'Occurrences: ' + contexts.length + '\n\n';

for (let i = 0; i < contexts.length; i++) {
    const idx = contexts[i];
    log += `Occur #${i}: ` + content.substring(idx - 100, idx + 300) + '\n---\n';
}

fs.writeFileSync('search_log.txt', log);
console.log('Done.');
