import { 
  createRoom, 
  joinRoom, 
  getCreatorId, 
  startGame, 
  deleteRoom, 
  removePlayerFromRoom, 
  listenForRoomUpdates, 
  selectSong, 
  selectPrompt,
  pushToVotePage,
  updateCurrentPlayerIndex, 
  listenForCurrentPlayerIndex
} from "./firebaseCommands";

class FirebaseAdmin {
  /** Create a room and handle any additional app logic */
  static async createRoom(username: string) {
    if (!username) {
      throw new Error("Username is required to create a room");
    }
    // Call the low-level command to create the room in DB
    const roomCode = await createRoom(username);
    // (Additional logic like analytics or in-app state updates could go here)
    return roomCode;
  }

  /** Join a room with given code and user, with extra validation */
  static async joinRoom(roomCode: string, userId: string) {
    if (!roomCode || !userId) {
      throw new Error("Room code and userId are required");
    }
    // Use the command to attempt joining the room
    const result = await joinRoom(roomCode, userId);
    // (You could add logic to, say, cache the current room or handle errors)
    return result;
  }

  /** Get the creator ID for a room */
  static async getCreatorId(roomCode: string) {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    return await getCreatorId(roomCode);
  }

  /** Listen to real-time room updates */
  static listenForRoomUpdates(
    roomCode: string,
    callback: (data: { playerNames: { id: string; name: string }[]; gameState: string | null }) => void
  ): () => void {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    return listenForRoomUpdates(roomCode, callback);
  }

  /** Start the game if conditions are met */
  static async startGame(roomCode: string) {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    const result = await startGame(roomCode);
    return result;
  }
 
  /** Save the selected song for a user */
  static async selectSong(roomCode: string, userId: string, song: any) {
    if (!roomCode || !userId || !song) {
      throw new Error("Room code, userId, and song data are required");
    }
    const result = await selectSong(roomCode, userId, song);
    return result;
  }

  /** Select a random prompt for the room */
  static async selectPrompt(roomCode: string) {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    const result = await selectPrompt(roomCode);
    return result;
  }

  /** Transition game state to voting phase */
  static async pushToVotePage(roomCode: string) {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    await pushToVotePage(roomCode);
    return { success: true };
  }

  /** Update the current player index */
  static async updateCurrentPlayerIndex(roomCode: string, index: number) {
    if (!roomCode || index < 0) {
      throw new Error("Room code is required and index must be non-negative");
    }
    await updateCurrentPlayerIndex(roomCode, index);
    return { success: true };
  }

  /** Listen for current player index changes */
  static listenForCurrentPlayerIndex(
    roomCode: string,
    callback: (index: number) => void
  ): () => void {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    return listenForCurrentPlayerIndex(roomCode, callback);
  }

  /** Delete the entire room from Firebase */
  static async deleteRoom(roomCode: string) {
    if (!roomCode) {
      throw new Error("Room code is required");
    }
    await deleteRoom(roomCode);
    return { success: true, message: `Room ${roomCode} deleted successfully` };
  }

  /** Remove a specific player from a room */
  static async removePlayerFromRoom(roomCode: string, userId: string) {
    if (!roomCode || !userId) {
      throw new Error("Room code and userId are required");
    }
    await removePlayerFromRoom(roomCode, userId);
    return { success: true, message: `Player ${userId} removed from room ${roomCode}` };
  }

  // === UTILITY METHODS ===

  /** Validate room code format */
  static isValidRoomCode(roomCode: string): boolean {
    return /^[A-Z0-9]{4}$/.test(roomCode);
  }

  /** Check if user is room creator */
  static async isRoomCreator(roomCode: string, userId: string): Promise<boolean> {
    try {
      const creatorId = await this.getCreatorId(roomCode);
      return creatorId === userId;
    } catch (error) {
      console.error("Error checking room creator:", error);
      return false;
    }
  }

  /** Batch operations helper for room cleanup */
  static async cleanupRoom(roomCode: string, creatorId: string) {
    if (!await this.isRoomCreator(roomCode, creatorId)) {
      throw new Error("Only room creator can cleanup the room");
    }
    
    try {
      await this.deleteRoom(roomCode);
      return { success: true, message: "Room cleaned up successfully" };
    } catch (error) {
      console.error("Error during room cleanup:", error);
      return { success: false, message: "Failed to cleanup room" };
    }
  }

  /** Get room statistics (useful for debugging/monitoring) */
  static async getRoomStats(roomCode: string) {
    // This would require additional queries, but shows the pattern
    // You could extend this based on your needs
    return {
      roomCode,
      createdAt: Date.now(), // You'd fetch this from the room data
      // Add more stats as needed
    };
  }
}

export default FirebaseAdmin;

// Export a singleton instance for use in the app if needed
export const firebaseAdmin = FirebaseAdmin;