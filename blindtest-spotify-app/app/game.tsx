// app/game.tsx
import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Token Spotify (à remplacer par un token valide)
const SPOTIFY_TOKEN = "BQB7jW2lMfSLv1m-r0HdOc5Jer-Gu6oMs1yxQ5EyrvRsF_AKu8j-WdZi3cfqjF_1YJ6wsCnk2priTUFSbnl39H0EiiZV5IR-M6G7xtdpBVz6WiJnF3-Li1MMku-4UUvlQ1nDzLlQ65dZN8YSRBsyyu4AbNoPtDQLxI6W03-T7bupS0Nk8So1WiE1F6nntWsqQpuU2gNxotQl6eT7CsLfK4EZC54ruNgQXqNttvitmL62EYHRx2zKrP2UlODT6AgmmDcip5plonf-yT8HZm7waS5PYAAjGXAfhr0THRHUSWG6CY0SwdlmhLMjk9j2vEFhQSqUtKs";

// Déclarer window pour le SDK Spotify
declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: any;
    }
}

export default function Game() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { playlistId, categoryName, imageUrl } = params;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [allPlaylistTracks, setAllPlaylistTracks] = useState<any[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [options, setOptions] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'answered', 'finished'
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const playerRef = useRef<any>(null);
    const questionsCount = 10;

    // Initialiser le lecteur Spotify
    useEffect(() => {
        if (typeof document !== 'undefined') { // Vérifier si nous sommes dans un environnement web
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);

            window.onSpotifyWebPlaybackSDKReady = () => {
                const player = new window.Spotify.Player({
                    name: 'Spoti-Find Blindtest',
                    getOAuthToken: (cb: (token: string) => void) => { cb(SPOTIFY_TOKEN); },
                    volume: 0.5
                });

                player.addListener('ready', ({ device_id }: { device_id: string }) => {
                    console.log('Ready with Device ID', device_id);
                    setDeviceId(device_id);
                    playerRef.current = player;
                });

                player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                    console.log('Device ID has gone offline', device_id);
                });

                player.addListener('player_state_changed', (state: any) => {
                    if (state) {
                        setIsPlaying(!state.paused);
                    }
                });

                player.connect();
            };

            return () => {
                if (playerRef.current) {
                    playerRef.current.disconnect();
                }
            };
        }
    }, []);

    // Récupérer les pistes de la playlist sélectionnée
    useEffect(() => {
        const fetchPlaylistTracks = async () => {
            try {
                const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${SPOTIFY_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status}`);
                }

                const data = await response.json();

                // Filtrer les pistes valides (avec preview_url ou non nulles)
                const validTracks = data.items
                    .filter((item: any) => item.track && item.track.name && item.track.artists.length > 0)
                    .map((item: any) => item.track);

                // Sauvegarder toutes les pistes de la playlist pour diversifier les mauvaises réponses
                setAllPlaylistTracks(validTracks);

                // Sélectionner aléatoirement 10 pistes pour les questions
                const shuffled = [...validTracks].sort(() => 0.5 - Math.random());
                const selectedTracks = shuffled.slice(0, questionsCount);

                setTracks(selectedTracks);

                // Préparer les options pour la première question
                if (selectedTracks.length > 0) {
                    prepareQuestion(selectedTracks, 0, validTracks);
                }
            } catch (err: any) {
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
    const prepareQuestion = (allTracks: any[], index: number, poolTracks: any[]) => {
        const correctTrack = allTracks[index];

        // Sélectionner 3 autres pistes aléatoires comme mauvaises réponses
        // Utiliser toutes les pistes de la playlist pour plus de variété
        const otherTracks = poolTracks
            .filter(t => t.id !== correctTrack.id)
            .sort(() => Math.random() - 0.5) // Mélange complet
            .slice(0, 3);

        // Combiner et mélanger les options
        const allOptions = [
            {
                id: correctTrack.id,
                name: correctTrack.name,
                artists: correctTrack.artists.map((a: any) => a.name).join(', '),
                albumImage: correctTrack.album?.images?.[0]?.url || null,
                isCorrect: true
            },
            ...otherTracks.map((t: any) => ({
                id: t.id,
                name: t.name,
                artists: t.artists.map((a: any) => a.name).join(', '),
                albumImage: t.album?.images?.[0]?.url || null,
                isCorrect: false
            }))
        ].sort(() => Math.random() - 0.5);

        setOptions(allOptions);
        setGameState('playing');
    };

    const saveQuizResult = async () => {
        try {
            // Récupérer l'historique existant
            const historyString = await AsyncStorage.getItem('quiz_history');
            const history = historyString ? JSON.parse(historyString) : [];

            // Ajouter le nouveau résultat
            const newResult = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                score: score,
                total: questionsCount,
                categoryName: categoryName as string,
            };

            // Limiter à 10 résultats maximum pour éviter de prendre trop d'espace
            const updatedHistory = [newResult, ...history].slice(0, 10);

            // Sauvegarder l'historique mis à jour
            await AsyncStorage.setItem('quiz_history', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du résultat:', error);
        }
    };

    // Jouer la piste actuelle
    useEffect(() => {
        if (deviceId && tracks.length > 0 && currentTrackIndex < tracks.length) {
            const trackUri = tracks[currentTrackIndex].uri;
            playTrack(trackUri);
        }
    }, [deviceId, currentTrackIndex, tracks]);

    const playTrack = (trackUri: string) => {
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

    const handleOptionSelect = (option: any) => {
        setSelectedOption(option);


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
            prepareQuestion(tracks, nextIndex, allPlaylistTracks);
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
                <Text style={styles.loadingText as any}>Préparation du blindtest...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText as any}>Erreur</Text>
                <Text style={styles.errorDetail as any}>{error}</Text>
                <TouchableOpacity style={styles.button} onPress={restartGame}>
                    <Text style={styles.buttonText as any}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Ajouter cette nouvelle fonction qui réinitialise le jeu avec la même playlist
    const replayGame = () => {
        // Réinitialiser les états
        setScore(0);
        setCurrentTrackIndex(0);
        setSelectedOption(null);
        setGameState('loading');

        // Remélanger les pistes pour une nouvelle partie
        const shuffledTracks = [...allPlaylistTracks].sort(() => Math.random() - 0.5).slice(0, questionsCount);
        setTracks(shuffledTracks);

        // Préparer la première question
        setTimeout(() => {
            prepareQuestion(shuffledTracks, 0, allPlaylistTracks);
        }, 1000);
    };

// Renommer l'ancienne fonction pour plus de clarté
    const goToCategories = () => {
        router.replace('/Categories');
    };

// Puis modifier l'écran de fin de jeu
    if (gameState === 'finished') {
        saveQuizResult();
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Partie terminée!</Text>
                <Text style={styles.scoreText}>Votre score: {score}/{questionsCount}</Text>

                <View style={styles.endGameButtonsContainer}>
                    <TouchableOpacity style={styles.endGameButton} onPress={replayGame}>
                        <Text style={styles.endGameButtonText}>Rejouer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.endGameButton, styles.secondaryButton]} onPress={goToCategories}>
                        <Text style={styles.endGameButtonText}>Changer de quiz</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title as any}>Blindtest: {categoryName}</Text>
                <Text style={styles.progress as any}>Question {currentTrackIndex + 1}/{questionsCount}</Text>
                <Text style={styles.score as any}>Score: {score}</Text>
            </View>

            <View style={styles.gameContainer}>
                {/* Afficher un point d'interrogation pendant le jeu,
                    puis la pochette de l'album après avoir répondu */}
                {gameState === 'playing' ? (
                    <View style={styles.questionMarkContainer}>
                        <Text style={styles.questionMark}>?</Text>
                    </View>
                ) : gameState === 'answered' && tracks[currentTrackIndex]?.album?.images?.[0]?.url ? (
                    <Image
                        source={{ uri: tracks[currentTrackIndex].album.images[0].url }}
                        style={styles.playlistImage}
                    />
                ) : null}

                <Text style={styles.questionText as any}>
                    {gameState === 'playing' ? "Quelle est cette chanson?" :
                        gameState === 'answered' ? "La bonne réponse était:" : ""}
                </Text>

                {gameState === 'answered' && (
                    <View style={styles.answerContainer}>
                        <Text style={styles.trackName as any}>{tracks[currentTrackIndex].name}</Text>
                        <Text style={styles.artistName as any}>
                            {tracks[currentTrackIndex].artists.map((a: any) => a.name).join(', ')}
                        </Text>
                    </View>
                )}

                <View style={styles.optionsContainer}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                gameState === 'answered' && option.isCorrect && styles.correctOption,
                                gameState === 'answered' && selectedOption?.id === option.id && !option.isCorrect && styles.wrongOption,
                                gameState === 'answered' && styles.disabledOption
                            ]}
                            onPress={() => gameState === 'playing' && handleOptionSelect(option)}
                            disabled={gameState !== 'playing'}
                        >
                            <Text style={styles.optionText as any}>{option.name}</Text>
                            <Text style={styles.optionSubText as any}>{option.artists}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {gameState === 'answered' && (
                    <TouchableOpacity style={styles.nextButton} onPress={goToNextQuestion}>
                        <Text style={styles.nextButtonText as any}>
                            {currentTrackIndex + 1 < questionsCount ? "Question suivante" : "Voir le score final"}
                        </Text>
                    </TouchableOpacity>
                )}

                {isPlaying && gameState === 'playing' && (
                    <Text style={styles.playingText as any}>♫ Musique en cours... ♫</Text>
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
    questionMarkContainer: {
        width: 120,
        height: 120,
        borderRadius: 10,
        backgroundColor: '#333',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionMark: {
        color: '#FFFFFF',
        fontSize: 60,
        fontWeight: 'bold',
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
    },endGameButtonsContainer: {
        marginTop: 30,
        width: '100%',
        alignItems: 'center',
    },
    endGameButton: {
        backgroundColor: '#1DB954',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginVertical: 10,
        width: '80%',
        alignItems: 'center',
    },
    secondaryButton: {
        backgroundColor: '#333333',
    },
    endGameButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    playingText: {
        fontSize: 14,
        color: '#1DB954',
        marginTop: 20,
    }
});