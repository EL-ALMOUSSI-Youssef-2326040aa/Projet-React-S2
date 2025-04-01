const clientId = 'e1f9997347e04885ac2685bb48c16747';
const redirectUri = 'http://localhost:63342/spotify-api-test-js/index.html';
const stateKey = 'spotify_auth_state';

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

document.getElementById('spotify-login').addEventListener('click', () => {
    const state = generateRandomString(16);
    localStorage.setItem(stateKey, state);
    const scope = 'user-read-private user-read-email user-library-read playlist-read-private playlist-modify-public playlist-modify-private';

    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    url += '&state=' + encodeURIComponent(state);
    window.location.href = url;
    console.log(url);
});

window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');
    const storedState = localStorage.getItem(stateKey);

    if (accessToken && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    } else {
        localStorage.removeItem(stateKey);
        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            console.log('Access Token:', accessToken); // Log the access token
            fetchSavedAlbums(accessToken);
        }
    }
});

const fetchSavedAlbums = async (token) => {
    const response = await fetch('https://api.spotify.com/v1/me/albums', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    const data = await response.json();
    displayAlbums(data.items);
};

const displayAlbums = (albums) => {
    const albumList = document.getElementById('album-list');
    albumList.innerHTML = '';
    albums.forEach(item => {
        const albumItem = document.createElement('div');
        albumItem.textContent = item.album.name;
        albumList.appendChild(albumItem);
    });
};