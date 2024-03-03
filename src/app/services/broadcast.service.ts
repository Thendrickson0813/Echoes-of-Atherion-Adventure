import { Injectable } from '@angular/core';
import { TextFeedService } from './text-feed.service';
import { DataFetchService } from './data-fetch.service';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  constructor(
    private textFeedService: TextFeedService,
    private dataFetchService: DataFetchService,
  ) {}

  async broadcastItemPickupEvent(itemId: string, characterId: string, roomLocation: string): Promise<void> {
    console.log("broadcastItemPickupEvent started, this is the start of the message getting displayed");
    try {
      // Fetch character name and item name
      const [characterName, itemData] = await Promise.all([
        this.dataFetchService.fetchCharacterNameByOwnerId(characterId),
        this.dataFetchService.getItemById(itemId)
      ]);
  
      console.log(`Character Name: ${characterName}, Item Data:`, itemData);
  
      if (!characterName || !itemData) {
        console.error('Character or item not found.');
        return;
      }
  
      // Fetch all characters in the room
      const charactersInRoom = await this.dataFetchService.getCharactersInRoom(roomLocation);
      console.log(`Characters in room (${roomLocation}):`, charactersInRoom);
  
      // Filter out the character who picked up the item
      const otherCharacters = charactersInRoom.filter(c => c.characterId !== characterId);
      console.log(`Other characters in room:`, otherCharacters);
  
      // Broadcast message to other characters
      otherCharacters.forEach(character => {
        const message = `${characterName} picked up ${itemData.name}.`;
        console.log(`Broadcasting message to character ${character.characterId}: ${message}`);
        this.textFeedService.addMessageToCharacter(character.characterId, message);
      });
  
    } catch (error) {
      console.error('Error in broadcastItemPickupEvent:', error);
    }
  }
}  