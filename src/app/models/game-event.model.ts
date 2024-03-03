export interface GameEvent {
  type: string;
  details: {
    characterId: string;
    itemId: string;
    itemName: string;
    characterName?: string; // Make this optional if it's not guaranteed to be present
  };
  timestamp: any; // You can use firebase.firestore.Timestamp type if needed

  location?: string; // Make this optional if it's not guaranteed to be present
}
