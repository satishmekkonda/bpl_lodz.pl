function generateSchedule() {
      const courtLimit = parseInt(document.getElementById('court-count').value);
      let [startH, startM] = document.getElementById('start-time').value.split(':').map(Number);
      
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

          for (let i = 0; i < pool.length; i++) {
              let m = pool[i];

              // Check: Are both teams free this round AND is there a court available?
              if (!busy.has(m.tA) && !busy.has(m.tB) && usedCourts < courtLimit) {
                  m.time = `${Math.floor(totalMin/60).toString().padStart(2,'0')}:${(totalMin%60).toString().padStart(2,'0')}`;
                  m.court = usedCourts + 1;
                  m.round = roundCount; 
                  m.sA = ''; m.sB = ''; m.done = false;

                  // Move match from pool to the actual matches array
                  matches.push(pool.splice(i, 1)[0]);

                  // Mark teams as busy so they don't play twice in the same round
                  busy.add(m.tA); 
                  busy.add(m.tB);

                  // Increment play count for sorting priority
                  pairs[m.tA].played++; 
                  pairs[m.tB].played++;

                  usedCourts++; 
                  i--; // Adjust index because we removed an item from pool
              }
          }

          // 4. Move time forward 20 mins for the next set of matches (next round)
          totalMin += 20; 
          roundCount++;

          // Safety check to prevent infinite loops
          if (roundCount > 500) break;
      }

      saveData(); 
      showStep('tournament-section');
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

function showLeaderboard() {
    // 1. Sort the players based on points, then score
    let sorted = [...pairs].sort((a,b) => b.points - a.points || b.score - a.score);
    const numPairs = pairs.length;
    
    // 2. Update the main leaderboard table HTML with conditional row highlighting
    document.getElementById('table-body').innerHTML = sorted.map((p, i) => {
        let rowClass = '';
        
        // --- NEW: Highlight logic based on number of players ---
        if (numPairs >= 6) {
            // Semifinals: Top 4 highlighted
            if (i < 4) rowClass = 'highlight-qualified';
        } 
        else if (numPairs === 5) {
            // Qualifier: 1st is special, 2nd & 3rd highlighted
            if (i === 0) rowClass = 'highlight-finalist';
            else if (i < 3) rowClass = 'highlight-qualified';
        } 
        else if (numPairs < 5 && numPairs >= 3) {
            // Finals: Top 2 highlighted
            if (i < 2) rowClass = 'highlight-finalist';
        }
        // --------------------------------------------------------

        return `
            <tr class="${rowClass}">
                <td>${i+1}</td>
                <td>${p.name}</td>
                <td>${p.played}</td>
                <td>${p.wins}</td>
                <td>${p.lost}</td>
                <td>${p.points}</td>
                <td>${p.score}</td>
            </tr>
        `;
    }).join('');

    // 3. --- REVISED LOGIC FOR PLAYOFF TEXT (Kept as you provided) ---
    let playoffHtml = '';
    
    if (numPairs >= 6) {
        playoffHtml = `
            <h3>🏆 Semifinals</h3>
            <p><strong>SF1:</strong> ${sorted[0].name} vs ${sorted[3].name}</p>
            <p><strong>SF2:</strong> ${sorted[1].name} vs ${sorted[2].name}</p>
        `;
    } 
    else if (numPairs === 5) {
        playoffHtml = `
            <h3>🏆 Qualifiers</h3>
            <p><strong>OFF to Finals:</strong> ${sorted[0].name}</p>
            <p><strong>Qualifiers :</strong> ${sorted[1].name} vs ${sorted[2].name}</p>
        `;
    } 
    else if (numPairs < 5 && numPairs >= 3) {
        playoffHtml = `
            <h3>🏆 Grand Final</h3>
            <p><strong>Final:</strong> ${sorted[0].name} vs ${sorted[1].name}</p>
        `;
    }
    else {
        playoffHtml = '<p>Not enough teams to generate playoffs.</p>';
    }
    // -------------------------------------

    // 4. Update the playoff container and show the section
    document.getElementById('playoff-container').innerHTML = playoffHtml;
    showStep('leaderboard-section');
}