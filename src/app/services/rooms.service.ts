import { Injectable } from '@angular/core';
import { collection, query, where, getFirestore, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { TextFeedService } from './text-feed.service';
import { BehaviorSubject } from 'rxjs';
import { Room } from '../models/locations'; // Ensure this is the correct path
import { Item } from '../models/item';
import { Characters } from '../models/character';
import { onSnapshot, QuerySnapshot } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  private db = getFirestore();
  private currentLocation: string = '';
  private currentRoomName = new BehaviorSubject<string>('');
  private currentRoomDescription = new BehaviorSubject<string>('');
  private currentRoomItems = new BehaviorSubject<Item[]>([]);
  private currentRoomCharacters = new BehaviorSubject<Characters[]>([]);

  constructor(private textFeedService: TextFeedService) { }

  listenToRoomItems(roomLocation: string): void {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));

    onSnapshot(itemsRef, (querySnapshot: QuerySnapshot) => {
      const items: Item[] = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data() as Item;
        if (!item.isPickedUp) {
          items.push(item);
        }
      });
      this.currentRoomItems.next(items);
    });
  }
  listenToRoomCharacters(roomLocation: string): void {
    const charactersRef = query(collection(this.db, 'characters'), where('location', '==', roomLocation));

    onSnapshot(charactersRef, (querySnapshot: QuerySnapshot) => {
      const characters: Characters[] = [];
      querySnapshot.forEach((doc) => {
        const character = doc.data() as Characters;
        characters.push(character);
      });
      this.currentRoomCharacters.next(characters);
    });
  }
  async updateLocation(location: string): Promise<void> {
    if (this.currentLocation === location) {
      this.listenToRoomItems(location);
      this.listenToRoomCharacters(location);
      console.log('RoomsService: Location is the same as current. No update needed.');
      return;
    }

    const roomRef = query(collection(this.db, 'locations'), where('location', '==', location));
    const roomSnapshot = await getDocs(roomRef);

    if (!roomSnapshot.empty) {
      const roomData = roomSnapshot.docs[0].data() as Room;
      this.currentLocation = location;
      this.currentRoomName.next(roomData.name); // Update room name
      this.currentRoomDescription.next(roomData.description); // Update room description
      // Fetch items in the room
      this.getItemsInRoom(location).subscribe((items) => {
        const visibleItems = items.filter(item => !item.isPickedUp).map(item => `<span class="item-name">${item.name}</span>`).join(', ');

        // Format room entry message with room name, description, and visible items
        const roomEntryMessage = `<div class="room-name-header">${roomData.name}</div><p class="feed-message"> ${roomData.description}${visibleItems.length > 0 ? ' You see ' + visibleItems : ''}</p>`;
        this.textFeedService.addMessage(roomEntryMessage);
      });
    } else {
      this.textFeedService.addMessage('You can\'t go that way.');
    }
    this.listenToRoomItems(location);
  }

  async isValidRoom(location: string): Promise<boolean> {
    try {
      const roomRef = query(collection(this.db, 'locations'), where('location', '==', location));
      const roomSnapshot = await getDocs(roomRef);
      return !roomSnapshot.empty;
    } catch (error) {
      console.error(`Error in isValidRoom for location ${location}:`, error);
      return false;
    }
  }
  isItemInRoom(itemName: string, roomLocation: string): Observable<boolean> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
    return from(getDocs(itemsRef)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.some(docSnapshot => {
          const item = docSnapshot.data();
          return item['name'] === itemName && !item['isPickedUp'];
        })
      ),
      first() // Complete the observable after receiving the first value
    );
  }

  getItemsInRoom(roomLocation: string): Observable<Item[]> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
    return from(getDocs(itemsRef)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            name: data['name'],
            description: data['description'],
            isPickedUp: data['isPickedUp'],
          } as Item;
        })
      )
    );
  }

  // New method to get the document ID by characterId
  async getDocumentIdByCharacterId(characterId: string): Promise<string | null> {
    const characterQuery = query(collection(this.db, 'characters'), where('characterId', '==', characterId));
    const querySnapshot = await getDocs(characterQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id; // Return the first document's ID
    }
    return null; // Return null if no document found
  }

  // Method to pick up an item
  async pickUpItem(characterDocId: string, itemId: string, hand: 'leftHand' | 'rightHand'): Promise<void> {
    const characterRef = doc(this.db, 'characters', characterDocId);
    const itemRef = doc(this.db, 'items', itemId);

    console.log("Character Document ID:", characterDocId); // Debugging

    const characterSnap = await getDoc(characterRef);
    const itemSnap = await getDoc(itemRef);

    console.log("Character Snapshot Exists:", characterSnap.exists()); // Debugging
    console.log("Item Snapshot Exists:", itemSnap.exists()); // Debugging

    if (characterSnap.exists() && itemSnap.exists()) {
      const characterData = characterSnap.data() as Characters;
      const itemData = itemSnap.data();

      console.log("Character Data:", characterData); // Debugging
      console.log("Item Data:", itemData); // Debugging
      console.log("Hand to use:", hand); // Debugging
      console.log("Is hand empty?", !characterData[hand]); // Debugging
      console.log("Is item picked up?", !itemData['isPickedUp']); // Debugging

      if (!characterData[hand] && !itemData['isPickedUp']) {
        await updateDoc(characterRef, { [hand]: itemId });
        await updateDoc(itemRef, { isPickedUp: true, owner: characterDocId });

        this.textFeedService.addMessage(`You picked up the ${itemData['name']}.`);
      } else {
        this.textFeedService.addMessage(`Your hands are full or the item is not available.`);
      }
    } else {
      this.textFeedService.addMessage(`Character or item not found.`);
    }
  }

  async getCharacterHands(characterId: string): Promise<{ leftHand: string | null, rightHand: string | null }> {
    const characterDocId = await this.getDocumentIdByCharacterId(characterId);
    if (!characterDocId) {
      return { leftHand: null, rightHand: null };
    }

    const characterRef = doc(this.db, 'characters', characterDocId);
    const characterSnap = await getDoc(characterRef);

    if (characterSnap.exists()) {
      const characterData = characterSnap.data() as Characters;
      return {
        leftHand: characterData.leftHand !== undefined ? characterData.leftHand : null,
        rightHand: characterData.rightHand !== undefined ? characterData.rightHand : null
      };
    }

    return { leftHand: null, rightHand: null };
  }

  async dropItem(characterDocId: string, hand: 'leftHand' | 'rightHand', roomLocation: string): Promise<void> {
    // Reference to the character document
    const characterRef = doc(this.db, 'characters', characterDocId);

    // Get current data of the character
    const characterSnap = await getDoc(characterRef);
    if (!characterSnap.exists()) {
      throw new Error("Character not found.");
    }

    const characterData = characterSnap.data() as Characters;
    const itemId = characterData[hand];
    if (!itemId) {
      throw new Error("No item in the specified hand.");
    }

    // Reference to the item document
    const itemRef = doc(this.db, 'items', itemId);

    // Update the character document to remove the item from the hand
    await updateDoc(characterRef, { [hand]: null });

    // Update the item document to set its new location and clear the owner
    await updateDoc(itemRef, { location: roomLocation, isPickedUp: false, owner: null });

    this.textFeedService.addMessage(`You dropped the item.`);
  }

  getRoomName(): Observable<string> {
    return this.currentRoomName.asObservable();
  }

  getRoomDescription(): Observable<string> {
    return this.currentRoomDescription.asObservable();
  }
  // Method to update room items
  updateRoomItems(location: string): void {
    this.getItemsInRoom(location).subscribe(items => {
      this.currentRoomItems.next(items.filter(item => !item.isPickedUp));
    });
  }
  // Getter for room items Observable
  getRoomItems(): Observable<Item[]> {
    return this.currentRoomItems.asObservable();
  }
  // Getter for room characters Observable
  getRoomCharacters(): Observable<Characters[]> {
    return this.currentRoomCharacters.asObservable();
  }
}