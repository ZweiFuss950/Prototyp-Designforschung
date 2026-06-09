/*****************************************************
 *  GLOBALE KONSTANTEN & ZUSTÄNDE
 *****************************************************/

/* --- Concerns (Sticky-Notes) --- */
const defaultConcerns = [
    "Kaffeequalität im Büro verbessern",
    "Mehr Remote-Tage ermöglichen",
    "Wellness-Kurse anbieten",
    "Bessere Meeting-Raumausstattung",
    "Regelmäßigere Team-Events",
    "Verbesserung der Fahrstuhl-Reinigung",
    "Gehalt anpassen nach Inflation",
    "Verbesserung der Klimatisierung"
];

let concerns = JSON.parse(localStorage.getItem('concerns')) || [...defaultConcerns];
let currentConcernIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;
let concernVotes = JSON.parse(localStorage.getItem('concernVotes')) || {};

/* --- Top Voices (Abstimmung) --- */
const defaultTopVoices = [
    { id: 1, title: "Frau Afflerbach will Demokratietag organisieren", votes: 24 },
    { id: 2, title: "Kaffeequalität im Pausenraum verbessern", votes: 18 },
    { id: 3, title: "Mehr flexible Arbeitszeiten ermöglichen", votes: 16 },
    { id: 4, title: "Wellness-Programm für Mitarbeiter starten", votes: 14 },
    { id: 5, title: "Bessere Klimatisierung in den Büros", votes: 11 },
    { id: 6, title: "Monthly Team Building Events", votes: 9 },
    { id: 7, title: "Verbesserung der Fahrstuhl-Reinigung", votes: 7 }
];

let topVoices = JSON.parse(localStorage.getItem('topVoices')) || defaultTopVoices;
let userTopVotes = JSON.parse(localStorage.getItem('userTopVotes')) || {};

/* --- Stimmungs‑Smileys --- */
const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {
    satisfaction: null,
    energy: null,
    workload: null
};


/*****************************************************
 *  FUNKTIONEN
 *****************************************************/

/* ---------- Concerns (Wischbare Notizen) ---------- */
function renderSticky() {
    const container = document.getElementById('stickyNoteContainer');
    container.innerHTML = '';

    if (currentConcernIndex < concerns.length) {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.textContent = concerns[currentConcernIndex];
        note.id = 'currentSticky';

        note.addEventListener('mousedown', startDrag);
        note.addEventListener('touchstart', startDrag);

        container.appendChild(note);
    } else {
        const note = document.createElement('div');
        note.className = 'sticky-note finished';
        note.innerHTML = '✨ Alle Anliegen angesehen!<br><br>Komm morgen wieder.<br><span style="font-size: 24px; margin-top: 12px;">😊</span>';
        note.style.cursor = 'default';
        container.appendChild(note);
    }

    document.getElementById('currentIndex').textContent = currentConcernIndex + 1;
    document.getElementById('totalCount').textContent = concerns.length;
}

function startDrag(e) {
    if (currentConcernIndex >= concerns.length) return;

    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    currentX = startX;
    const note = document.getElementById('currentSticky');
    if (note) note.classList.add('dragging');
}

function moveDrag(e) {
    if (!isDragging) return;
    currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const note = document.getElementById('currentSticky');
    if (note) {
        const diff = currentX - startX;
        note.style.transform = `translateX(${diff}px) rotate(${diff * 0.15}deg) scale(${1 - Math.abs(diff) * 0.0005})`;
    }
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const note = document.getElementById('currentSticky');
    const diff = currentX - startX;

    if (note) {
        if (Math.abs(diff) > 100) {
            if (diff > 0) {
                note.classList.add('swiped-right');
                recordVote(currentConcernIndex, 'relevant');
            } else {
                note.classList.add('swiped-left');
                recordVote(currentConcernIndex, 'not-relevant');
            }

            setTimeout(() => {
                currentConcernIndex++;
                renderSticky();
            }, 400);
        } else {
            note.style.transform = 'translateX(0) rotate(0deg) scale(1)';
            note.classList.remove('dragging');
        }
    }
}

function recordVote(index, value) {
    if (!concernVotes[index]) {
        concernVotes[index] = { concern: concerns[index], vote: value };
        localStorage.setItem('concernVotes', JSON.stringify(concernVotes));
    }
}

/* ---------- Modales Fenster für neue Anliegen ---------- */
function openAddConcernModal() {
    document.getElementById('addConcernModal').classList.add('active');
    document.getElementById('concernText').focus();
}

function closeAddConcernModal() {
    document.getElementById('addConcernModal').classList.remove('active');
    document.getElementById('concernText').value = '';
    document.getElementById('charCount').textContent = '0';
}

