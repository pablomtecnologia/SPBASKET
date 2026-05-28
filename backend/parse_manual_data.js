const fs = require('fs');
const path = require('path');

function parseMatches(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const matches = [];
    let currentRound = 1; // Start round? Or try to detect it? 
    // The text input doesn't explicitly say "Jornada 1", but has "Jornada" header. 
    // We might need to guess the round or just number them sequentially/chronologically?
    // Actually, usually these lists are ordered by Round.
    // Let's assume the blocks are separated by "Jornada..." headers.

    // BUT the text provided has "Jornada\nEquipo local\nEquipo visitante" interspersed.
    // Let's try to detect matches based on Date/Time pattern.

    let matchBuffer = [];

    // Pattern for Date Time: DD/MM/YYYY HH:MM
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/;

    let i = 0;
    let roundCount = 0; // Increment every time we see "Jornada" header

    while (i < lines.length) {
        const line = lines[i];

        if (line === 'Jornada' && lines[i + 1] === 'Equipo local' && lines[i + 2] === 'Equipo visitante') {
            roundCount++;
            i += 3;
            continue;
        }

        if (line === 'Cambios' && lines[i + 1] === '|') {
            // Skip change markers
            i += 2;
            continue;
        }

        if (dateRegex.test(line)) {
            // Start of a match block
            const dateStr = line;
            let venue = lines[++i];

            // Handle "Cambios |" appearing inside match block sometimes?
            // The user text has:
            // 15/02/2026 17:00
            // Cambios
            // |
            // PABELLON GERARDO DIEGO
            if (venue === 'Cambios') {
                i++; // Skip |
                venue = lines[++i];
            }

            const homeTeam = lines[++i];
            let homeScore = lines[++i];

            // Check for "Prepartido" keyword which indicates no score yet
            if (homeScore === 'Prepartido') {
                // Formatting: 
                // Home Team
                // -
                // Prepartido
                // Away Team
                // -

                // Adjustment for prediction format in raw text:
                // TEAM
                // -
                // Prepartido
                // TEAM
                // -

                // Let's re-read the specific raw text format for upcoming matches:
                /*
                13/02/2026 21:20
                Cambios
                |
                PABELLON MONTE

                FINANCIALBROK CORREDURÍA DE SEGUROS
                -
                Prepartido

                CANTBASKET04
                -
                */

                // So: 
                // 1. Date
                // 2. (Optional) Cambios |
                // 3. Venue
                // 4. Home Team
                // 5. Home Score ("-" or number)
                // 6. (Optional) "Prepartido"
                // 7. Away Team
                // 8. Away Score ("-" or number)

                homeScore = '-'; // It was literal "-" in text

                // Check if next is Prepartido
                if (lines[i + 1] === 'Prepartido') {
                    i++; // Skip Prepartido
                }

                const awayTeam = lines[++i];
                let awayScore = lines[++i];

                matches.push({
                    round: roundCount || 1, // Fallback
                    date: dateStr.split(' ')[0],
                    time: dateStr.split(' ')[1],
                    venue: venue,
                    homeTeam: homeTeam,
                    homeScore: homeScore === '-' ? null : parseInt(homeScore),
                    awayTeam: awayTeam,
                    awayScore: awayScore === '-' ? null : parseInt(awayScore)
                });

            } else {
                // Normal match with scores or just "-" without Prepartido keyword explicitly in between sometimes?
                // The structure for played games:
                /*
                05/10/2025 10:00
                PABELLON MARCELINO BOTIN

                CANTBASKET04 U18
                100

                MIMOONDO- TVGA
                102
                */
                // Home Team
                // Score
                // Away Team
                // Score

                const awayTeam = lines[++i];
                const awayScore = lines[++i];

                matches.push({
                    round: roundCount || 1, // Fallback
                    date: dateStr.split(' ')[0],
                    time: dateStr.split(' ')[1],
                    venue: venue,
                    homeTeam: homeTeam,
                    homeScore: isNaN(parseInt(homeScore)) ? null : parseInt(homeScore),
                    awayTeam: awayTeam,
                    awayScore: isNaN(parseInt(awayScore)) ? null : parseInt(awayScore)
                });
            }
        }
        i++;
    }

    // Post-process rounds:
    // If we didn't get rounds correctly (e.g. first block has no header), adjust.
    // However, the provided text seems to group matches by date or block.
    // A better way for round assignment:
    // Sort by date.
    // Group by weekend/week proximity -> Assign rounds 1..N.

    // Fix Dates: formatted as DD/MM/YYYY.
    // Convert to ISO or sortable?
    // Data is coming in as DD/MM/YYYY.

    matches.sort((a, b) => {
        const da = a.date.split('/').reverse().join('');
        const db = b.date.split('/').reverse().join('');
        return da.localeCompare(db) || a.time.localeCompare(b.time);
    });

    // Assign Rounds:
    // Simplistic approach: Matches within 4 days of each other are same round?
    // Or just group by clusters.

    // Actually, "roundCount" from headers might be reliable if headers are present for every round.
    // In the text, "Jornada" appears frequently.

    // Let's create a smarter round assigner if header based one failed (i.e. roundCount is 0 or 1 for too many)
    // The text provided starts with matches, then "Jornada", then matches.
    // So the first block is Round 1.
    // Then "Jornada" -> Round 2.

    // We initialized roundCount = 0.
    // If we encounter a match BEFORE the first "Jornada" header, it should be Round 1?
    // But the header "Jornada" usually precedes the list.
    // User text:
    /*
    05/10/2025 ... match
    ...
    Jornada
    Equipo local ...
    11/10/2025 ... match
    */
    // The first block has NO "Jornada" header at the very top of file?
    // If so, roundCount was 0.

    let currentR = 1;
    matches.forEach(m => {
        if (m.round === 0) m.round = 1; // First block
        // Wait, if roundCount increments, we need to apply it correctly.
        // My parsing logic applied current `roundCount` to the match found.
        // If the first block had NO header, roundCount was 0.
        // The header for "Jornada 2" (assuming) appears after.
        // So 0 -> 1.
        // But subsequent headers increment it.
        // Check input text structure again.
        // "Jornada \n Equipo local..." appears AFTER first block?
        // 05/10/2025 match...
        // ...
        // Jornada...
        // 11/10/2025 match...

        // This implies first block is J1. Next is J2.
        // So if roundCount=0, treat as 1.
        // If roundCount=1 (after one header), treat as 2?
        // Let's just re-map rounds sequentially based on distinct dates?
    });

    // Let's re-assign rounds strictly based on "Jornada" occurrences in file stream.
    // I need to reset parsing to be more state-machine like.

    return parseMatchesstream(lines);
}

