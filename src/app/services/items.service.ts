import { Injectable } from '@angular/core';
import { collection, query, where, getFirestore, getDocs, doc, updateDoc, getDoc, DocumentData } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { Item } from '../models/item';
import { Characters } from '../models/character';
import { GameBatchService, BatchUpdate } from './game-batch.service'; // Import GameBatchService
import { TextFeedService } from './text-feed.service';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private db = getFirestore();

  constructor(
    private textFeedService: TextFeedService,
    private gameBatchService: GameBatchService
    ) { }

  async getItemById(itemId: string): Promise<Item | null> {
    try {
      const itemRef = doc(this.db, 'items', itemId);
      const itemSnap = await getDoc(itemRef);
  
      if (itemSnap.exists()) {
        return { ...itemSnap.data(), id: itemSnap.id } as Item; // Make sure this matches your Item model
      } else {
        console.log(`Item with ID ${itemId} not found.`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      throw error;
    }
  }
  

  getItemsInRoom(roomLocation: string): Observable<Item[]> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
    return from(getDocs(itemsRef)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData; // Adjust to your data structure
          return {
            name: data['name'],
            description: data['description'],
            isPickedUp: data['isPickedUp'],
          } as Item;
        })
      )
    );
  }

  isItemInRoom(itemName: string, roomLocation: string): Observable<boolean> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
    return from(getDocs(itemsRef)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.some(docSnapshot => {
          const item = docSnapshot.data() as DocumentData; // Adjust to your data structure
          console.log(`isItemInRoom item name: ${itemName}`);
          return item['name'] === itemName && !item['isPickedUp'];
        })
      ),
      first() // Complete the observable after receiving the first value
    );
  }

  async pickUpItem(characterDocId: string, itemName: string, hand: 'leftHand' | 'rightHand', roomLocation: string): Promise<void> {
    try {
      console.log('Starting pickUpItem function...');

      // Convert the itemName to lowercase for a case-insensitive query
      const lowercaseItemName = itemName.toLowerCase();
      const itemsRef = query(collection(this.db, 'items'), where('name', '==', lowercaseItemName), where('location', '==', roomLocation));
      const querySnapshot = await getDocs(itemsRef);

      if (querySnapshot.empty) {
        throw new Error(`Item '${itemName}' not found in the room.`);
      }

      // Sort the items by your criteria (e.g., usage, amount left)
      const sortedItems = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort(/* your sorting function here */);

      const itemDoc = sortedItems[0];
      const itemDocId = itemDoc.id;

      const characterRef = doc(this.db, 'characters', characterDocId);
      const itemRef = doc(this.db, 'items', itemDocId);

      const [characterSnap, itemSnap] = await Promise.all([getDoc(characterRef), getDoc(itemRef)]);
      if (!characterSnap.exists()) {
        throw new Error('Character not found.');
      }
      if (!itemSnap.exists()) {
        throw new Error(`Item '${itemName}' not found.`);
      }

      const characterData = characterSnap.data() as Characters;
      const itemData = itemSnap.data() as DocumentData;
      if (characterData[hand] || itemData['isPickedUp']) {
        throw new Error('Cannot pick up the item: hand is full or the item is already picked up.');
      }

      // Prepare batch updates
    const updates: BatchUpdate[] = [
      {
        path: `characters/${characterDocId}`,
        data: { [hand]: itemDocId }
      },
      {
        path: `items/${itemDocId}`,
        data: { isPickedUp: true, owner: characterDocId }
      }
    ];

    // Perform the batch update
    await this.gameBatchService.performBatchUpdate(characterDocId, updates);

      console.log('Item picked up successfully.');
      this.textFeedService.addMessage(`You picked up the '${itemName}'.`);
    } catch (error) {
      console.error('Failed to pick up item:', error);
      this.textFeedService.addMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
}

async dropItem(characterDocId: string, itemName: string, hand: 'leftHand' | 'rightHand', roomLocation: string): Promise<void> {
  console.log('Attempting to drop item for character:', characterDocId);

  // Reference to the character document
  const characterRef = doc(this.db, 'characters', characterDocId);
  console.log('Fetching character document for ID:', characterDocId);

  // Get current data of the character
  const characterSnap = await getDoc(characterRef);
  if (!characterSnap.exists()) {
      console.error("Character document not found for ID:", characterDocId);
      throw new Error("Character not found.");
  }
  console.log('Character document found for ID:', characterDocId);

  const characterData = characterSnap.data() as Characters;
  const itemDocId = characterData[hand]; // The document ID of the item in the hand
  if (!itemDocId) {
      console.error(`No item in the ${hand} to drop for character ID:`, characterDocId);
      throw new Error(`No item in the ${hand} to drop.`);
  }

  // Reference to the item document
  const itemRef = doc(this.db, 'items', itemDocId);
  console.log(`Fetching item document for ID: ${itemDocId}`);

  // Get the item data
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists() || (itemSnap.data() as Item).name.toLowerCase() !== itemName.toLowerCase()) {
      console.error(`The item ${itemName} is not in your ${hand} or doesn't exist in the database.`);
      throw new Error(`The item ${itemName} is not in your ${hand}.`);
  }

  console.log(`Updating character and item documents for dropping item: ${itemName}`);
  
  // Prepare batch updates
  const updates: BatchUpdate[] = [
      {
          path: `characters/${characterDocId}`,
          data: { [hand]: null }
      },
      {
          path: `items/${itemDocId}`,
          data: { location: roomLocation, isPickedUp: false, owner: null }
      }
  ];

  // Perform the batch update
  await this.gameBatchService.performBatchUpdate(characterDocId, updates);

  this.textFeedService.addMessage(`You dropped the ${itemName}.`);
  console.log(`Item ${itemName} dropped successfully.`);
}





  // Add item-related methods here
}
