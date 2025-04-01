// app/game.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Spotify token to use for all API calls
const SPOTIFY_TOKEN = "BQD_VXYytdKz-H1pMdwq0b31P2VlLeuPbv5rEr--uatDd2AmpaK-I5Vpe0_Z6YYRVDtYP795MTY4qS0eDF5pUjkz4t0ixbj8D6bo91YCWor6HEU20jgW3ZnOjtSSGTRe9ncD1YLXaI7cnBZs2M0dnWlpJxiCZhr8GFdbb5lg_R90oxFjBKlkNFEpG3yPgHJ53P3TZQynOw2QemYVMf4Fmm0Jm-zsZAgOnve_zSMTsdGP58hUdrVdfl1_Y5eHdtajBsFLcMKRLMfJ0PHZ476pnuVe837N2fC_20vNp1OoyPaeYvZiWZs4sETXcSqH5oxaTcnRBMk";

export default function Game() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Test the token by fetching user profile
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('https://api.spotify.com/v1/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SPOTIFY_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            setUserData(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#1DB954" />
                <Text style={styles.loadingText}>Chargement de Spotify...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Erreur de connexion à Spotify</Text>
                <Text style={styles.errorDetail}>{error}</Text>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blind-Spoti</Text>

            {userData && (
                <View style={styles.userInfo}>
                    {userData.images && userData.images[0] && (
                        <Image
                            source={{ uri: userData.images[0].url }}
                            style={styles.userImage}
                        />
                    )}
                    <Text style={styles.userName}>Bonjour, {userData.display_name}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Commencer une partie</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191414',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1DB954',
        marginBottom: 40,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },
    userImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    userName: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#1DB954',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 20,
        color: '#FFFFFF',
        fontSize: 16,
    },
    errorText: {
        color: '#FF4B4B',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    errorDetail: {
        color: '#BBBBBB',
        textAlign: 'center',
        marginBottom: 30,
    }
});