function parseMatchesstream(lines) {
    const matches = [];
    let currentRound = 1;
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/;

    let i = 0;
    while (i < lines.length) {
        let line = lines[i];

        if (line === 'Jornada' && lines[i + 1] === 'Equipo local') {
            // This signifies the start of a NEW round block usually?
            // Or the header for the *current* block.
            // If we have parsed matches already, this might be the NEXT round.
            // If it's at the very start, it's Round 1.
            // In the text, dates come first, then Jornada header.
            // This is weird.
            // "05/10 match... 04/10 match... Jornada... 11/10 match"
            // If the header separates blocks, then the first block is R1.
            // The header appears *between* blocks.
            // So when we see "Jornada", we increment round.
            if (matches.length > 0) {
                currentRound++;
            }
            i += 3; // ensure skip
            continue;
        }

        if (dateRegex.test(line)) {
            // Match found
            const dateStr = line;
            i++;
            let venue = lines[i];

            if (venue === 'Cambios') {
                i++; // changes
                if (lines[i] === '|') i++;
                venue = lines[i];
            }

            const homeTeam = lines[++i];
            let homeScoreStr = lines[++i];

            // Check formatted upcoming
            if (homeScoreStr === '-') {
                // Upcoming
                if (lines[i + 1] === 'Prepartido') i++;
                const awayTeam = lines[++i];
                const awayScoreStr = lines[++i];

                matches.push({
                    round: currentRound,
                    match_date: dateStr.split(' ')[0],
                    match_time: dateStr.split(' ')[1],
                    home_team: homeTeam,
                    away_team: awayTeam,
                    home_score: null,
                    away_score: null,
                    location: venue,
                    status: 'upcoming'
                });
            } else {
                // Played
                const awayTeam = lines[++i];
                const awayScoreStr = lines[++i];
                matches.push({
                    round: currentRound,
                    match_date: dateStr.split(' ')[0],
                    match_time: dateStr.split(' ')[1],
                    home_team: homeTeam,
                    away_team: awayTeam,
                    home_score: parseInt(homeScoreStr),
                    away_score: parseInt(awayScoreStr),
                    location: venue,
                    status: 'played'
                });
            }
        }
        i++;
    }
    return matches;
}

