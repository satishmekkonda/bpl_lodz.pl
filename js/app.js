// js/app.js - Global State
let advPlayers = [];
let intPlayers = [];
let manualPlayers = [];
let pairs = [];
let matches = [];
let isManualMode = false;

// Initialize EmailJS 
(function(){ emailjs.init("YOUR_PUBLIC_KEY"); })();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('date-display').innerText = today;
    
// The "Startup" function - This runs only when the page is fully ready

window.onload = function() {
    // Set Date
    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        dateDisplay.innerText = today;
    }

    // Fill Time Dropdown (Your exact logic)
    const st = document.getElementById('start-time');
    if (st) {
        for(let h=10; h<=18; h++) {
            for(let m of ['00','30']) {
                st.options.add(new Option(`${h}:${m}`, `${h}:${m}`));
            }
        }
    }

    // Run your loadData function
    loadData();
};
	
//Not lose Entered Data on refresh
function saveData() {
    const data = { advPlayers, intPlayers, manualPlayers, pairs, matches, isManualMode };
    localStorage.setItem('bpl_2026_data', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('bpl_2026_data');
    const lastStep = localStorage.getItem('bpl_last_step');
    
    if (saved) {
        const data = JSON.parse(saved);
        advPlayers = data.advPlayers || [];
        intPlayers = data.intPlayers || [];
        manualPlayers = data.manualPlayers || [];
        pairs = data.pairs || [];
        matches = data.matches || [];
        isManualMode = data.isManualMode || false;
        
        if (window.renderLists) renderLists();
        if (window.renderManualList) renderManualList();
        
        if (matches.length > 0) {
            if (window.renderMatches) renderMatches();
            if (window.updateLiveTable) updateLiveTable();
        }

        if (lastStep && lastStep !== 'step-welcome') {
            showStep(lastStep);
            
            // 1. Logic for Review/Courts back button
            if (lastStep === 'step-review' || lastStep === 'step-courts') {
                const reviewBackBtn = document.getElementById('btn-review-back');
                if (isManualMode) {
                    reviewBackBtn.onclick = () => showStep('step-manual');
                    document.getElementById('btn-shuffle-strict').classList.add('hidden');
                    document.getElementById('btn-shuffle-random').classList.add('hidden');
                } else {
                    reviewBackBtn.onclick = () => showStep('step-int');
                    document.getElementById('btn-shuffle-strict').classList.remove('hidden');
                    document.getElementById('btn-shuffle-random').classList.remove('hidden');
                }
                if (window.renderReview) renderReview(); // Make sure the team list is drawn
            }

            // 2. Logic for Group Stage Stats (Matrix/Recap)
            if (lastStep === 'results-section') {
                if (window.calculateResults) calculateResults() 
            }

            // 3. Logic for Final Leaderboard
            if (lastStep === 'leaderboard-section') {
                if (window.calculateResults) calculateResults(); // Get the math ready
                if (window.showLeaderboard) showLeaderboard();  // Draw the standings
            }
        }
    }
}

function showStep(id) {
	const step = document.getElementById(id);
    if (!step) return;

    document.querySelectorAll('.container > div:not(.header-row)').forEach(d => d.classList.add('hidden')); 
    document.getElementById(id).classList.remove('hidden'); 
	
	// Always save the current step to memory
    localStorage.setItem('bpl_last_step', id);
}

// goBackFromCourts function
function goBackFromCourts() {
    showStep('step-review');
    // Re-apply the correct back-button logic for the Review screen
    if (isManualMode) {
        document.getElementById('btn-review-back').onclick = () => showStep('step-manual');
        document.getElementById('btn-shuffle-strict').classList.add('hidden');
        document.getElementById('btn-shuffle-random').classList.add('hidden');
    } else {
        document.getElementById('btn-review-back').onclick = () => showStep('step-int');
        document.getElementById('btn-shuffle-strict').classList.remove('hidden');
        document.getElementById('btn-shuffle-random').classList.remove('hidden');
    }
}

// Clears Saved Data
function clearTournament() {
    if (confirm("Are you sure? This will delete all current players, matches, and scores.")) {
        localStorage.removeItem('bpl_2026_data');
        location.reload();
    }
}

