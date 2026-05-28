# FECAN API Documentation

## Base URL
`https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI`

## Authentication / Headers
The API requires specific headers to mimic a browser request from the official website.
*   **Origin**: `https://www.fecanbaloncesto.com`
*   **Referer**: `https://www.fecanbaloncesto.com/`
*   **User-Agent**: `Mozilla/5.0 ...` (Standard Browser User Agent)

## Endpoints

### 1. Get Team Card (Info, Standings, Players)
Returns detailed information about the team, club, standings, and players.

*   **URL**: `/FCBQWeb/getTeamCard/:TEAM_ID`
*   **Method**: `GET`
*   **Parameters**:
    *   `TEAM_ID`: The unique identifier for the team (e.g., `4046`).
*   **Response**: JSON object containing `club`, `team` (with `groups` -> `standing`), and `players`.

**Example:**
```http
GET https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI/FCBQWeb/getTeamCard/4046
```

### 2. Get Matches by Month
Returns the schedule and results for a specific team and month.

*   **URL**: `/Match/getByTeamAndMonth/:TEAM_ID/:MONTH`
*   **Method**: `GET`
*   **Parameters**:
    *   `TEAM_ID`: The unique identifier for the team (e.g., `4046`).
    *   `MONTH`: The month number (1 = January, 2 = February, ..., 12 = December).
*   **Response**: JSON object with a `messageData` array containing match details (`idMatch`, `localScore`, `visitorScore`, `matchDay`, `nameLocalTeam`, `nameVisitorTeam`, etc.).

**Example (February Matches):**
```http
GET https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI/Match/getByTeamAndMonth/4046/2
```

## Usage Example (JavaScript/Node.js)

```javascript
const axios = require('axios');

const BASE_URL = 'https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI';
const TEAM_ID = 4046;
const HEADERS = {
    'Origin': 'https://www.fecanbaloncesto.com',
    'Referer': 'https://www.fecanbaloncesto.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function getTeamData() {
    try {
        // 1. Get Team Info
        const teamRes = await axios.get(`${BASE_URL}/FCBQWeb/getTeamCard/${TEAM_ID}`, { headers: HEADERS });
        console.log('Team Info:', teamRes.data);

        // 2. Get Matches for Current Month
        const currentMonth = new Date().getMonth() + 1;
        const matchesRes = await axios.get(`${BASE_URL}/Match/getByTeamAndMonth/${TEAM_ID}/${currentMonth}`, { headers: HEADERS });
        console.log('matches:', matchesRes.data);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

getTeamData();
```
