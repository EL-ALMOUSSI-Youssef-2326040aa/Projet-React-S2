// app/history.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuizResult {
    id: string;
    date: string;
    score: number;
    total: number;
    categoryName: string;
}

export default function History() {
    const router = useRouter();
    const [history, setHistory] = useState<QuizResult[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const historyString = await AsyncStorage.getItem('quiz_history');
            if (historyString) {
                const historyData = JSON.parse(historyString);
                setHistory(historyData);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
        }
    };

    const getScoreColor = (score, total) => {
        // Calcul du pourcentage de réussite
        const percentage = (score / total) * 100;

        // Définir les couleurs pour les scores faibles, moyens et élevés
        if (percentage >= 80) return '#1e8449'; // Vert foncé pour 8-10/10
        if (percentage >= 60) return '#27ae60'; // Vert pour 6-7/10
        if (percentage >= 40) return '#f39c12'; // Orange pour 4-5/10
        if (percentage >= 20) return '#d35400'; // Orange foncé pour 2-3/10
        return '#c0392b';                       // Rouge pour 0-1/10
    };

    const clearHistory = async () => {
        try {
            await AsyncStorage.setItem('quiz_history', JSON.stringify([]));
            setHistory([]);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'historique:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Historique des quiz</Text>

            {history.length === 0 ? (
                <Text style={styles.emptyText}>Aucun historique disponible</Text>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.historyItem}>
                            <Text style={styles.categoryText}>{item.categoryName}</Text>
                            <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                            <Text style={[styles.scoreText, { color: getScoreColor(item.score, item.total) }]}>
                                Score: {item.score}/{item.total}
                            </Text>
                        </View>
                    )}
                />
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, history.length === 0 && styles.disabledButton]}
                    onPress={clearHistory}
                    disabled={history.length === 0}
                >
                    <Text style={styles.buttonText}>Effacer l'historique</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.buttonText}>Retour</Text>
                </TouchableOpacity>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginVertical: 20,
    },
    emptyText: {
        color: '#BBBBBB',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    historyItem: {
        backgroundColor: '#333333',
        padding: 16,
        borderRadius: 8,
        marginBottom: 10,
    },
    categoryText: {
        color: '#1DB954',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#BBBBBB',
        fontSize: 14,
        marginTop: 4,
    },
    scoreText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 6,
    },
    buttonContainer: {
        marginTop: 30,
    },
    button: {
        backgroundColor: '#1DB954',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginVertical: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    secondaryButton: {
        backgroundColor: '#333333',
    },
    disabledButton: {
        opacity: 0.5,
    }
});