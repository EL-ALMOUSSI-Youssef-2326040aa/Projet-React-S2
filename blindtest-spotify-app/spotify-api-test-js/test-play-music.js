const accessToken = 'BQDfyELyKJDQBJ2xBJ13nSJCcj4yUCHFN4GVvDmW8nvQQkxcVzBcCmZWNUj3KX5_stSD7V0rWvfGpL6-6K2HZWVR5FDtaeyRRmKUKwk7psNBzETvk8sqSDu-ddemOsIB9-VYqVj7y11anLJdw5xiW2O6FshqiAh9iikqkORazhnky7ZM4aBawM3-cCaXPR90VhFwOhyF46RB0g-1YRVqbRILLVtIEYhbezIWZf48qP_2a9_pOFvauCq_f8UScJhipnd3CWg4h7JX9NQvtBtRpXLHmIzI-nlgMuiw6q9SChQ9dW3HTAT06xK3OZzvI29g6Wnw6Cs';
let currentDeviceId = null;

window.onload = () => {
    initializePlayer();
};

document.getElementById('play-button').addEventListener('click', () => {
    if (currentDeviceId) {
        playSong(currentDeviceId, 'spotify:track:3ZhzMJnMGNkUT6qc9XpvkN');
    } else {
        initializePlayer();
    }
});

function initializePlayer() {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: cb => { cb(accessToken); },
            volume: 0.5
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            currentDeviceId = device_id;
            // Update play buttons with the device_id
            updatePlayButtons(device_id);
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.connect();
    };
}

function updatePlayButtons(device_id) {
    document.querySelectorAll('.play-track').forEach(button => {
        button.dataset.deviceId = device_id;
    });
}

const playSong = (device_id, trackUri) => {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (response.ok) {
            console.log('Device ID:', device_id);
            console.log('Playing song:', trackUri);
        } else {
            console.error('Error playing song', response);
            response.text().then(text => console.error('Error details:', text));
        }
    });
};

// Fetch and display saved tracks
const fetchSavedTracks = async (token) => {
    const response = await fetch('https://api.spotify.com/v1/me/tracks', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    console.log('Saved Tracks:', data);

    if (data.items && Array.isArray(data.items)) {
        displayTracks(data.items);
    } else {
        console.error('Unexpected API response format:', data);
    }
};

const displayTracks = (tracks) => {
    const trackList = document.getElementById('album-list');
    trackList.innerHTML = '';

    tracks.forEach(item => {
        const track = item.track;
        const trackItem = document.createElement('div');
        trackItem.classList.add('track-item');

        // Get album image or use placeholder
        const imageUrl = track.album.images && track.album.images.length > 0
            ? track.album.images[0].url
            : 'https://via.placeholder.com/300';

        // Format duration from milliseconds to mm:ss
        const minutes = Math.floor(track.duration_ms / 60000);
        const seconds = ((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0');
        const duration = `${minutes}:${seconds}`;

        const artistNames = track.artists.map(artist => artist.name).join(', ');

        trackItem.innerHTML = `
            <div class="track-image">
                <img src="${imageUrl}" alt="${track.name}" width="150" height="150">
            </div>
            <div class="track-info">
                <h3>${track.name}</h3>
                <p><strong>Artist:</strong> ${artistNames}</p>
                <p><strong>Album:</strong> ${track.album.name}</p>
                <p><strong>Release Date:</strong> ${track.album.release_date || 'Unknown'}</p>
                <p><strong>Duration:</strong> ${duration}</p>
                <p><strong>Popularity:</strong> ${track.popularity || 'N/A'}/100</p>
                <p><strong>Track Number:</strong> ${track.track_number}</p>
                <p><strong>Explicit:</strong> ${track.explicit ? 'Yes' : 'No'}</p>
                <button class="play-track" data-uri="${track.uri}" ${currentDeviceId ? `data-device-id="${currentDeviceId}"` : ''}>Play</button>
            </div>
        `;

        trackList.appendChild(trackItem);
    });

    // Add event listeners to play buttons
    document.querySelectorAll('.play-track').forEach(button => {
        button.addEventListener('click', (event) => {
            const trackUri = event.target.getAttribute('data-uri');
            const deviceId = event.target.getAttribute('data-device-id') || currentDeviceId;

            if (deviceId) {
                playSong(deviceId, trackUri);
            } else {
                console.error('No device ID available. Try clicking the main play button first.');
                alert('No device ID available. Try clicking the main play button first.');
            }
        });
    });
};

// Initialize
fetchSavedTracks(accessToken);