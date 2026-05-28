const fs = require('fs');

const encoded = fs.readFileSync('team_card.json', 'utf8').replace(/^"|"$/g, ''); // Remove surrounding quotes if present
const decoded = Buffer.from(encoded, 'base64').toString('utf8');

fs.writeFileSync('team_data_decoded.json', decoded);
console.log('Decoded JSON saved to team_data_decoded.json');
