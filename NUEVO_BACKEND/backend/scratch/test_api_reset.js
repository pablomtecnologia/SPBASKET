const fetch = require('node-fetch');

async function test() {
  const matchId = 2334; // Usando el ID que vimos antes
  console.log(`Testing API Reset for match ${matchId}...`);
  
  const res = await fetch(`http://localhost:3009/api/matches/${matchId}/score`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ homeScore: null, awayScore: null, observations: null })
  });
  
  const data = await res.json();
  console.log('Response Status:', res.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
