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

// Spotify token to use for all API calls
const SPOTIFY_TOKEN = "BQD4zj5XyTyz83GDJo8JFpas4zObBiM2SotnbkY23FlCqDDJffDD9vSRzl4b_e1ZdMq5AEHy_ODBCmbcTx1zU2Sw7Lur-fOmQHwfaU5kx--tIshbf0j4ttuQS-aKoQG-MzEgiY-Nnwdz3v2vaR25_88BBcXHER9s5pF2fhrBcc_wKn54RZztZVnA9eP6GDeCLHtAYUr9wMqbzztBWcxZ5pnFN-W-Yv2uhEiN4uMPlIDoZYkgSsThVGPZOaEckeL9JDjwKO6hUngCFdJuyr3Nm_lbFBnPivquqqK27uesK8DO6tg_gRKlrXnn5UYwWrqdkmc";

// Mock data for categories - would be fetched from Spotify API in production
// Organized categories for the blindtest app
const CATEGORIES = [
    // Popular & Current
    { id: '1', name: 'Top 50 : France', image: 'https://charts-images.scdn.co/assets/locale_en/regional/daily/region_fr_default.jpg' },
    { id: '2', name: 'Pop', image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730' },

    // Decades - Pop & General
    { id: '3', name: 'Années 80', image: 'https://i.scdn.co/image/ab67706f000000025f72117e76f8743a20be2776' },
    { id: '4', name: 'Pop 80', image: 'https://i.scdn.co/image/ab67706f0000000285704160b49125ac95099ec8' },
    { id: '5', name: 'Années 90', image: 'https://i.scdn.co/image/ab67706f0000000278b4745cb2a8965db098aff0' },
    { id: '6', name: 'Pop 90', image: 'https://i.scdn.co/image/ab67706f00000002e9c9419099422973496d99a7' },
    { id: '7', name: 'Années 2000', image: 'https://i.scdn.co/image/ab67706f000000026abff8de68c75470ea8f0665' },
    { id: '8', name: 'Pop 2000', image: 'https://i.scdn.co/image/ab67706f000000027cceee1a8ada7b9c4ce1ebf1' },
    { id: '9', name: 'Années 2010', image: 'https://i.scdn.co/image/ab67706f000000020e39c49b72045148f4f921b9' },
    { id: '10', name: 'Pop 2010', image: 'https://i.scdn.co/image/ab67706f00000002c4e0a29097d2f0f52baf8b68' },

    // Rap & Hip Hop
    { id: '11', name: 'Rap FR', image: 'https://i.scdn.co/image/ab67706f000000025e196e31a058e5531d4b1bcc' },
    { id: '12', name: 'Classiques Rap Français', image: 'https://i.scdn.co/image/ab67706f0000000235f14aa06e5f7880f175bf73' },
    { id: '13', name: 'Rap US', image: 'https://i.scdn.co/image/ab67706f0000000264cf4fa971080d0cad799d4e' },
    { id: '14', name: 'Classiques Rap Américain', image: 'https://i.scdn.co/image/ab67706f0000000213601d4833623a4c10b75ca9' },
    { id: '15', name: 'Hip Hop', image: 'https://i.scdn.co/image/ab67706f00000002d72ef75e14ca6f60ea7f4b5e' },

    // Rock by decade
    { id: '16', name: 'Rock 80', image: 'https://i.scdn.co/image/ab67706f000000026a4dd2feddc04bfc9ab6f05f' },
    { id: '17', name: 'Rock 90', image: 'https://i.scdn.co/image/ab67706f00000002478f23217cfd6839b5e3c429' },
    { id: '18', name: 'Rock 2000', image: 'https://i.scdn.co/image/ab67706f000000024b64528b8fb770104bac5a21' },

    // Electronic music
    { id: '19', name: 'Electro', image: 'https://i.scdn.co/image/ab67706f000000026214f0de25baefc0f233ad02' },
    { id: '20', name: 'Techno', image: 'https://i.scdn.co/image/ab67706f00000002b5d03b4e031e7d8e707fbe4a' },

    // Other genres
    { id: '21', name: 'Classiques Chansons Françaises', image: 'https://i.scdn.co/image/ab67706f000000026809e972278a9bc0e12524da' },
    { id: '22', name: 'Latino', image: 'https://i.scdn.co/image/ab67706f0000000221c1564f78ed3fddce7402c6' },
    { id: '23', name: 'Funk', image: 'https://i.scdn.co/image/ab67706f00000002a5c43e968dea669245ca1251' },
    { id: '24', name: 'K-Pop', image: 'https://i.scdn.co/image/ab67706f00000002978b1452dbe152e65a352a1d' },

    // Media
    { id: '25', name: 'Musiques de Films', image: 'https://i.scdn.co/image/ab67706f00000002e0095d42f0b1e37546caac53' },
    { id: '26', name: 'Musique de Jeux Vidéos', image: 'https://i.scdn.co/image/ab67706f000000026057473304c2e2a0c4a75e6e' },
    { id: '27', name: 'Génériques Dessins Animés', image: 'https://i.scdn.co/image/ab67706f00000002017d551b6ef3af4abef4e64f' },

    // Special categories
    { id: '28', name: 'Nostalgie', image: 'https://i.scdn.co/image/ab67706f0000000278b231b764bac0166809233c' },
    { id: '29', name: 'Classiques de la Musique', image: 'https://i.scdn.co/image/ab67706f00000002ff5fffe18788ef05e895c27d' },
];

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
        // In a real app, we would fetch songs from this category
        // For now, we'll just simulate a delay and then redirect
        setTimeout(() => {
            setCategoryLoading(false);
            // Future implementation: router.push({ pathname: '/play', params: { categoryId: category.id }});
            // For now, we'll just log the selection
            console.log(`Selected category: ${category.name}`);
        }, 500);
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategorySelect(item)}
            disabled={categoryLoading}
        >
            <ImageBackground
                source={{ uri: item.image }}
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