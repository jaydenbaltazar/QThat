import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../services/firebaseConfig';
import { router } from 'expo-router';
import { pushToVotePage } from '../services/firebaseCommands';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RotatingVinyl from '../components/RotatingVinyl';

const Display = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [playersData, setPlayersData] = useState<any[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  /* 👇 counts how many times we need a full reset */
  const [resetKey, setResetKey] = useState(0);

  /* ------------------------------------------------------------------ */
  /* load basic data                                                     */
  useEffect(() => {
    (async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedRoomCode = await AsyncStorage.getItem('roomCode');
      const storedIsCreator = await AsyncStorage.getItem('isCreator');
      setUserId(storedUserId);
      setIsCreator(storedIsCreator === 'true');
      setRoomCode(storedRoomCode);
    })();
  }, []);

  /* ------------------------------------------------------------------ */
  /* watch Firebase state                                               */
  useEffect(() => {
    if (!roomCode || !isCreator) return;
    const gameStateRef = ref(db, `rooms/${roomCode}/gameState`);
    const unsub = onValue(gameStateRef, snap => {
      if (snap.val() === 'displaySongs') fetchPlayerSongs();
    });
    return () => unsub();
  }, [roomCode, isCreator]);

  /* ------------------------------------------------------------------ */
  const fetchPlayerSongs = async () => {
    if (!roomCode) return;
    const playersSnap = await get(ref(db, `rooms/${roomCode}/players`));
    const players = playersSnap.exists() ? playersSnap.val() : {};
    const data = Object.entries(players)
      .map(([uid, val]: any) => val.selectedSong && { userId: uid, song: val.selectedSong })
      .filter(Boolean);
    setPlayersData(data as any[]);
    setCurrentPlayerIndex(0);
    setResetKey(k => k + 1); // reset vinyl for first song
  };

  /* stop & unload when song changes */
  useEffect(() => {
    if (player) {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setPlayer(null);
    }
  }, [currentPlayerIndex]);

  /* ------------------------------------------------------------------ */
  const currentSong = playersData[currentPlayerIndex]?.song;

  const loadPreviewUrl = async () => {
    if (!currentSong) return null;
    const query = `${currentSong.title} ${currentSong.artist}`;
    const resp = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
    const { data } = await resp.json();
    return data?.[0]?.preview ?? null;
  };

  const togglePlay = async () => {
    if (isLoading) return;
    if (player) {
      player[isPlaying ? 'pause' : 'play']();
      setIsPlaying(!isPlaying);
      return;
    }
    try {
      setIsLoading(true);
      const url = await loadPreviewUrl();
      if (!url) return Alert.alert('Preview not found');
      const newPlayer = createAudioPlayer({ uri: url });
      setPlayer(newPlayer);
      newPlayer.play();
      setIsPlaying(true);
      newPlayer.addListener('playbackStatusUpdate', s => {
        if (s.isLoaded && !s.playing && s.currentTime >= s.duration) {
          setIsPlaying(false);
          setPlayer(null);
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  const stopAndReset = () => {
    if (player) {
      player.pause();
      player.seekTo(0);
      setPlayer(null);
    }
    setIsPlaying(false);
    setResetKey(k => k + 1); // ⬅️ force vinyl back to 0°
  };

  const handleNext = () => {
    if (!isCreator || playersData.length === 0) return;
    stopAndReset();
    setCurrentPlayerIndex(i => (i + 1) % playersData.length);
  };

  const handlePushToVote = () => {
    stopAndReset();
    if (roomCode) pushToVotePage(roomCode);
  };

  useEffect(() => {
  if (!roomCode || !userId) return;

  const gameStateRef = ref(db, `rooms/${roomCode}/gameState`);
  const unsubscribe = onValue(gameStateRef, (snap) => {
    const state = snap.val();

    if (state === 'voteSongs') {
      router.push({
        pathname: '/vote',
        params: { roomCode, userId },
      });
    }
  });

  return () => unsubscribe();
}, [roomCode, userId]);


  /* ------------------------------------------------------------------ */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.subtitle}>
        {isCreator
          ? currentSong ? `🎧 ${currentSong.title} — ${currentSong.artist}` : 'Loading song...'
          : '🎧 Listen on the leader’s device...'}
      </Text>

      {isCreator ? (
        <View style={{ alignItems: 'center' }}>
          <RotatingVinyl
            isSpinning={isPlaying}
            coverImage={currentSong?.image}
            resetKey={resetKey}          // 👈 NEW PROP
          />

          <Text style={styles.songTitle}>
            {currentSong?.title || 'Loading...'}
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <View style={styles.controls}>
              <Button
                title={player ? (isPlaying ? '⏸ Pause' : '▶️ Resume') : '▶️ Play'}
                onPress={togglePlay}
              />
              <Button title="⏹ Stop" onPress={stopAndReset} disabled={!player && !isPlaying} />
            </View>
          )}

          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.nextButton}>Next Song</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.listenerText}>🎧 Listen on the leader’s device</Text>
      )}

      {isCreator && (
        <View style={styles.voteContainer}>
          <Button title="🚀 Push to Vote Page" onPress={handlePushToVote} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  subtitle: { fontSize: 20, marginBottom: 10, textAlign: 'center' },
  songTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  nextButton: { color: '#fff', fontSize: 20, marginTop: 10, backgroundColor: '#3B82F6', 
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  listenerText: { fontSize: 18, color: '#6B7280', marginTop: 40, textAlign: 'center' },
  voteContainer: { marginTop: 20 },
});

export default Display;
