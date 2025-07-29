// Vote.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { ref, get, set, onValue } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Vote = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [playersData, setPlayersData] = useState<any[]>([]);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    const retrieveData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedRoomCode = await AsyncStorage.getItem('roomCode');
        setUserId(storedUserId);
        setRoomCode(storedRoomCode);
      } catch (error) {
        console.error("Failed to load from AsyncStorage:", error);
      }
    };

    retrieveData();
  }, []);

  useEffect(() => {
    if (!roomCode || !userId) return;

    const gameStateRef = ref(db, `rooms/${roomCode}/gameState`);
    const unsubGameState = onValue(gameStateRef, async (snap) => {
      const gameState = snap.val();

      if (gameState === "voteSongs") {
        setVoteSubmitted(false);
        setTimerExpired(false);
        setTimeLeft(15);

        const playersRef = ref(db, `rooms/${roomCode}/players`);
        const snapshot = await get(playersRef);
        const data = snapshot.exists() ? snapshot.val() : {};

        const list = Object.entries(data)
          .map(([uid, val]: any) => {
            if (uid === userId) return null;
            const song = val.selectedSong;
            if (!song || !song.title || !song.artist) return null;
            return { userId: uid, song };
          })
          .filter(Boolean) as { userId: string; song: any }[];

        setPlayersData(list);
      }

      if (gameState === "podiumSongs") {
        router.push({ pathname: "/podium", params: { roomCode } });
      }
    });

    return () => unsubGameState();
  }, [roomCode, userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!voteSubmitted) {
            Alert.alert("⏰ Time's up!", "You didn't vote in time.");
          }
          setVoteSubmitted(true);
          setTimerExpired(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [voteSubmitted]);

  useEffect(() => {
    if (timerExpired && roomCode) {
      set(ref(db, `rooms/${roomCode}/gameState`), "podiumSongs").then(() => {
        router.push({ pathname: "/podium", params: { roomCode } });
      });
    }
  }, [timerExpired]);

  const handleVote = async (targetUserId: string) => {
    if (!roomCode || voteSubmitted) return;

    const voteRef = ref(
      db,
      `rooms/${roomCode}/players/${targetUserId}/votes`
    );
    const snapshot = await get(voteRef);
    const currentVotes = snapshot.exists() ? snapshot.val() : 0;

    await set(voteRef, currentVotes + 1);
    setVoteSubmitted(true);
    Alert.alert("✅ Vote Submitted");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🗳 Vote for your favorite!</Text>
      <Text style={styles.timer}>Time left: {timeLeft}s</Text>

      <FlatList
        data={playersData}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleVote(item.userId)}
            disabled={voteSubmitted}
            style={[
              styles.voteCard,
              voteSubmitted && styles.voteCardDisabled
            ]}
          >
            {item.song.image && (
              <Image
                source={{ uri: item.song.image }}
                style={styles.songImage}
              />
            )}
            <Text style={styles.songTitle}>{item.song.title}</Text>
            <Text style={styles.songArtist}>{item.song.artist}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No songs to vote for.</Text>
        }
      />

      {voteSubmitted && (
        <Text style={styles.thankYou}>Thanks for voting!</Text>
      )}
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
    justifyContent: "center",
  },
  header: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  timer: {
    textAlign: "center",
    marginBottom: 20,
  },
  voteCard: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    opacity: 1,
  },
  voteCardDisabled: {
    opacity: 0.6,
  },
  songImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  songArtist: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    color: "#666",
  },
  thankYou: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default Vote;
