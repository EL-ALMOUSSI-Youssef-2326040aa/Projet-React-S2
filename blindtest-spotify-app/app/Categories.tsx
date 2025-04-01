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
const SPOTIFY_TOKEN = "BQBjaiUXVkUs-5tagU70q2y_UM7xi_bDQHCz218tqAm1RkBsEDnzPHi62zzBeJPinH1j8J1NtHm2Fp3CpAZhLe-4iA8cpTQNUkvarscKxt_PrJ-WkZI6438kOfl0eoAUPaOPkgk9q_4nDqVLSNIISLOtNZGCvDwtz2b602DWSzt_HB2WCV-f7t6_UI8W42NheE36LWxlSy0sqghIjQD6XPrJhMitrUE5DXmM4wHksGKjVPYikiVXX_ctl7gl63RBvsgiwbRr_bICnRfqMKkq4K2SuM2Bg8vUZC6-PxyD6gZm8yI3JZxU_3_3kcOW4fvu_pI";

// Mock data for categories - would be fetched from Spotify API in production
// Organized categories for the blindtest app
const CATEGORIES = [
    // Popular & Current
    { id: '1', name: 'Top 50 : France', image: 'https://charts-images.scdn.co/assets/locale_en/regional/daily/region_fr_default.jpg' },
    { id: '2', name: 'Pop', image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730' },

    // Decades - Pop & General
    { id: '3', name: 'Années 80', image: 'https://i.scdn.co/image/ab67706f00000002b2a0585878a07d5a6f69db73' },
    { id: '4', name: 'Pop 80', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84fa4dcd9a08eb6f43249f0245' },
    { id: '5', name: 'Années 90', image: 'https://i.scdn.co/image/ab67706f00000002db68e1523b83ef9e51f77917' },
    { id: '6', name: 'Pop 90', image: 'https://i.scdn.co/image/ab67706f000000023c783941e311b5fc163cf219' },
    { id: '7', name: 'Années 2000', image: 'https://i.scdn.co/image/ab67616d00001e02d19086792a263aa4441104d5' },
    { id: '8', name: 'Pop 2000', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84eabf1dd7769b98ecfd70b8e7' },
    { id: '9', name: 'Années 2010', image: 'https://i.scdn.co/image/ab67706f000000027f84b4715280a2332f1aed9e' },
    { id: '10', name: 'Pop 2010', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8492fd29c57d6f8662b4bbb1a5' },

    // Rap & Hip Hop
    { id: '11', name: 'Rap FR', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c25fe3f0f416281d1a6a9f6cb' },
    { id: '12', name: 'Classiques Rap Français', image: 'https://i.scdn.co/image/ab67616d00001e02b897f7f02a06ce4dc229b975' },
    { id: '13', name: 'Rap US', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c309fe43a277ab2144608d409' },
    { id: '14', name: 'Classiques Rap Américain', image: 'https://i.scdn.co/image/ab67616d00001e02f11f6b3eb213cdfb53bbac2a' },
    { id: '15', name: 'Hip Hop', image: 'https://seed-mix-image.spotifycdn.com/v6/img/hip_hop/4V8LLVI7PbaPR0K2TGSxFF/fr/default' },

    // Rock by decade
    { id: '16', name: 'Rock 80', image: 'https://i.scdn.co/image/ab67706f000000026a4dd2feddc04bfc9ab6f05f' },
    { id: '17', name: 'Rock 90', image: 'https://i.scdn.co/image/ab67706f00000002478f23217cfd6839b5e3c429' },
    { id: '18', name: 'Rock 2000', image: 'https://i.scdn.co/image/ab67706f000000024b64528b8fb770104bac5a21' },

    // Electronic music
    { id: '19', name: 'Electro', image: 'https://i.scdn.co/image/ab67706f000000026214f0de25baefc0f233ad02' },
    { id: '20', name: 'Techno', image: 'https://i.scdn.co/image/ab67706f00000002b5d03b4e031e7d8e707fbe4a' },

    // Other genres
    { id: '21', name: 'Classiques Chansons Françaises', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c3a7df67402353a232e7204d8' },
    { id: '22', name: 'Latino', image: 'https://mosaic.scdn.co/300/ab67616d00001e0211b9999…aa997b812ab67616d00001e0282de1ca074ae63cb18fce335' },
    { id: '23', name: 'Funk', image: 'https://mosaic.scdn.co/300/ab67616d00001e023a3c381…712ec96a7ab67616d00001e02e88a017e11d2dc06ff391761' },
    { id: '24', name: 'K-Pop', image: 'https://seed-mix-image.spotifycdn.com/v6/img/k_pop/3eVa5w3URK5duf6eyVDbu9/fr/default' },

    // Media
    { id: '25', name: 'Musiques de Films', image: 'https://mosaic.scdn.co/300/ab67616d00001e0205b46ad…3fa29ca7fab67616d00001e02f3a2d7f692fcad25284c5f1e' },
    { id: '26', name: 'Musique de Jeux Vidéos', image: 'https://mosaic.scdn.co/300/ab67616d00001e0201cc3c9…6d7a1c377ab67616d00001e02943c113347461b66ba58d116' },
    { id: '27', name: 'Génériques Dessins Animés', image: 'https://mosaic.scdn.co/300/ab67616d00001e020d608cb…00cab9cb8ab67616d00001e0243dc506e51ea724ffe975f93' },

    // Special categories
    { id: '28', name: 'Nostalgie', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8480be5241c5b5cd593f020a14' },
    { id: '29', name: 'Classiques de la Musique', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da849418dd3e204505b565f1b3fe' },
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