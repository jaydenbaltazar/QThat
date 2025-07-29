import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { selectSong } from '../services/firebaseCommands';
import { db } from '../services/firebaseConfig';
import { ref, get, set, onValue, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Search = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [lastGameState, setLastGameState] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('Loading...');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [lockedIn, setLockedIn] = useState(false);

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

  const fetchPrompt = async () => {
    const promptRef = ref(db, `rooms/${roomCode}/selectedPrompt`);
    const snapshot = await get(promptRef);
    setSelectedPrompt(snapshot.exists() ? snapshot.val() : "No prompt found.");
  };

  useEffect(() => {
    fetchPrompt();
  }, [roomCode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && selectedSong) {
      saveSelectedSong();
      setLockedIn(true);
    }
  }, [timeLeft]);

  useFocusEffect(
    useCallback(() => {
      setSearchInput('');
      setSearchResults([]);
    }, [])
  );

  useEffect(() => {
    if (!roomCode || !userId) return;

    const gameStateRef = ref(db, `rooms/${roomCode}/gameState`);
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
      const gameState = snapshot.val();

      if (gameState !== lastGameState) setLastGameState(gameState);

      if (gameState === "selectingSongs") {
        setSearchInput('');
        setSearchResults([]);
        setSelectedSong(null);
        setLockedIn(false);
        setTimeLeft(30);
        fetchPrompt();
      }

      if (gameState === "displaySongs") {
        router.push({ pathname: "/display" });
      }
    });

    return () => unsubscribe();
  }, [roomCode, userId, lastGameState]);

  const searchDeezer = async (query: string) => {
    if (!query.trim()) return setSearchResults([]);
    try {
      const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error("Deezer search failed:", error);
    }
  };

  const handleSearch = (text: string) => {
    if (!lockedIn && timeLeft > 0) {
      setSearchInput(text);
      searchDeezer(text);
    }
  };

  const selectSongHandler = (song: any) => {
    if (!lockedIn) setSelectedSong(song);
  };

  const saveSelectedSong = async () => {
    if (!selectedSong || !userId || !roomCode) return;
    const songData = {
      title: selectedSong.title,
      artist: selectedSong.artist.name,
      uri: selectedSong.link,
      id: selectedSong.id,
      image: selectedSong.album?.cover || '',
      preview: selectedSong.preview,
    };
    try {
      const result = await selectSong(roomCode, userId, songData);
      if (!result.success) console.error("❌ Save failed:", result.message);
    } catch (err) {
      console.error("🔥 Firebase error:", err);
    }
  };

  const toggleLockIn = () => {
    if (lockedIn) setLockedIn(false);
    else if (selectedSong) setLockedIn(true);
  };

  const goToNextScreen = async () => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    await update(roomRef, { gameState: "displaySongs" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{selectedPrompt}</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={[styles.flexGrow, lockedIn && styles.opacity50]}>
          <SearchBar
            placeholder="Search..."
            onSearch={handleSearch}
            editable={!lockedIn}
            value={searchInput}
          />
        </View>

        <View style={styles.timerContainer}>
          <Ionicons name="hourglass" size={16} color="#FF5733" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        <TouchableOpacity
          style={[styles.lockButton, lockedIn ? styles.locked : styles.unlocked]}
          onPress={toggleLockIn}
          disabled={(!selectedSong && !lockedIn) || timeLeft === 0}
        >
          <Text style={styles.lockButtonText}>{lockedIn ? 'Unqueue' : 'Queue'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.songCard,
              selectedSong?.id === item.id ? styles.songCardSelected : null,
            ]}
            onPress={() => selectSongHandler(item)}
            disabled={lockedIn}
          >
            <View style={styles.songInfoRow}>
              <Image source={{ uri: item.album.cover }} style={styles.songImage} />
              <View>
                <Text style={styles.songTitle}>{item.title}</Text>
                <Text style={styles.songArtist}>{item.artist.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyListText}>No results found</Text>}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      {timeLeft === 0 && isCreator && (
        <TouchableOpacity style={styles.nextButton} onPress={goToNextScreen}>
          <Text style={styles.nextButtonText}>Go to Next Screen</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // replace with your background
    padding: 20,
  },
  promptContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  promptText: {
    fontFamily: 'Azonix',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  flexGrow: {
    flex: 1,
  },
  opacity50: {
    opacity: 0.5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timerText: {
    marginLeft: 4,
    fontFamily: 'Azonix',
    fontSize: 14,
    fontWeight: '600',
  },
  lockButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
  },
  locked: {
    backgroundColor: '#10B981',
  },
  unlocked: {
    backgroundColor: '#3B82F6',
  },
  lockButtonText: {
    fontFamily: 'Azonix',
    color: 'white',
    fontSize: 12,
  },
  songCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  songCardSelected: {
    backgroundColor: '#BFDBFE',
  },
  songInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  songTitle: {
    fontFamily: 'Azonix',
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    fontFamily: 'Azonix',
    fontSize: 12,
    color: '#6B7280',
  },
  emptyListText: {
    fontFamily: 'Azonix',
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
  },
  nextButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  nextButtonText: {
    textAlign: 'center',
    fontFamily: 'Azonix',
    color: 'white',
    fontSize: 16,
  },
});

export default Search;
