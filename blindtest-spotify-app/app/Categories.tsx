// app/Categories.tsx
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ImageBackground,
    ActivityIndicator,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import categoriesData from './categories.json'; // Importer le fichier JSON

// Spotify token to use for all API calls
const SPOTIFY_TOKEN = "BQB7jW2lMfSLv1m-r0HdOc5Jer-Gu6oMs1yxQ5EyrvRsF_AKu8j-WdZi3cfqjF_1YJ6wsCnk2priTUFSbnl39H0EiiZV5IR-M6G7xtdpBVz6WiJnF3-Li1MMku-4UUvlQ1nDzLlQ65dZN8YSRBsyyu4AbNoPtDQLxI6W03-T7bupS0Nk8So1WiE1F6nntWsqQpuU2gNxotQl6eT7CsLfK4EZC54ruNgQXqNttvitmL62EYHRx2zKrP2UlODT6AgmmDcip5plonf-yT8HZm7waS5PYAAjGXAfhr0THRHUSWG6CY0SwdlmhLMjk9j2vEFhQSqUtKs";

// Utiliser les données importées
const CATEGORIES = categoriesData.categories;

export default function Categories() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);

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

    const handleCategorySelect = (category) => {
        setCategoryLoading(true);
        router.push({
            pathname: '/game',
            params: {
                playlistId: category.id_playlist,
                categoryName: category.name,
                imageUrl: category.image_playlist
            }
        });
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect(item)}
            disabled={categoryLoading}
        >
            <ImageBackground
                source={{ uri: item.image_playlist }} // Remplacer item.image par item.image_playlist
                style={styles.categoryImage}
                imageStyle={{ borderRadius: 8 }}
            >
                <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );

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
                <TouchableOpacity style={styles.button} onPress={fetchUserProfile}>
                    <Text style={styles.buttonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {userData && (
                <View style={styles.userInfoContainer}>
                    {userData.images && userData.images[0] && (
                        <Image
                            source={{ uri: userData.images[0].url }}
                            style={styles.userImage}
                        />
                    )}
                    <Text style={styles.userName}>Bonjour, {userData.display_name}</Text>
                </View>
            )}

            <Text style={styles.title}>Choisissez une catégorie</Text>

            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push('/history')}
            >
                <Text style={styles.historyButtonText}>Historique des quiz</Text>
            </TouchableOpacity>

            {categoryLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1DB954" />
                    <Text style={styles.loadingText}>Préparation du blind test...</Text>
                </View>
            ) : (
                <FlatList
                    data={CATEGORIES}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.categoriesList}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191414',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginVertical: 16,
        textAlign: 'center',
    },
    categoriesList: {
        paddingVertical: 8,
    },
    categoryCard: {
        flex: 1,
        margin: 6,
        aspectRatio: 1, // Make it a perfect square
        borderRadius: 8,
        overflow: 'hidden',
        maxWidth: '47%', // Ensure two columns with margins
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    categoryOverlay: {
        backgroundColor: 'rgba(0,0,0,0.65)', // Darker overlay for better text contrast
        padding: 8,
        width: '100%', // Ensure overlay covers the full width
    },
    categoryName: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#333333',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 20,
        alignSelf: 'center',
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#FFFFFF',
        fontSize: 16,
    },
    errorText: {
        color: '#FF4B4B',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorDetail: {
        color: '#BBBBBB',
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
    userInfoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 10,
    },
    userName: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    }
});