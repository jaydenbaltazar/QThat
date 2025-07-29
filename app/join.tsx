import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import firebaseAdmin from "../services/firebaseAdmin";
import InputBox from '../components/InputBox';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Join = () => {
  const [mode, setMode] = useState<'join' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // 🔑 Listen for keyboard open/close events
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleGoIndex = () => {
    router.push({ pathname: "/" });
  };

  const handleCreateRoom = async () => {
    if (username.includes(' ')) {
      Alert.alert('Invalid Username', 'No spaces allowed.');
      return;
    }

    if (username.length > 8) {
      Alert.alert('Invalid Username', 'Maximum 8 characters allowed.');
      return;
    }

    const userId = username.trim();
    await AsyncStorage.setItem('userId', userId);
    await AsyncStorage.setItem('isCreator', "true");

    try {
      const newRoomCode = await firebaseAdmin.createRoom(userId);
      await AsyncStorage.setItem('roomCode', newRoomCode);
      Alert.alert("Room Created", `Share this code: ${newRoomCode}`);
      router.push({ pathname: "/lobby", params: { roomCode: newRoomCode } });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username before joining.");
      return;
    }

    if (username.includes(' ')) {
      Alert.alert('Invalid Username', 'No spaces allowed.');
      return;
    }

    if (username.length > 8) {
      Alert.alert('Invalid Username', 'Maximum 8 characters allowed.');
      return;
    }

    if (!roomCode || roomCode.trim().length !== 4) {
      Alert.alert("Error", "Please enter a valid 4-character room code.");
      return;
    }

    const userId = username.trim();
    const result = await firebaseAdmin.joinRoom(roomCode, userId);

    if (result.success) {
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('roomCode', roomCode);
      await AsyncStorage.setItem('isCreator', "false");

      router.push({ pathname: "/lobby", params: { roomCode } });
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ✅ Only show return button if keyboard is NOT open */}
        {!keyboardVisible && (
          <TouchableOpacity style={styles.returnButton} onPress={handleGoIndex}>
            <Text style={styles.returnText}> {'>>'} Return</Text>
          </TouchableOpacity>
        )}

        {mode === null && (
          <>
            <InputBox
              placeholder="Enter Name"
              value={username}
              onChangeText={(text) => {
                const sanitized = text.replace(/\s/g, '').slice(0, 8);
                setUsername(sanitized);
              }}
            />

            <Image style={styles.connectorImageOne}
              source={require('../assets/images/join/2nd.png')}
            />

            <TouchableOpacity onPress={handleCreateRoom}>
              <Image style={styles.joinButton}
                source={require('../assets/images/join/host.png')}
              />
            </TouchableOpacity>

            <Image style={styles.connectorImageTwo}
              source={require('../assets/images/join/4th.png')}
            />

            <TouchableOpacity onPress={() => setMode('join')}>
              <Image style={styles.joinButton}
                source={require('../assets/images/join/join.png')}
              />
            </TouchableOpacity>
          </>
        )}

        {mode === 'join' && (
          <>
            <InputBox
              placeholder="Enter Name"
              value={username}
              onChangeText={(text) => {
                const sanitized = text.replace(/\s/g, '').slice(0, 8);
                setUsername(sanitized);
              }}
            />

            <Image style={styles.connectorImageOne}
              source={require('../assets/images/join/2nd.png')}
            />

            <TouchableOpacity onPress={() => setMode(null)}>
              <Image style={styles.joinButton}
                source={require('../assets/images/join/host.png')}
              />
            </TouchableOpacity>

            <Image style={styles.connectorImageTwo}
              source={require('../assets/images/join/4th.png')}
            />

            <TouchableOpacity onPress={handleJoinRoom}>
              <Image style={styles.joinButton}
                source={require('../assets/images/join/join.png')}
              />
            </TouchableOpacity>

            <Image style={styles.connectorImageThree}
              source={require('../assets/images/join/6th.png')}
            />

            <InputBox
              placeholder="Enter Room Code"
              value={roomCode}
              onChangeText={setRoomCode}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: "#BF00FF",
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 64,
    marginBottom: 40,
    color: "#E0E0E0",
    fontFamily: 'Azonix',
  },
  connectorImageOne: {
    width: 320,
    height: 90,
    borderRadius: 10,
    resizeMode: 'contain',
    marginBottom: -30,
    marginTop: -50,
  },
  connectorImageTwo: {
    width: 250,
    height: 100,
    borderRadius: 10,
    resizeMode: 'contain',
    marginBottom: -45,
    marginTop: -45,
  },
  connectorImageThree: {
    width: 320,
    height: 90,
    borderRadius: 10,
    resizeMode: 'contain',
    marginBottom: -50,
    marginTop: -25,
  },
  joinButton: {
    width: 250,
    height: 120,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  returnButton: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
  },
  returnText: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'Azonix',
  },
  roomCodeInput: {
    width: 300,
    height: 100,
    marginTop: 20,
    marginBottom: 20,
  },
});

export default Join;
