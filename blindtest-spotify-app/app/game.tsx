// app/game.tsx
import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Token Spotify (à remplacer par un token valide)
const SPOTIFY_TOKEN = "BQC8YPI2P3cB_fhYLQ2otNdGc3SGQ-AqtWqDgrgInbU3g1aZ01L7up6G-3pIMuM733aZDkhSzyhj1K5bbPZeW_QrNjisiohNKPVRTJ6iem2tsmQhc3WmNuTN1b4RicYtEU0rDphuWCRYtKIZR4guFvjfKMDqYCqVpy_QTSqDaV2LJ7k8Xe2fvxmiabex1xwbSAX1WSuIQb7mKhcjKfMghct98JglKgatdLUY-ZfuCMqL1DbRg-rCJe6iuOcjHR3NNW3lRrk2V10CeiEiUXSjWBdWcoHWMlYaW7PH_mtpyzQi3K_fUN0Y7Wva8hoRI_MSd_JVHUs";

export default function Game() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { playlistId, categoryName, imageUrl } = params;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'answered', 'finished'
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const playerRef = useRef(null);
    const questionsCount = 10;

    // Initialiser le lecteur Spotify
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new Spotify.Player({
                name: 'Spoti-Find Blindtest',
                getOAuthToken: cb => { cb(SPOTIFY_TOKEN); },
                volume: 0.5
            });

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
                playerRef.current = player;
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', state => {
                setIsPlaying(!state.paused);
            });

            player.connect();
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.disconnect();
            }
        };
    }, []);

    // Récupérer les pistes de la playlist sélectionnée
    useEffect(() => {
        const fetchPlaylistTracks = async () => {
            try {
                const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${SPOTIFY_TOKEN}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status}`);
                }

                const data = await response.json();

                // Filtrer les pistes valides (avec preview_url ou non nulles)
                const validTracks = data.items
                    .filter(item => item.track && item.track.name && item.track.artists.length > 0)
                    .map(item => item.track);

                // Sélectionner aléatoirement 10 pistes
                const shuffled = [...validTracks].sort(() => 0.5 - Math.random());
                const selectedTracks = shuffled.slice(0, questionsCount);

                setTracks(selectedTracks);

                // Préparer les options pour la première question
                if (selectedTracks.length > 0) {
                    prepareQuestion(selectedTracks, 0, validTracks);
                }
            } catch (err) {
                console.error('Erreur lors de la récupération des pistes:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (playlistId) {
            fetchPlaylistTracks();
        }
    }, [playlistId]);

    // Préparer les options pour une question
    const prepareQuestion = (allTracks, index, poolTracks) => {
        const correctTrack = allTracks[index];

        // Sélectionner 3 autres pistes aléatoires comme mauvaises réponses
        const otherTracks = poolTracks
            .filter(t => t.id !== correctTrack.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // Combiner et mélanger les options
        const allOptions = [
            {
                id: correctTrack.id,
                name: correctTrack.name,
                artists: correctTrack.artists.map(a => a.name).join(', '),
                isCorrect: true
            },
            ...otherTracks.map(t => ({
                id: t.id,
                name: t.name,
                artists: t.artists.map(a => a.name).join(', '),
                isCorrect: false
            }))
        ].sort(() => 0.5 - Math.random());

        setOptions(allOptions);
        setGameState('playing');
    };

    // Jouer la piste actuelle
    useEffect(() => {
        if (deviceId && tracks.length > 0 && currentTrackIndex < tracks.length) {
            const trackUri = tracks[currentTrackIndex].uri;
            playTrack(trackUri);
        }
    }, [deviceId, currentTrackIndex, tracks]);

    const playTrack = (trackUri) => {
        if (!deviceId) return;

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [trackUri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SPOTIFY_TOKEN}`
            }
        }).catch(err => {
            console.error('Erreur lors de la lecture:', err);
            setError('Impossible de lire la chanson. Veuillez vérifier votre token Spotify.');
        });
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);

        // Arrêter la musique
        if (deviceId) {
            fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${SPOTIFY_TOKEN}`
                }
            }).catch(console.error);
        }

        // Mettre à jour le score
        if (option.isCorrect) {
            setScore(prevScore => prevScore + 1);
        }

        setGameState('answered');
    };

    const goToNextQuestion = () => {
        const nextIndex = currentTrackIndex + 1;

        if (nextIndex < Math.min(tracks.length, questionsCount)) {
            setCurrentTrackIndex(nextIndex);
            prepareQuestion(tracks, nextIndex, tracks);
            setSelectedOption(null);
        } else {
            // Fin du jeu
            setGameState('finished');
        }
    };

    const restartGame = () => {
        router.replace('/Categories');
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#1DB954" />
                <Text style={styles.loadingText}>Préparation du blindtest...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Erreur</Text>
                <Text style={styles.errorDetail}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={restartGame}>
                    <Text style={styles.buttonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (gameState === 'finished') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Partie terminée!</Text>
                <Text style={styles.scoreText}>Votre score: {score}/{questionsCount}</Text>
                <TouchableOpacity style={styles.button} onPress={restartGame}>
                    <Text style={styles.buttonText}>Rejouer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Blindtest: {categoryName}</Text>
                <Text style={styles.progress}>Question {currentTrackIndex + 1}/{questionsCount}</Text>
                <Text style={styles.score}>Score: {score}</Text>
            </View>

            <View style={styles.gameContainer}>
                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.playlistImage}
                    />
                )}

                <Text style={styles.questionText}>
                    {gameState === 'playing' ? "Quelle est cette chanson?" :
                        gameState === 'answered' ? "La bonne réponse était:" : ""}
                </Text>

                {gameState === 'answered' && (
                    <View style={styles.answerContainer}>
                        <Text style={styles.trackName}>{tracks[currentTrackIndex].name}</Text>
                        <Text style={styles.artistName}>
                            {tracks[currentTrackIndex].artists.map(a => a.name).join(', ')}
                        </Text>
                    </View>
                )}

                <View style={styles.optionsContainer}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                selectedOption && option.isCorrect && styles.correctOption,
                                selectedOption && selectedOption.id === option.id && !option.isCorrect && styles.wrongOption,
                                selectedOption && styles.disabledOption
                            ]}
                            onPress={() => !selectedOption && handleOptionSelect(option)}
                            disabled={!!selectedOption}
                        >
                            <Text style={styles.optionText}>{option.name}</Text>
                            <Text style={styles.optionSubText}>{option.artists}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {gameState === 'answered' && (
                    <TouchableOpacity style={styles.nextButton} onPress={goToNextQuestion}>
                        <Text style={styles.nextButtonText}>
                            {currentTrackIndex < questionsCount - 1 ? "Question suivante" : "Voir le résultat"}
                        </Text>
                    </TouchableOpacity>
                )}

                {isPlaying && gameState === 'playing' && (
                    <Text style={styles.playingText}>♫ Musique en cours... ♫</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191414',
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginVertical: 10,
    },
    progress: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1DB954',
        textAlign: 'center',
        marginTop: 5,
    },
    gameContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playlistImage: {
        width: 120,
        height: 120,
        borderRadius: 10,
        marginBottom: 20,
    },
    questionText: {
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    answerContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    trackName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1DB954',
        textAlign: 'center',
    },
    artistName: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 5,
    },
    optionsContainer: {
        width: '100%',
        marginVertical: 20,
    },
    optionButton: {
        backgroundColor: '#333333',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    correctOption: {
        backgroundColor: '#1DB954',
    },
    wrongOption: {
        backgroundColor: '#e74c3c',
    },
    disabledOption: {
        opacity: 0.7,
    },
    optionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionSubText: {
        color: '#BBBBBB',
        fontSize: 14,
        marginTop: 4,
    },
    nextButton: {
        backgroundColor: '#1DB954',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 20,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 20,
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
    },
    errorText: {
        color: '#FF4B4B',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorDetail: {
        color: '#BBBBBB',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#1DB954',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 20,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scoreText: {
        fontSize: 24,
        color: '#1DB954',
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    playingText: {
        fontSize: 14,
        color: '#1DB954',
        marginTop: 20,
    }
});