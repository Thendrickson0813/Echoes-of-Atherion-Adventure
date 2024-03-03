import { Injectable } from '@angular/core';
import { serverTimestamp, collection, query, where, getFirestore, addDoc, getDocs, doc, updateDoc, getDoc, DocumentData } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { Item } from '../models/item';
import { GameBatchService, BatchUpdate } from './game-batch.service'; // Import GameBatchService
import { TextFeedService } from './text-feed.service';
import { DataFetchService } from './data-fetch.service';
import { BroadcastService } from './broadcast.service';
import { GameEventsService } from './game-events.service';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private db = getFirestore();


  constructor(
    private textFeedService: TextFeedService,
    private gameBatchService: GameBatchService,
    private dataFetchService: DataFetchService,
    private broadcastService: BroadcastService,
    private gameEventsService: GameEventsService,

  ) { }


  async getItemById(itemId: string): Promise<Item | null> {
    return this.dataFetchService.getItemById(itemId);
  }


  getItemsInRoom(roomLocation: string): Observable<Item[]> {
    console.log("get item in room called");

    // Delegating the task to DataFetchService
    return this.dataFetchService.getItemsInRoom(roomLocation);
  }

  isItemInRoom(itemName: string, roomLocation: string): Observable<boolean> {
    console.log("is item in room called");
    // Delegating the task to DataFetchService
    return this.dataFetchService.isItemInRoom(itemName, roomLocation);
  }

  async pickUpItem(characterId: string, itemName: string, hand: 'leftHand' | 'rightHand', roomLocation: string): Promise<void> {
    console.log("pickUpItem is called, this updates the database");

    try {
      // Fetch item data
      const itemResult = await this.dataFetchService.getItemByQuery([
        where('name', '==', itemName.toLowerCase()),
        where('location', '==', roomLocation)
      ]);
      if (!itemResult) {
        throw new Error(`Item '${itemName}' not found.`);
      }
      const { itemData, itemDocId } = itemResult;

      // Fetch character data using character ID
      const characterResult = await this.dataFetchService.getCharacterById(characterId);
      if (!characterResult) {
        throw new Error('Character not found.');
      }
      const { characterData, characterDocId } = characterResult;

      // Validate item and character data
      if (itemData.isPickedUp) {
        throw new Error(`Item '${itemName}' already picked up.`);
      }
      if (characterData[hand]) {
        throw new Error('Hand is full.');
      }

      // Prepare batch updates
      const updates: BatchUpdate[] = [
        {
          path: `characters/${characterDocId}`,
          data: { [hand]: itemDocId }
        },
        {
          path: `items/${itemDocId}`,
          data: {
            isPickedUp: true,
            owner: characterDocId,
            lastUpdated: serverTimestamp()
          }
        }
      ];

      // Perform the batch update
      await this.gameBatchService.performBatchUpdate(characterDocId, updates);
      console.log('Item picked up successfully.');

      // Create Game event (creates an event in database)
      this.gameEventsService.createGameEvent('itemPickup', { itemId: itemDocId, characterId: characterId }, roomLocation);


    } catch (error) {
      console.error('Failed to pick up item:', error);
      this.textFeedService.addMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }




  async dropItem(characterDocId: string, itemName: string, hand: 'leftHand' | 'rightHand', roomLocation: string): Promise<void> {
    console.log('Attempting to drop item for character:', characterDocId);

    // Fetch character data
    const characterResult = await this.dataFetchService.getCharacterById(characterDocId);
    if (!characterResult) {
      throw new Error("Character not found.");
    }
    const { characterData, characterDocId: fetchedCharacterDocId } = characterResult;

    // Get the item document ID from the character's hand
    const itemDocId = characterData[hand];
    if (!itemDocId) {
      throw new Error(`No item in the ${hand} to drop.`);
    }

    // Fetch item data
    const itemData = await this.dataFetchService.getItemById(itemDocId);
    if (!itemData || itemData.name.toLowerCase() !== itemName.toLowerCase()) {
      throw new Error(`The item ${itemName} is not in your ${hand}.`);
    }

    // Prepare batch updates
    const updates: BatchUpdate[] = [
      {
        path: `characters/${fetchedCharacterDocId}`,
        data: { [hand]: null }
      },
      {
        path: `items/${itemDocId}`,
        data: { location: roomLocation, isPickedUp: false, owner: null }
      }
    ];

    // Perform the batch update
    await this.gameBatchService.performBatchUpdate(fetchedCharacterDocId, updates);

    this.textFeedService.addMessage(`You dropped the ${itemName}.`);
    console.log(`Item ${itemName} dropped successfully.`);
  }
  // Add item-related methods here
}
