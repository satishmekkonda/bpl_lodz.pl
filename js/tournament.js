// Playoff's global object
let playoffScores = {
    q1: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
    elim: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
    q2: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
    final: { sA: '', sB: '', done: false, teamA: '', teamB: '' }
};

function generateSchedule() {
    const courtLimit = parseInt(document.getElementById('court-count').value);
    let [startH, startM] = document.getElementById('start-time').value.split(':').map(Number);
    
    // --- STEP A: BACKUP SCORES USING SORTED TEAM KEYS ---
    const scoreBackup = {};
    matches.forEach(m => {
        const key = [m.tA, m.tB].sort().join('-');
        scoreBackup[key] = { sA: m.sA, sB: m.sB, done: m.done };
    });

    // 1. Create the pool of all possible matchups
    let pool = [];
    for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
            pool.push({ tA: i, tB: j });
        }
    }
    
    // 2. Randomize initial order to avoid same patterns every tournament
    pool.sort((a, b) => 0.5 - Math.random()); 
    
    matches = [];
    let totalMin = startH * 60 + startM;
    pairs.forEach(p => p.played = 0);

    let roundCount = 1; 

    // 3. Keep looping until all matches in the pool are assigned
    while (pool.length > 0) {
        let busy = new Set();
        let usedCourts = 0;

        // Sort pool so teams that have played the FEWEST matches get picked first for this round
        pool.sort((a, b) => (pairs[a.tA].played + pairs[a.tB].played) - (pairs[b.tA].played + pairs[b.tB].played));

        // Create a copy of the pool to iterate over, as we will modify the original pool
        let currentPool = [...pool];

        for (let i = 0; i < currentPool.length; i++) {
            let m = currentPool[i];

            // Check: Are both teams free this round AND is there a court available?
            if (!busy.has(m.tA) && !busy.has(m.tB) && usedCourts < courtLimit) {
                // Find the index of this match in the original pool
                let poolIndex = pool.findIndex(p => p.tA === m.tA && p.tB === m.tB);
                
                if (poolIndex !== -1) {
                    let match = pool.splice(poolIndex, 1)[0];

                    match.time = `${Math.floor(totalMin/60).toString().padStart(2,'0')}:${(totalMin%60).toString().padStart(2,'0')}`;
                    
                    // --- FIX: Assign courts 1, 2, 3 sequentially based on usedCourts ---
                    match.court = usedCourts + 1;
                    
                    match.round = roundCount; 
                    
                    // --- STEP B: RESTORE BACKED UP SCORES ---
                    const key = [match.tA, match.tB].sort().join('-');
                    if (scoreBackup[key]) {
                        match.sA = scoreBackup[key].sA;
                        match.sB = scoreBackup[key].sB;
                        match.done = scoreBackup[key].done;
                    } else {
                        match.sA = ''; match.sB = ''; match.done = false;
                    }

                    // Move match from pool to the actual matches array
                    matches.push(match);

                    // Mark teams as busy so they don't play twice in the same round
                    busy.add(match.tA); 
                    busy.add(match.tB);

                    // Increment play count for sorting priority
                    pairs[match.tA].played++; 
                    pairs[match.tB].played++;

                    usedCourts++; 
                }
            }
        }

        // 4. Move time forward 20 mins for the next set of matches (next round)
        totalMin += 20; 
        roundCount++;

        // Safety check to prevent infinite loops
        if (roundCount > 500) break;
    }

    // --- NEW: POPULATE OVERVIEW TABLE ---
    const overviewBody = document.getElementById('overview-table-body');
    if (overviewBody) {
        overviewBody.innerHTML = ''; // Clear previous
        matches.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.round}</td>
                <td>Court ${m.court}</td>
                <td>${m.time}</td>
                <td style="font-weight: bold;">${pairs[m.tA].name} vs ${pairs[m.tB].name}</td>
            `;
            overviewBody.appendChild(row);
        });
    }

    saveData(); 
    // Switch to Overview page instead of live section
    showStep('step-schedule-overview');
    renderMatches();
    updateLiveTable();
}

function renderMatches() {
    document.getElementById('matches-container').innerHTML = matches.map((m, i) => {
        // --- CHANGE HERE: Split names and map them to span elements with a hyphen in between ---
        const formatNames = (nameString) => {
            const parts = nameString.split(' - ');
            if (parts.length < 2) return `<span>${nameString}</span>`;
            return `<span>${parts[0]}</span><span class="pair-separator">-</span><span>${parts[1]}</span>`;
        };

        const teamANameVertical = formatNames(pairs[m.tA].name);
        const teamBNameVertical = formatNames(pairs[m.tB].name);

        return `
        <div class="match-card">
            
            <div class="match-meta-left">
                <span class="round-text">R ${m.round}</span>
                <span class="time-text">${m.time}</span>
                <span class="court-text">C ${m.court}</span>
            </div>

            <div class="match-content">
                <div class="player-wrapper">
                    <div class="player-name-left">${teamANameVertical}</div>
                    
                    <div class="score-container" style="position:relative;">
                        <input type="number" id="m-${i}-a" value="${m.sA || ''}" class="score-input ${m.done ? 'valid' : ''}" oninput="upd(${i}, 'a')" placeholder="0">
                        <span class="score-separator">-</span>
                        <input type="number" id="m-${i}-b" value="${m.sB || ''}" class="score-input ${m.done ? 'valid' : ''}" oninput="upd(${i}, 'b')" placeholder="0">
                        <div id="hint-${i}" class="error-hint"></div>
                    </div>

                    <div class="player-name-right">${teamBNameVertical}</div>
                </div>
            </div>

        </div>
    `}).join('');
}


function upd(i, side) {
    const inpA = document.getElementById(`m-${i}-a`);
    const inpB = document.getElementById(`m-${i}-b`);
    const hint = document.getElementById(`hint-${i}`);
    const valA = parseInt(inpA.value);
    const valB = parseInt(inpB.value);
    matches[i].sA = inpA.value;
    matches[i].sB = inpB.value;
    const hasScore = !isNaN(valA) && !isNaN(valB);
    let isValidMatch = false;
    let errorMsg = "";

    if (hasScore) {
        const high = Math.max(valA, valB);
        const low = Math.min(valA, valB);
        const diff = high - low;
        if (high < 21) errorMsg = "Winner must reach 21";
        else if (high === 21) {
            if (low <= 19) isValidMatch = true; 
            else errorMsg = "Must lead by 2 (e.g., 22-20)";
        } else if (high > 21 && high < 30) {
            if (diff === 2) isValidMatch = true; 
            else if (low <= 19) errorMsg = "Game finishes at 21"; 
            else errorMsg = "Deuce! Must lead by 2";
        } else if (high === 30) {
            isValidMatch = true;
        } else if (high > 30) errorMsg = "Maximum score is 30";
    }

    matches[i].done = isValidMatch;
    hint.innerText = isValidMatch ? "" : errorMsg;
    if (hasScore) {
        inpA.classList.toggle('valid', isValidMatch); inpA.classList.toggle('invalid', !isValidMatch);
        inpB.classList.toggle('valid', isValidMatch); inpB.classList.toggle('invalid', !isValidMatch);
    }
    
    const currentInput = document.getElementById(`m-${i}-${side}`);
    if (currentInput.value.length >= 2 || parseInt(currentInput.value) > 9) {
        if (side === 'a') { inpB.focus(); } 
        else if (matches[i+1]) { document.getElementById(`m-${i+1}-a`).focus(); }
    }
    let pct = Math.round((matches.filter(m => m.done).length / matches.length) * 100);
    document.getElementById('p-bar').style.width = pct + '%';
    document.getElementById('p-text').innerText = `Progress: ${pct}%`;
    updateLiveTable(); 
saveData();
}

function updateLiveTable() {
    let liveStats = pairs.map(p => ({ name: p.name, played: 0, wins: 0, lost: 0, points: 0, score: 0 }));
    matches.forEach(m => {
        if (!m.done) return;
        let a = parseInt(m.sA), b = parseInt(m.sB);
        liveStats[m.tA].played++; liveStats[m.tB].played++;
        liveStats[m.tA].score += a; liveStats[m.tB].score += b;
        if (a > b) { liveStats[m.tA].wins++; liveStats[m.tA].points += 2; liveStats[m.tB].lost++; }
        else { liveStats[m.tB].wins++; liveStats[m.tB].points += 2; liveStats[m.tA].lost++; }
    });
    liveStats.sort((a, b) => b.points - a.points || b.score - a.score);
    document.getElementById('live-body').innerHTML = liveStats.map(p => 
        `<tr><td>${p.name}</td><td>${p.played}</td><td>${p.wins}</td><td>${p.lost}</td><td>${p.points}</td><td>${p.score}</td></tr>`
    ).join('');
}

function calculateResults() {
    if (matches.some(m => !m.done && (m.sA || m.sB))) {
         if (!confirm("Some scores are invalid. Finish anyway?")) return;
    }
    pairs.forEach(p => { p.played=0; p.wins=0; p.lost=0; p.points=0; p.score=0; p.results={}; });
    matches.forEach(m => {
        if(m.sA === '' || m.sB === '') return;
        let a = parseInt(m.sA), b = parseInt(m.sB);
        pairs[m.tA].played++; pairs[m.tB].played++;
        pairs[m.tA].score += a; pairs[m.tB].score += b;
        pairs[m.tA].results[m.tB] = `${a}-${b}`; pairs[m.tB].results[m.tA] = `${b}-${a}`;
        if(a > b) { pairs[m.tA].wins++; pairs[m.tA].points+=2; pairs[m.tB].lost++; }
        else { pairs[m.tB].wins++; pairs[m.tB].points+=2; pairs[m.tA].lost++; }
    });
    let mx = `<tr><th>Teams</th>` + pairs.map(p => `<th>${p.name}</th>`).join('') + `</tr>`;
    pairs.forEach((r, i) => {
        mx += `<tr><td><strong>${r.name}</strong></td>`;
        pairs.forEach((_, j) => mx += (i===j) ? `<td class="self-cell">X</td>` : `<td>${r.results[j] || '—'}</td>`);
        mx += `</tr>`;
    });
    document.getElementById('matrix-table').innerHTML = mx;
    document.getElementById('recap-table').innerHTML = `<thead><tr><th>Time</th><th>Court</th><th>Match</th><th>Score</th></tr></thead>` + 
        matches.map(m => `<tr><td>${m.time}</td><td>${m.court}</td><td>${pairs[m.tA].name} vs ${pairs[m.tB].name}</td><td>${m.sA}-${m.sB}</td></tr>`).join('');
    showStep('results-section');
}

// 2. Updated showLeaderboard
function showLeaderboard() {
    // 1. Sort the players based on points, then score
    let sorted = [...pairs].sort((a,b) => b.points - a.points || b.score - a.score);
    const numPairs = pairs.length;
    
    // 2. Update Standings Table
    document.getElementById('table-body').innerHTML = sorted.map((p, i) => {
        let rowClass = (i < 2) ? 'highlight-finalist' : (i < 4 ? 'highlight-qualified' : '');
        return `
            <tr class="${rowClass}">
                <td>${i+1}</td>
                <td>${p.name}</td>
                <td>${p.played}</td>
                <td>${p.wins}</td>
                <td>${p.lost}</td>
                <td>${p.points}</td>
                <td>${p.score}</td>
            </tr>`;
    }).join('');

    // --- LOGIC: UPDATE PLAYOFF NAMES IF NO SCORES ENTERED ---
    if (numPairs >= 4) {
        if (!playoffScores.q1.done && !playoffScores.q1.sA && !playoffScores.q1.sB) {
            playoffScores.q1.teamA = sorted[0].name; 
            playoffScores.q1.teamB = sorted[1].name;
        }
        if (!playoffScores.elim.done && !playoffScores.elim.sA && !playoffScores.elim.sB) {
            playoffScores.elim.teamA = sorted[2].name; 
            playoffScores.elim.teamB = sorted[3].name;
        }
    }

    // 4. Render Playoff Cards
    const container = document.getElementById('playoff-matches-container');
    container.innerHTML = '';
    
    container.appendChild(createMatchInput('Qualifier 1 (1st vs 2nd)', 'q1', playoffScores.q1));
    container.appendChild(createMatchInput('Eliminator (3rd vs 4th)', 'elim', playoffScores.elim));
    container.appendChild(createMatchInput('Qualifier 2 (L-Q1 vs W-Elim)', 'q2', playoffScores.q2));
    container.appendChild(createMatchInput('Grand Final', 'final', playoffScores.final));

    // Show Champion if Final is done
    if (playoffScores.final.done) {
        const champName = parseInt(playoffScores.final.sA) > parseInt(playoffScores.final.sB) ? playoffScores.final.teamA : playoffScores.final.teamB;
        let champDiv = document.getElementById('champ-win');
        if (!champDiv) {
            champDiv = document.createElement('div');
            champDiv.id = 'champ-win';
            container.appendChild(champDiv);
        }
        champDiv.innerHTML = `<div style="text-align:center; font-size:1.5em; color:#16a34a; font-weight:bold; margin-top:20px;">🏆 CHAMPIONS: ${champName} 🏆</div>`;
    }
    
    saveData();
    showStep('leaderboard-section');
}

// Function to handle the Reset Playoff Bracket logic
function resetPlayoffs() {
    if (confirm("Reset playoff scores? This will clear all playoff results but keep your Group Stage data.")) {
        playoffScores = {
            q1: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
            elim: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
            q2: { sA: '', sB: '', done: false, teamA: '', teamB: '' },
            final: { sA: '', sB: '', done: false, teamA: '', teamB: '' }
        };
        saveData();
        showLeaderboard(); 
    }
}

// 3. Helper to create HTML for match inputs
function createMatchInput(title, id, match) {
    const div = document.createElement('div');
    div.className = 'playoff-match-card';
    // Added "position: relative" to help with alignment during capture
    div.style = "border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:10px; background:#fff; position: relative;";
    
    div.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">${title}</h4>
        <div style="display:flex; justify-content:center; align-items:center; gap:10px;">
            <span id="${id}-nameA" style="font-weight:bold; width: 140px; text-align: right;">${match.teamA || 'TBD'}</span>
            
            <div style="position: relative; width: 50px; height: 30px;">
                <input type="number" id="${id}-a" value="${match.sA}" oninput="updatePlayoffScore('${id}', 'a')" 
                       style="width:100%; text-align:center; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="0">
                <span class="export-only-score" style="display:none; position:absolute; top:5px; left:0; width:100%; text-align:center; font-weight:bold;">${match.sA}</span>
            </div>

            <span style="font-weight:bold;">-</span>

            <div style="position: relative; width: 50px; height: 30px;">
                <input type="number" id="${id}-b" value="${match.sB}" oninput="updatePlayoffScore('${id}', 'b')" 
                       style="width:100%; text-align:center; padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" placeholder="0">
                <span class="export-only-score" style="display:none; position:absolute; top:5px; left:0; width:100%; text-align:center; font-weight:bold;">${match.sB}</span>
            </div>

            <span id="${id}-nameB" style="font-weight:bold; width: 140px; text-align: left;">${match.teamB || 'TBD'}</span>
        </div>
        <div id="${id}-hint" style="color:#ef4444; font-size:0.8em; text-align:center; margin-top:5px; height: 1em;"></div>
    `;
    return div;
}

