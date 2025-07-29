import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Podium = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [rankedPlayers, setRankedPlayers] = useState<
    { userId: string; song: any; votes: number }[]
  >([]);

  useEffect(() => {
    const retrieveData = async () => {
      try {
        const storedRoomCode = await AsyncStorage.getItem('roomCode');
        setRoomCode(storedRoomCode);
      } catch (error) {
        console.error("Failed to load from AsyncStorage:", error);
      }
    };
    retrieveData();
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    const playersRef = ref(db, `rooms/${roomCode}/players`);
    const unsub = onValue(playersRef, (snapshot) => {
      const playersObj = snapshot.val();
      if (!playersObj) return;

      const allEntries = Object.entries(playersObj).map(
        ([uid, val]: any) => {
          const song = val.selectedSong;
          const votes = val.votes || 0;
          if (!song || !song.title || !song.artist) return null;
          return { userId: uid, song, votes };
        }
      );

      const top3 = allEntries
        .filter((p): p is { userId: string; song: any; votes: number } => p !== null)
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3);

      setRankedPlayers(top3);
    });

    return () => unsub();
  }, [roomCode]);

  const handleNextRound = async () => {
    if (!roomCode) return;

    try {
      await set(ref(db, `rooms/${roomCode}/gameState`), 'waiting');
      await set(ref(db, `rooms/${roomCode}/currentPlayerIndex`), 0);
      router.push({ pathname: '/lobby', params: { roomCode } });
    } catch (err) {
      Alert.alert('Error resetting for next round.');
      console.error(err);
    }
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🏆 Podium</Text>

      <FlatList
        data={rankedPlayers}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.podiumCard,
              index === 0
                ? styles.gold
                : index === 1
                ? styles.silver
                : styles.bronze,
            ]}
          >
            <Text style={styles.songTitle}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {item.song.title}
            </Text>
            <Text>{item.song.artist}</Text>
            {item.song.image && (
              <Image
                source={{ uri: item.song.image }}
                style={styles.image}
              />
            )}
            <Text style={styles.votes}>Votes: {item.votes}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Waiting for votes to finalize...
          </Text>
        }
      />

      <View style={styles.buttonGroup}>
        <Button title="🔁 Start Next Round" onPress={handleNextRound} />
        <View style={styles.spacer} />
        <Button title="🏠 Go Back to Home" onPress={handleGoHome} color="gray" />
      </View>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────
//                         STYLES
// ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  podiumCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  gold: {
    backgroundColor: '#FFD700',
  },
  silver: {
    backgroundColor: '#C0C0C0',
  },
  bronze: {
    backgroundColor: '#CD7F32',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 10,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  votes: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  buttonGroup: {
    marginTop: 30,
  },
  spacer: {
    marginTop: 10,
  },
});

export default Podium;
