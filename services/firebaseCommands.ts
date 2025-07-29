import { get, ref, set, update, onValue, remove } from "firebase/database";
import { db } from "./firebaseConfig";
import { prompts } from "../services/prompts";

const generateRoomCode = () => {
  let code = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createRoom = async (creatorId: string) => {
  const roomCode = generateRoomCode();
  const roomRef = ref(db, `rooms/${roomCode}`);

  await set(roomRef, {
    players: {
      [creatorId]: {
         name: creatorId,
         votes: 0,
         selectedSong: { title: "", artist: "", uri: "", id: "", image: "", preview: "" }
      },
    },
    playerNames: {
      [creatorId]: creatorId,
    },
    maxPlayers: 6,
    createdAt: Date.now(),
    gameState: "waiting",
    selectedPrompt: "",
    currentPlayerIndex: 0,
  });

  return roomCode;
};

export const joinRoom = async (roomCode: string, userId: string) => {
  const playersRef = ref(db, `rooms/${roomCode}/players`);
  const maxRef = ref(db, `rooms/${roomCode}/maxPlayers`);

  const [playersSnap, maxSnap] = await Promise.all([get(playersRef), get(maxRef)]);

  if (!playersSnap.exists() || !maxSnap.exists()) return { success:false, message:'Invalid code' };

  if (playersSnap.size < maxSnap.val()) {
    await set(ref(db, `rooms/${roomCode}/players/${userId}`), {
      name: userId,
      votes: 0,
      selectedSong: { title:'', artist:'', uri:'', id:'', image:'', preview:'' }
    });

  await set(ref(db, `rooms/${roomCode}/playerNames/${userId}`), userId);


    return { success:true, message:'Joined!' };
  }
  return { success:false, message:'Room full!' };
};

export const listenForRoomUpdates = (
  roomCode: string,
  callback: (data: { playerNames: { id: string; name: string }[]; gameState: string | null }) => void
) => {
  const playerNamesRef = ref(db, `rooms/${roomCode}/playerNames`);
  const gameStateRef = ref(db, `rooms/${roomCode}/gameState`);

  let latestPlayerNames: { id: string; name: string }[] = [];
  let latestGameState: string | null = null;

  const sendUpdate = () => {
    callback({
      playerNames: latestPlayerNames,
      gameState: latestGameState,
    });
  };

  const unsubNames = onValue(playerNamesRef, (snapshot) => {
    const val = snapshot.val();
    latestPlayerNames = val
      ? Object.entries(val).map(([id, name]: [string, any]) => ({ id, name }))
      : [];
    sendUpdate();
  });

  const unsubGameState = onValue(gameStateRef, (snapshot) => {
    latestGameState = snapshot.exists() ? snapshot.val() : null;
    sendUpdate();
  });

  return () => {
    unsubNames();
    unsubGameState();
  };
};


export const startGame = async (roomCode: string) => {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return { success: false, message: "Room not found." };
  }

  const roomData = snapshot.val();
  const playerCount = roomData.players ? Object.keys(roomData.players).length : 0;

  if (playerCount > 1) {
    await selectPrompt(roomCode);
    await update(roomRef, {
      gameState: "selectingSongs"
    });
    return { success: true };
  } else {
    return { success: false, message: "Not enough players to start." };
  }
};

// 💥 Delete the entire room from Firebase
export const deleteRoom = async (roomCode: string) => {
  try {
    await remove(ref(db, `rooms/${roomCode}`));
    console.log(`✅ Room ${roomCode} deleted`);
  } catch (err) {
    console.error(`❌ Failed to delete room ${roomCode}:`, err);
  }
};

// ❌ Remove a player from a room (e.g. on leave)
export const removePlayerFromRoom = async (roomCode: string, userId: string) => {
  try {
    await remove(ref(db, `rooms/${roomCode}/players/${userId}`));
    console.log(`✅ Player ${userId} removed from room ${roomCode}`);
  } catch (err) {
    console.error(`❌ Failed to remove player ${userId}:`, err);
  }
};

export const selectPrompt = async (roomCode: string) => {
  try {
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    await update(ref(db, `rooms/${roomCode}`), {
      selectedPrompt: prompt
    });
    return { success: true, prompt };
  } catch (error) {
    console.error("❌ Failed to select prompt:", error);
    return { success: false, message: "Could not set prompt. Try again." };
  }
};

export const selectSong = async (roomCode: string, userId: string, songData: any) => {
  if (!roomCode || !userId || !songData) {
    console.error("❌ Invalid input parameters:", { roomCode, userId, songData });
    return { success: false, message: "Invalid input parameters." };
  }

  try {
    const existsRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(existsRef);

    if (!snapshot.exists()) {
      console.error("❌ Room not found:", roomCode);
      return { success: false, message: "Room not found." };
    }

    // Now embed the song directly under the player
    await update(ref(db, `rooms/${roomCode}/players/${userId}`), {
      selectedSong: songData
    });

    return { success: true, message: "Song selected successfully!" };
  } catch (error) {
    console.error("🔥 Firebase error:", error);
    return { success: false, message: "Failed to save song." };
  }
};

export const pushToVotePage = async (roomCode: string) => {
  await update(ref(db, `rooms/${roomCode}`), {
    gameState: "voteSongs"
  });
};

export const updateCurrentPlayerIndex = async (roomCode: string, index: number) => {
  await update(ref(db, `rooms/${roomCode}`), {
    currentPlayerIndex: index
  });
};

export const listenForCurrentPlayerIndex = (roomCode: string, callback: (index: number) => void) => {
  const indexRef = ref(db, `rooms/${roomCode}/currentPlayerIndex`);
  return onValue(indexRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
};