// 4. The updated logic for Focus and Names
function updatePlayoffScore(matchId, side) {
    const inpA = document.getElementById(`${matchId}-a`);
    const inpB = document.getElementById(`${matchId}-b`);
    const valA = parseInt(inpA.value);
    const valB = parseInt(inpB.value);
    
    playoffScores[matchId].sA = inpA.value;
    playoffScores[matchId].sB = inpB.value;

    // Validation
    let isValidMatch = false;
    let errorMsg = ""; // Added to track specific error messages

    if (!isNaN(valA) && !isNaN(valB)) {
        const high = Math.max(valA, valB);
        const low = Math.min(valA, valB);
        const diff = high - low;

        if (high < 21) {
            errorMsg = "Winner must reach 21";
        } else if (high === 21) {
            if (low <= 19) isValidMatch = true; 
            else errorMsg = "Must lead by 2 (e.g., 22-20)";
        } else if (high > 21 && high < 30) {
            if (diff === 2) isValidMatch = true; 
            else errorMsg = "Deuce! Must lead by 2";
        } else if (high === 30) {
            isValidMatch = true;
        } else if (high > 30) {
            errorMsg = "Maximum score is 30"; // Matches Group Stage logic
        }
    }

    playoffScores[matchId].done = isValidMatch;
    // Updated to show the specific errorMsg
    document.getElementById(`${matchId}-hint`).innerText = (inpA.value && inpB.value && !isValidMatch) ? errorMsg : "";

    // --- AUTO FOCUS LOGIC (Exact reuse of your working logic) ---
    const currentInput = document.getElementById(`${matchId}-${side}`);
    if (currentInput.value.length >= 2 || parseInt(currentInput.value) > 9) {
        if (side === 'a') { 
            inpB.focus(); 
        } else {
            const sequence = ['q1', 'elim', 'q2', 'final'];
            const nextIdx = sequence.indexOf(matchId) + 1;
            if (sequence[nextIdx]) {
                const nextInp = document.getElementById(`${sequence[nextIdx]}-a`);
                if (nextInp) nextInp.focus();
            }
        }
    }

    // --- WINNER PROGRESSION ---
    if (isValidMatch) {
        const winner = valA > valB ? playoffScores[matchId].teamA : playoffScores[matchId].teamB;
        const loser = valA > valB ? playoffScores[matchId].teamB : playoffScores[matchId].teamA;

        if (matchId === 'q1') {
            playoffScores.final.teamA = winner;
            playoffScores.q2.teamA = loser;
        } else if (matchId === 'elim') {
            playoffScores.q2.teamB = winner;
        } else if (matchId === 'q2') {
            playoffScores.final.teamB = winner;
        }

        // Update Names on Screen Instantly
        ['q1', 'elim', 'q2', 'final'].forEach(mId => {
            document.getElementById(`${mId}-nameA`).innerText = playoffScores[mId].teamA || 'TBD';
            document.getElementById(`${mId}-nameB`).innerText = playoffScores[mId].teamB || 'TBD';
        });

        // Show Champion if Final is done
        if (matchId === 'final' || playoffScores.final.done) {
            const champName = parseInt(playoffScores.final.sA) > parseInt(playoffScores.final.sB) ? playoffScores.final.teamA : playoffScores.final.teamB;
            let champDiv = document.getElementById('champ-win');
            if (!champDiv) {
                champDiv = document.createElement('div');
                champDiv.id = 'champ-win';
                document.getElementById('playoff-matches-container').appendChild(champDiv);
            }
            champDiv.innerHTML = `<div style="text-align:center; font-size:1.5em; color:#16a34a; font-weight:bold; margin-top:20px;">🏆 CHAMPIONS: ${champName} 🏆</div>`;
        }
    }
    // SAVE DATA AFTER EVERY KEYSTROKE
    saveData();
}