import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  listenForRoomUpdates,
  startGame,
} from '../services/firebaseCommands';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseAdmin from '../services/firebaseAdmin';
import { ref, get, update } from 'firebase/database';
import { db } from '../services/firebaseConfig';

const Lobby = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [gameState, setGameState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  useEffect(() => {
    const retrieveData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedRoomCode = await AsyncStorage.getItem('roomCode');
        const storedIsCreator = await AsyncStorage.getItem('isCreator');
        setUserId(storedUserId);
        setIsCreator(storedIsCreator === 'true');
        setRoomCode(storedRoomCode);
      } catch (error) {
        console.error("Failed to load from AsyncStorage:", error);
      }
    };

    retrieveData();
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = listenForRoomUpdates(roomCode, (data) => {
      if (data) {
        setPlayers(data.playerNames.map((p) => p.name));
        //console.log("Players in room:", data.playerNames);
        setGameState(data.gameState || null);
      } else {
        setPlayers([]);
      }
    });

    return () => {
      console.log("Unsubscribing from room updates...");
      unsubscribe();
    };
  }, [roomCode]);

  useEffect(() => {
    if (gameState === "selectingSongs" && players.length > 1) {
      router.push({ pathname: "/search", params: { roomCode, userId } });
    }
  }, [gameState, players, roomCode, userId]);

  const handleStartGame = async () => {
    if (!roomCode) return;

    const playersRef = ref(db, `rooms/${roomCode}/players`);
    const snapshot = await get(playersRef);
    const players = snapshot.val();

    if (!players || Object.keys(players).length < 2) {
      Alert.alert("Not Enough Players", "You need at least two players to start the game.");
      return;
    }

    const updates: any = {};

    for (const uid in players) {
      updates[`rooms/${roomCode}/players/${uid}/votes`] = 0;
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/title`] = "";
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/artist`] = "";
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/uri`] = "";
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/id`] = "";
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/image`] = "";
      updates[`rooms/${roomCode}/players/${uid}/selectedSong/preview`] = "";
    }

    try {
      await update(ref(db), updates);
      const result = await startGame(roomCode);
      if (!result.success) {
        Alert.alert("Error", result.message);
      }
    } catch (err) {
      console.error("❌ Failed to start game:", err);
      Alert.alert("Error", "Something went wrong starting the game.");
    }
  };

  const renderPlayers = () =>
    players
      .slice()
      .reverse()
      .map((player, index) => {
        if (index === 0) {
          return (
            <View key={index} style={styles.creatorBox}>
              <Text style={styles.creatorId}>{player}</Text>
            </View>
          );
        }
        return (
          <Text key={index} style={styles.playerName}>
            {player}
          </Text>
        );
      });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.roomCode}>{roomCode}</Text>

        <View style={styles.separator} />
        <View style={styles.separator} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderPlayers()}
        </ScrollView>

        {isCreator && (
          <TouchableOpacity style={styles.button} onPress={handleStartGame}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfcfb', // Replace with your actual background or gradient
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  roomCode: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  separator: {
    width: '100%',
    borderTopWidth: 2,
    borderColor: '#000',
    marginVertical: 4,
  },
  creatorBox: {
    borderWidth: 2,
    borderColor: '#000',
    width: 288,
    paddingVertical: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  creatorId: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1D4ED8', // Tailwind blue-700
  },
  scrollContent: {
    alignItems: 'center',
    height: 160,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    margin: 16,
    width: '60%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 32,
    textAlign: 'center',
  },
});

export default Lobby;
