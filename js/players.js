// MANUAL LOGIC
    function addManualPlayer() {
        const inp = document.getElementById('name-manual');
        const name = inp.value.trim();
        if (!name) return;
        if (manualPlayers.includes(name)) return alert("Duplicate name!");
        manualPlayers.push(name);
		saveData();
        inp.value = '';
        renderManualList();
    }

    function undoManual() { manualPlayers.pop(); renderManualList(); }

    function renderManualList() {
        const list = document.getElementById('list-manual');
        let html = '';
        for(let i=0; i<manualPlayers.length; i+=2) {
            html += `<div style="margin-bottom:5px;">
                <span class="player-tag">${manualPlayers[i]}</span> 
                ${manualPlayers[i+1] ? `<span style="font-weight:bold;">-</span> <span class="player-tag">${manualPlayers[i+1]}</span>` : ''}
            </div>`;
        }
        list.innerHTML = html;
        
        const err = document.getElementById('manual-error');
        const btnNext = document.getElementById('btn-manual-next');
        
        if (manualPlayers.length > 0 && manualPlayers.length % 2 !== 0) {
            err.innerText = "Please add one more player to complete the pair.";
            btnNext.classList.add('hidden');
        } else {
            err.innerText = "";
            btnNext.classList.toggle('hidden', manualPlayers.length < 2);
        }
    }

    function proceedManual() {
        isManualMode = true;
        pairs = [];
        for (let i = 0; i < manualPlayers.length; i += 2) {
            pairs.push({ 
                name: `${manualPlayers[i]} - ${manualPlayers[i+1]}`, 
                played: 0, wins: 0, lost: 0, points: 0, score: 0, results: {} 
            });
        }
        renderReview();
		saveData();
        showStep('step-review');
        // Hide shuffle buttons for manual mode
        document.getElementById('btn-shuffle-strict').classList.add('hidden');
        document.getElementById('btn-shuffle-random').classList.add('hidden');
        document.getElementById('btn-review-back').onclick = () => showStep('step-manual');
		
		saveData(); // <--- ADD THIS HERE to save the 'isManualMode = true' flag
    }

    // ORIGINAL PLAYER LOGIC
    function addPlayer(lvl) {
        const isCap = lvl === 'Captains';
        const inp = document.getElementById(isCap ? 'name-adv' : 'name-int');
        const name = inp.value.trim();
        if (!name) return;
        if (!isCap && intPlayers.length >= advPlayers.length) {
            alert("Limit reached! You cannot add more Vice-Captains than Captains.");
            return;
        }
        if (advPlayers.includes(name) || intPlayers.includes(name)) return alert("Duplicate name detected!");
        isCap ? advPlayers.push(name) : intPlayers.push(name);
		saveData();
        inp.value = ''; 
        renderLists();
    }

    function undo(lvl) { lvl === 'Captains' ? advPlayers.pop() : intPlayers.pop(); renderLists(); }

    function renderLists() {
        document.getElementById('list-adv').innerHTML = advPlayers.map(p => `<span class="player-tag">${p}</span>`).join('');
        document.getElementById('list-int').innerHTML = intPlayers.map(p => `<span class="player-tag">${p}</span>`).join('');
        document.getElementById('btn-to-int').classList.toggle('hidden', advPlayers.length < 2);
        const diff = advPlayers.length - intPlayers.length;
        const intInp = document.getElementById('name-int');
        const intBtn = document.getElementById('add-int-btn');
        if (diff > 0) {
            document.getElementById('int-requirement').innerText = `Require ${diff} more Vice-Captains`;
            intInp.disabled = false;
            intBtn.style.display = 'inline-block';
            document.getElementById('gen-btn').classList.add('hidden');
        } else {
            document.getElementById('int-requirement').innerText = advPlayers.length > 0 ? "Registration Complete" : "";
            intInp.disabled = true;
            intBtn.style.display = 'none';
            document.getElementById('gen-btn').classList.toggle('hidden', advPlayers.length === 0);
        }
    }
	
	// UPDATED PREVIEW TEAMS LOGIC WITH MIXING MODES
    function previewTeams(mode) {
        isManualMode = false;
        pairs = [];
        if (mode === 'strict') {
		// Logic: Group Vice-Captains to Captains
            let sInt = [...intPlayers].sort(() => Math.random() - 0.5);
            pairs = advPlayers.map((a, i) => ({ 
                name: `${a} - ${sInt[i]}`, 
                played: 0, wins: 0, lost: 0, points: 0, score: 0, results: {} 
            }));
        } else {
            let allPlayers = [...advPlayers, ...intPlayers].sort(() => Math.random() - 0.5);
            for (let i = 0; i < allPlayers.length; i += 2) {
                if(allPlayers[i+1]) {
                    pairs.push({ 
                        name: `${allPlayers[i]} - ${allPlayers[i+1]}`, 
                        played: 0, wins: 0, lost: 0, points: 0, score: 0, results: {} 
                    });
                }
            }
        }
        renderReview();
        document.getElementById('btn-shuffle-strict').classList.remove('hidden');
        document.getElementById('btn-shuffle-random').classList.remove('hidden');
        document.getElementById('btn-review-back').onclick = () => showStep('step-int');
        showStep('step-review');
		saveData();
    }

    function renderReview() {
        document.getElementById('review-list').innerHTML = pairs.map((p, i) => `
            <div class="review-card"><strong>Team ${i+1}:</strong> ${p.name}</div>
        `).join('');
    }