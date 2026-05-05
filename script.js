// Initialize Map
const map = L.map('map').setView([50.8606, 4.3563], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Exact Coordinates
const restaurants = {
    damas: { name: "Les Jours de Damas", lat: 50.8596814, lng: 4.341458 },
    solemio: { name: "O Sole Mio", lat: 50.8590622, lng: 4.3546389 },
    hanimeli: { name: "Hanimeli", lat: 50.860081, lng: 4.3697231 },
    grandcanal: { name: "Grand Canal", lat: 50.8611643, lng: 4.3634908 },
    foodmarket: { name: "Food Market, Gare Maritime", lat: 50.863145, lng: 4.3424341 }
};

// Add markers
const markers = {};
for (const [key, data] of Object.entries(restaurants)) {
    const marker = L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(`<b>${data.name}</b>`);
    markers[key] = marker;
}

// Global State via KVDB
const BUCKET_ID = 'UzhA9xsFANbXTpnmj6EHUP';
const API_URL = `https://kvdb.io/${BUCKET_ID}/votes`;
const MAX_VOTES = 5;

const voteButtons = document.querySelectorAll('.vote-btn');
const totalVotesSpan = document.getElementById('total-votes');
const progressBar = document.getElementById('progress-bar');
const winnerAnnouncement = document.getElementById('winner-announcement');
const winnerName = document.getElementById('winner-name');
const voterNameInput = document.getElementById('voter-name');

let currentVoters = {}; // { "Denis": "damas" }

async function fetchVotes() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object') {
                currentVoters = data;
                updateUI();
            }
        }
    } catch (e) {
        console.error("Error fetching votes:", e);
    }
}

async function saveVote(name, restaurantKey) {
    // Optimistic update
    currentVoters[name] = restaurantKey;
    updateUI();

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentVoters)
        });
        // Fetch back to ensure sync
        fetchVotes();
    } catch (e) {
        console.error("Error saving vote:", e);
    }
}

function updateUI() {
    // Reset counts and lists
    const counts = { damas: 0, solemio: 0, hanimeli: 0, grandcanal: 0, foodmarket: 0 };
    const lists = { damas: [], solemio: [], hanimeli: [], grandcanal: [], foodmarket: [] };
    let totalVotes = 0;

    for (const [name, restKey] of Object.entries(currentVoters)) {
        if (counts[restKey] !== undefined) {
            counts[restKey]++;
            lists[restKey].push(name);
            totalVotes++;
        }
    }

    // Update DOM
    for (const key of Object.keys(restaurants)) {
        document.getElementById(`count-${key}`).innerText = counts[key];
        document.getElementById(`voters-${key}`).innerText = lists[key].join(', ');
    }

    totalVotesSpan.innerText = totalVotes;
    const progressPercentage = Math.min((totalVotes / MAX_VOTES) * 100, 100);
    progressBar.style.width = `${progressPercentage}%`;

    if (totalVotes >= MAX_VOTES) {
        endVoting(counts);
    } else {
        // Ensure buttons are enabled if we are below max votes
        voteButtons.forEach(btn => btn.disabled = false);
        winnerAnnouncement.classList.add('hidden');
    }
}

function endVoting(counts) {
    voteButtons.forEach(btn => btn.disabled = true);

    let winnerKey = null;
    let maxVotes = -1;
    let tie = false;

    for (const [key, votes] of Object.entries(counts)) {
        if (votes > maxVotes) {
            maxVotes = votes;
            winnerKey = key;
            tie = false;
        } else if (votes === maxVotes) {
            tie = true;
        }
    }

    winnerAnnouncement.classList.remove('hidden');
    if (tie) {
        winnerName.innerText = "Égalité ! (Il faut un tirage au sort)";
    } else if (winnerKey) {
        const winner = restaurants[winnerKey];
        winnerName.innerText = winner.name;
        map.setView([winner.lat, winner.lng], 16);
        markers[winnerKey].openPopup();
    }
}

// Event Listeners
voteButtons.forEach(button => {
    button.addEventListener('click', () => {
        const name = voterNameInput.value.trim();
        if (!name) {
            alert('Veuillez entrer votre prénom pour voter.');
            voterNameInput.focus();
            return;
        }

        const totalVotes = Object.keys(currentVoters).length;
        if (totalVotes >= MAX_VOTES && !currentVoters[name]) {
            alert('Le nombre maximum de votes (5) a été atteint.');
            return;
        }

        const key = button.getAttribute('data-restaurant');
        markers[key].openPopup();
        saveVote(name, key);
    });
});

// Initial fetch and start polling
fetchVotes();
setInterval(fetchVotes, 3000);
