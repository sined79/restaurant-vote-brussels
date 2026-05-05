const restaurants = [
    { id: 1, name: "Les Jours de Damas", lat: 50.8596814, lng: 4.341458 },
    { id: 2, name: "O Sole Mio", lat: 50.8590622, lng: 4.3546389 },
    { id: 3, name: "Hanimeli", lat: 50.860081, lng: 4.3697231 },
    { id: 4, name: "Grand Canal", lat: 50.8611643, lng: 4.3634908 },
    { id: 5, name: "Food Market, Gare Maritime", lat: 50.863145, lng: 4.3424341 },
    { id: 6, name: "Ikigai Sushi", lat: 50.8578162, lng: 4.3540523 }
];

let votes = {}; // format: { "Denis": 1, "Alice": 2 }
let bucketId = window.location.hash.substring(1);
let map;

async function initDB() {
    if (!bucketId) {
        try {
            // Create a new bucket on kvdb.io for real-time sync
            const res = await fetch("https://kvdb.io/", { method: "POST" });
            bucketId = await res.text();
            window.location.hash = bucketId;
        } catch (e) {
            console.error("Erreur initialisation DB:", e);
            bucketId = "default-vote-brussels"; 
        }
    }
    
    // Display share link with the bucket ID in hash
    document.getElementById('share-link-container').style.display = 'block';
    const shareLink = document.getElementById('share-link');
    shareLink.href = window.location.href;
    shareLink.textContent = window.location.href;

    fetchVotes();
    // Poll for real-time updates across devices
    setInterval(fetchVotes, 2000);
}

async function fetchVotes() {
    try {
        const res = await fetch(`https://kvdb.io/${bucketId}/votes`);
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
                votes = data;
                renderRestaurants();
            }
        }
    } catch (e) {
        // Silently handle fetch errors during polling
    }
}

async function saveVotes() {
    try {
        await fetch(`https://kvdb.io/${bucketId}/votes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(votes)
        });
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des votes:", e);
    }
}

function handleVote(restId) {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    if (!username) {
        alert("Veuillez saisir votre prénom avant de voter.");
        usernameInput.focus();
        return;
    }

    const currentVoters = Object.keys(votes).length;
    // Check if user is new and max capacity is reached
    if (!votes[username] && currentVoters >= 5) {
        alert("Le nombre maximum de participants (5) a été atteint.");
        return;
    }

    votes[username] = restId;
    renderRestaurants();
    saveVotes();
}

function initMap() {
    // Initialize map centered around the restaurants
    map = L.map('map', { zoomControl: false }).setView([50.8605, 4.3550], 15);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Premium map style (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add markers
    restaurants.forEach(r => {
        const marker = L.marker([r.lat, r.lng]).addTo(map);
        marker.bindPopup(`<b>${r.name}</b>`);
    });
}

function renderRestaurants() {
    const list = document.getElementById('restaurants-list');
    list.innerHTML = '';

    restaurants.forEach(r => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        
        // Find voters for this specific restaurant
        const votersForRest = Object.keys(votes).filter(user => votes[user] === r.id);
        
        card.innerHTML = `
            <div class="rest-name">${r.name}</div>
            <button class="vote-btn" onclick="handleVote(${r.id})">Voter pour ce restaurant</button>
            <div class="voters-list">
                ${votersForRest.map(v => `<span class="voter-badge">${v}</span>`).join('')}
            </div>
        `;
        list.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    renderRestaurants();
    initDB();
});