function submitConcern() {
    const text = document.getElementById('concernText').value.trim();
    if (text.length < 5) {
        alert('⚠️ Bitte mindestens 5 Zeichen eingeben!');
        return;
    }

    concerns.unshift(text);
    localStorage.setItem('concerns', JSON.stringify(concerns));

    currentConcernIndex = 0;
    renderSticky();
    closeAddConcernModal();
}

/* ---------- Top Voices (Up‑/Downvotes) ---------- */
function renderTopVoices() {
    const container = document.getElementById('topVoicesContainer');
    const sorted = [...topVoices].sort((a, b) => b.votes - a.votes);

    container.innerHTML = sorted.map(voice => {
        const upVoted = userTopVotes[voice.id]?.upVoted || false;
        const downVoted = userTopVotes[voice.id]?.downVoted || false;

        return `
            <div class="voice-item">
                <div class="voice-title">${voice.title}</div>
                <div class="voice-votes">
                    <button class="vote-button ${upVoted ? 'up-voted' : ''}" onclick="upVote(${voice.id})">👍</button>
                    <span class="vote-count" id="vote-${voice.id}">${voice.votes}</span>
                    <button class="vote-button ${downVoted ? 'down-voted' : ''}" onclick="downVote(${voice.id})">👎</button>
                </div>
            </div>
        `;
    }).join('');
}

function upVote(id) {
    const voice = topVoices.find(v => v.id === id);
    if (!voice) return;

    if (!userTopVotes[id]) userTopVotes[id] = {};

    if (userTopVotes[id].upVoted) {
        voice.votes--;
        userTopVotes[id].upVoted = false;
    } else {
        if (userTopVotes[id].downVoted) {
            voice.votes++;
            userTopVotes[id].downVoted = false;
        }
        voice.votes++;
        userTopVotes[id].upVoted = true;
    }

    localStorage.setItem('topVoices', JSON.stringify(topVoices));
    localStorage.setItem('userTopVotes', JSON.stringify(userTopVotes));
    renderTopVoices();
}

function downVote(id) {
    const voice = topVoices.find(v => v.id === id);
    if (!voice) return;

    if (!userTopVotes[id]) userTopVotes[id] = {};

    if (userTopVotes[id].downVoted) {
        voice.votes++;
        userTopVotes[id].downVoted = false;
    } else {
        if (userTopVotes[id].upVoted) {
            voice.votes--;
            userTopVotes[id].upVoted = false;
        }
        voice.votes = Math.max(0, voice.votes - 1);
        userTopVotes[id].downVoted = true;
    }

    localStorage.setItem('topVoices', JSON.stringify(topVoices));
    localStorage.setItem('userTopVotes', JSON.stringify(userTopVotes));
    renderTopVoices();
}

/* ---------- Ansicht wechseln (Tab‑Navigation) ---------- */
function switchView(view, event) {
    document.querySelectorAll('.view-button').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');

    document.getElementById('currentView').style.display = (view === 'current') ? 'grid' : 'none';
    document.getElementById('statsSection').style.display = (view === 'stats') ? 'block' : 'none';
    document.getElementById('badgesSection').style.display = (view === 'week') ? 'block' : 'none';
}

/* ---------- Stimmungs‑Smileys ---------- */
function restoreSelections() {
    for (const [key, value] of Object.entries(userVotes)) {
        if (value) {
            const smiley = document.querySelector(`[onclick*="'${key}'"][onclick*="'${value}'"]`);
            if (smiley) smiley.classList.add('selected');
        }
    }
}

function selectSmiley(category, value, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.smiley').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    userVotes[category] = value;

    element.style.transform = 'scale(1.25)';
    setTimeout(() => {
        if (element.classList.contains('selected')) {
            element.style.transform = 'scale(1.2)';
        }
    }, 100);
}

function submitVotes(e) {
    e.preventDefault();

    if (!userVotes.satisfaction || !userVotes.energy || !userVotes.workload) {
        alert('⚠️ Bitte alle 3 Kategorien bewerten!');
        return;
    }

    localStorage.setItem('userVotes', JSON.stringify(userVotes));

    const history = JSON.parse(localStorage.getItem('votingHistory')) || [];
    history.push({
        date: new Date().toLocaleDateString('de-DE'),
        votes: { ...userVotes }
    });
    localStorage.setItem('votingHistory', JSON.stringify(history));

    const feedback = document.getElementById('feedback');
    feedback.classList.add('active');
    setTimeout(() => feedback.classList.remove('active'), 4000);
}


/*****************************************************
 *  EVENT LISTENER
 *****************************************************/
document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchmove', moveDrag, { passive: true });
document.addEventListener('touchend', endDrag);

document.getElementById('concernText').addEventListener('input', function () {
    document.getElementById('charCount').textContent = this.value.length;
});

window.addEventListener('click', function (event) {
    const modal = document.getElementById('addConcernModal');
    if (event.target === modal) closeAddConcernModal();
});


/*****************************************************
 *  INITIALISIERUNG
 *****************************************************/
renderSticky();
renderTopVoices();
restoreSelections();
