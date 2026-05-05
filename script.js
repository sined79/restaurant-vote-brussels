// Initialize Map (Brussels centered)
const map = L.map('map').setView([50.8503, 4.3517], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Restaurant coordinates (approximate in Brussels for demo)
const restaurants = {
    damas: { name: "Les Jours de Damas", lat: 50.8465, lng: 4.3528, votes: 0 },
    solemio: { name: "O Sole Mio", lat: 50.8480, lng: 4.3550, votes: 0 },
    hanimeli: { name: "Hanimeli", lat: 50.8520, lng: 4.3600, votes: 0 },
    grandcanal: { name: "Grand Canal", lat: 50.8550, lng: 4.3480, votes: 0 }
};

// Add markers
const markers = {};
for (const [key, data] of Object.entries(restaurants)) {
    const marker = L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(`<b>${data.name}</b>`);
    markers[key] = marker;
}

// Voting Logic
const MAX_VOTES = 5;
let totalVotes = 0;

const voteButtons = document.querySelectorAll('.vote-btn');
const totalVotesSpan = document.getElementById('total-votes');
const progressBar = document.getElementById('progress-bar');
const winnerAnnouncement = document.getElementById('winner-announcement');
const winnerName = document.getElementById('winner-name');

voteButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (totalVotes >= MAX_VOTES) return;

        const key = button.getAttribute('data-restaurant');
        
        // Update data
        restaurants[key].votes++;
        totalVotes++;

        // Update UI
        document.getElementById(`count-${key}`).innerText = restaurants[key].votes;
        totalVotesSpan.innerText = totalVotes;
        
        // Update progress bar
        const progressPercentage = (totalVotes / MAX_VOTES) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // Animation/Highlight on marker
        markers[key].openPopup();

        // Check if finished
        if (totalVotes === MAX_VOTES) {
            endVoting();
        }
    });
});

function endVoting() {
    // Disable all buttons
    voteButtons.forEach(btn => btn.disabled = true);

    // Find winner
    let winner = null;
    let maxVotes = -1;
    let tie = false;

    for (const [key, data] of Object.entries(restaurants)) {
        if (data.votes > maxVotes) {
            maxVotes = data.votes;
            winner = data;
            tie = false;
        } else if (data.votes === maxVotes) {
            tie = true;
        }
    }

    // Show winner
    winnerAnnouncement.classList.remove('hidden');
    if (tie) {
        winnerName.innerText = "Égalité ! (Il faut un tirage au sort)";
    } else {
        winnerName.innerText = winner.name;
        // Center map on winner
        map.setView([winner.lat, winner.lng], 16);
        markers[Object.keys(restaurants).find(k => restaurants[k] === winner)].openPopup();
    }
}