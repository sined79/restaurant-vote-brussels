const BUCKET_ID = 'Rz2FQXkurwbbUtAD2HRsJF';
const KVDB_URL = `https://kvdb.io/${BUCKET_ID}/votes`;

const restaurants = [
    { id: 1, name: "Les Jours de Damas", lat: 50.8596814, lng: 4.341458 },
    { id: 2, name: "O Sole Mio", lat: 50.8590622, lng: 4.3546389 },
    { id: 3, name: "Hanimeli", lat: 50.860081, lng: 4.3697231 },
    { id: 4, name: "Grand Canal", lat: 50.8611643, lng: 4.3634908 },
    { id: 5, name: "Food Market, Gare Maritime", lat: 50.863145, lng: 4.3424341 },
    { id: 6, name: "Ikigai Sushi", lat: 50.8578162, lng: 4.3540523 }
];

let globalVotes = {}; // Format: { "Prénom": restaurantId }

// Initialize Leaflet Map
const initMap = () => {
    // Center map around Brussels
    const map = L.map('map').setView([50.860, 4.355], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add markers
    restaurants.forEach(rest => {
        const marker = L.marker([rest.lat, rest.lng]).addTo(map);
        marker.bindPopup(`<b>${rest.name}</b>`);
    });
};

// Generate Restaurant Cards
const renderRestaurants = () => {
    const grid = document.getElementById('restaurants-grid');
    grid.innerHTML = '';

    restaurants.forEach(rest => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';

        // Count votes for this restaurant
        const voters = Object.keys(globalVotes).filter(name => globalVotes[name] === rest.id);

        card.innerHTML = `
            <h3 class="restaurant-name">${rest.name}</h3>
            <button class="vote-btn" onclick="handleVote(${rest.id})">Voter pour ce lieu</button>
            <div class="voters-list">
                <div class="voters-title">Votants (${voters.length})</div>
                <div class="voters-container">
                    ${voters.map(v => `<span class="voter-badge">${v}</span>`).join('')}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

// Handle Voting
const handleVote = async (restaurantId) => {
    const nameInput = document.getElementById('voter-name').value.trim();
    const statusMsg = document.getElementById('status-message');

    if (!nameInput) {
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = "Veuillez entrer votre prénom avant de voter.";
        setTimeout(() => statusMsg.textContent = '', 3000);
        return;
    }

    // Check max voters (5) if it's a new voter
    const currentVotersCount = Object.keys(globalVotes).length;
    if (!globalVotes[nameInput] && currentVotersCount >= 5) {
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = "Le nombre maximum de 5 votants a été atteint.";
        setTimeout(() => statusMsg.textContent = '', 3000);
        return;
    }

    statusMsg.style.color = '#2563eb';
    statusMsg.textContent = "Enregistrement de votre vote...";

    // Update local state first for immediate feedback
    globalVotes[nameInput] = restaurantId;
    renderRestaurants();

    try {
        await fetch(KVDB_URL, {
            method: 'POST',
            body: JSON.stringify(globalVotes)
        });
        statusMsg.textContent = "Vote enregistré avec succès !";
        setTimeout(() => statusMsg.textContent = '', 3000);
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = "Erreur de connexion. Réessayez.";
    }
};

// Fetch initial data & start polling
const fetchVotes = async () => {
    try {
        const response = await fetch(KVDB_URL);
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object') {
                globalVotes = data;
                renderRestaurants();
            }
        }
    } catch (error) {
        console.error("Erreur de récupération des votes:", error);
    }
};

// Main Initialization
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderRestaurants();
    fetchVotes();
    
    // Poll for updates every 3 seconds for real-time sync
    setInterval(fetchVotes, 3000);
});