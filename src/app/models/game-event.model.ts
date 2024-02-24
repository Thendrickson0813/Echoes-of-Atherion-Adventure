export interface GameEvent {
    type: string;
    details: {
      characterName: string;
      itemName: string;
      // Add other details as needed
    };
  }