function parseStandings(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const standings = [];

    // Find start of table data
    // Header: Equipo... Racha
    // Data starts after "Racha" or after "PTS" depending on text

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === 'Racha') {
            startIndex = i + 1;
            break;
        }
    }

    if (startIndex === -1) {
        // Maybe different format?
        // Look for "1" (position) followed by team name
        // "1"
        // "TEAM NAME"
        // "13" (J)
    }

    // Let's just iterate and try to match the block pattern
    // Pos (int)
    // Team (string)
    // J (int)
    // V
    // P
    // NP
    // PF
    // PC
    // PTS
    // Racha (string/int) - Optional?

    // User text sample:
    /*
    1

    MIMOONDO- TVGA
    13
    12
    1
    0
    981
    739
    25
    */
    // There can be empty lines. We filtered them.

    // Pattern:
    // [Int]
    // [String]
    // [Int] x 7 (J, V, P, NP, PF, PC, PTS)
    // Note: User text *doesn't* clearly show Racha in the data block sometimes?
    // Wait, the header has Racha.
    // Input: "25" is PTS.
    // Does it have Racha number?
    // Let's assume the block ends at PTS for now, or check if next is an integer (Rank of next team).

    let i = startIndex > -1 ? startIndex : 0;

    while (i < lines.length) {
        // validation: current line should be Position (number)
        const pos = parseInt(lines[i]);
        if (isNaN(pos)) {
            i++;
            continue;
        }

        // Block start
        const position = pos;
        const teamName = lines[++i];
        const played = parseInt(lines[++i]);
        const won = parseInt(lines[++i]);
        const lost = parseInt(lines[++i]);
        const np = parseInt(lines[++i]); // NP
        const pf = parseInt(lines[++i]);
        const pc = parseInt(lines[++i]);
        const pts = parseInt(lines[++i]);

        standings.push({
            position,
            team_name: teamName,
            played,
            won,
            lost,
            points_for: pf,
            points_against: pc,
            points: pts
        });

        // Skip possible "Racha" or noise?
        // Next line should be next Position (i.e. '2').
        // If lines[i+1] is '2', we are good.
        // User text doesn't show Racha value in the example: "25" (PTS) -> "2" (Next Pos).
        // So maybe no Racha line.

        i++;
    }

    return standings;
}

// MAIN
async function run() {
    const negraMatches = fs.readFileSync(path.join(__dirname, 'raw_spnegro_matches.txt'), 'utf-8');
    const negraStandings = fs.readFileSync(path.join(__dirname, 'raw_spnegro_standings.txt'), 'utf-8');
    const rosaMatches = fs.readFileSync(path.join(__dirname, 'raw_sprosa_matches.txt'), 'utf-8');
    const rosaStandings = fs.readFileSync(path.join(__dirname, 'raw_sprosa_standings.txt'), 'utf-8');

    const data = {
        spnegro: {
            matches: parseMatches(negraMatches),
            standings: parseStandings(negraStandings)
        },
        sprosa: {
            matches: parseMatches(rosaMatches),
            standings: parseStandings(rosaStandings)
        }
    };

    console.log(JSON.stringify(data, null, 2));

    // Save to JSON for verification
    fs.writeFileSync(path.join(__dirname, 'parsed_manual_data.json'), JSON.stringify(data, null, 2));
}

run();
