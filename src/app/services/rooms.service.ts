// rooms.service.ts
import { Injectable } from '@angular/core';
import { serverTimestamp, collection, query, where, getFirestore, getDocs, doc, updateDoc, getDoc, onSnapshot, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { TextFeedService } from './text-feed.service';
import { BehaviorSubject } from 'rxjs';
import { Room } from '../models/locations'; // Ensure this is the correct path
import { Item } from '../models/item';
import { Characters } from '../models/character';
import { ItemsService } from './items.service';
import { GameEvent } from '../models/game-event.model';


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
  // Unsubscribe functions
  // Initialize unsubscribe functions to null and allow them to be null
  private unsubscribeRoomItems: (() => void) | null = null;
  private unsubscribeRoomCharacters: (() => void) | null = null;

  private roomEventsSubject = new BehaviorSubject<GameEvent | null>(null);

  constructor(
    private textFeedService: TextFeedService,
    private itemsService: ItemsService
  ) { }

  private unsubscribeFromRoomItems(): void {
    if (this.unsubscribeRoomItems) {
      this.unsubscribeRoomItems();
    }
  }

  private unsubscribeFromRoomCharacters(): void {
    if (this.unsubscribeRoomCharacters) {
      this.unsubscribeRoomCharacters();
    }
  }

  private lastProcessedUpdates = new Map<string, number>();
  private isNewUpdate(itemId: string, lastUpdated: Timestamp): boolean {
    const lastProcessedTime = this.lastProcessedUpdates.get(itemId);
    return !lastProcessedTime || lastUpdated.seconds > lastProcessedTime;
  }
  listenToRoomItems(roomLocation: string): void {
    console.log(`RoomService:Funtion listenToRoomItems is being called Listening to items in room: ${roomLocation}`);
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
  
    this.unsubscribeRoomItems = onSnapshot(itemsRef, (querySnapshot: QuerySnapshot) => {
      console.log(`Received query snapshot for room: ${roomLocation}`);
      const items: Item[] = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data() as Item;
        const itemId = doc.id; // Capture the document ID
        if (!item.isPickedUp) {
          items.push(item);
        } else if (item.lastUpdated && itemId && this.isNewUpdate(itemId, item.lastUpdated)) {
          // Ensure itemId is defined before calling isNewUpdate
          this.broadcastItemPickup(item);
        }
      });
      this.currentRoomItems.next(items);
    });
  }
  
  private async broadcastItemPickup(item: Item): Promise<void> {
    if (!item.owner) {
      console.error('Item owner not available.');
      return;
    }
  
    try {
      const firestore = getFirestore(); // Get Firestore instance
      const ownerRef = doc(firestore, `characters/${item.owner}`); // Use the obtained Firestore instance
      const ownerSnap = await getDoc(ownerRef);
  
      if (!ownerSnap.exists()) {
        console.error('Owner character not found.');
        return;
      }
  
      const ownerData = ownerSnap.data();
      const characterName = ownerData['characterName']; // Use bracket notation to access characterName
  
      const message = `${characterName} picked up ${item.name}.`;
      this.textFeedService.addMessage(message);
      console.log(message);
  
    } catch (error) {
      console.error('Error fetching character name:', error);
    }
  }
   

  listenToRoomCharacters(roomLocation: string): void {
    const charactersRef = query(
      collection(this.db, 'characters'),
      where('location', '==', roomLocation),
      where('isOnline', '==', true) // Only get characters that are online
    );

    // Correctly assign the unsubscribe function
    this.unsubscribeRoomCharacters = onSnapshot(charactersRef, (querySnapshot: QuerySnapshot) => {
      console.log('Characters snapshot received for location:', roomLocation);

      const characters: Characters[] = [];
      querySnapshot.forEach((doc) => {
        const character = doc.data() as Characters;
        characters.push(character);
      });
      this.currentRoomCharacters.next(characters);
      console.log('Updated characters:', characters);
    });
  }

  listenToRoomEvents(roomLocation: string): void {
    const eventsRef = collection(this.db, `locations/${roomLocation}/events`);
    console.log("Listening to room events for location:", roomLocation);
    // Set up your Firestore listener here...
    onSnapshot(eventsRef, (snapshot) => {
      console.log("Snapshot received:", snapshot);
      snapshot.docChanges().forEach((change) => {
        console.log("Document change:", change);
        if (change.type === 'added') {
          const gameEvent = change.doc.data() as GameEvent;
          console.log("New game event:", gameEvent);
          this.roomEventsSubject.next(gameEvent);
        }
      });
    });
  }

  getRoomEvents(): Observable<GameEvent | null> {
    return this.roomEventsSubject.asObservable();
  }
  async updateLocation(location: string): Promise<void> {
  // Unsubscribe from the current room's items and characters if the location is changing
  if (this.currentLocation !== location) {
    this.cleanupListeners();
  }

  const roomRef = query(collection(this.db, 'locations'), where('location', '==', location));
  const roomSnapshot = await getDocs(roomRef);

  if (!roomSnapshot.empty) {
    const roomData = roomSnapshot.docs[0].data() as Room;
    this.currentLocation = location;
    this.currentRoomName.next(roomData.name); // Update room name
    this.currentRoomDescription.next(roomData.description); // Update room description

    // Fetch items in the room
    this.itemsService.getItemsInRoom(location).subscribe((items) => {
      const visibleItems = items.filter(item => !item.isPickedUp).map(item => `<span class="item-name">${item.name}</span>`).join(', ');
      const roomEntryMessage = `<div class="room-name-header">${roomData.name}</div><p class="feed-message"> ${roomData.description}${visibleItems.length > 0 ? ' You see ' + visibleItems : ''}</p>`;
      this.textFeedService.addMessage(roomEntryMessage);
    });

    // Subscribe to the new room's items and characters
    this.listenToRoomItems(location);
    console.log('RoomsService:Function Update Location Subscribing to Items using listenToRoomItems in RoomsService');
    this.listenToRoomCharacters(location);
    console.log('RoomsService: Function Update Location Subscribing to Rooma using listenToRoomCharacters in RoomsService');
  } else {
    this.textFeedService.addMessage('You can\'t go that way.');
  }
}

  cleanupListeners() {
    console.log('CleanupListeners');
    this.unsubscribeFromRoomItems();
    console.log('unsubscribeFromRoomItems');
    this.unsubscribeFromRoomCharacters();
    console.log('unsubscribeFromRoomCharacters');

  }

  // Method to subscribe to a room
  subscribeToRoom(roomLocation: string): void {
    console.log('RoomsService: Method subscribeToRoom was called')
    this.listenToRoomItems(roomLocation);
    console.log('Method subscribeToRoom using listenToRoomItems was called to subscribe to room');
    this.listenToRoomCharacters(roomLocation);
    console.log('RoomsService: Method subscribeToRoom using listenToRoom was called to subscribe to Characters');
  }

 // Method to unsubscribe from a room
unsubscribeFromRoom(roomLocation: string): void {
  console.log(`RoomsService: unsubscribeFromRoom called for roomLocation: ${roomLocation}`);

  if (this.unsubscribeRoomItems) {
    this.unsubscribeRoomItems();
    console.log(`RoomsService: unsubscribeFromRoom - Unsubscribed from room items for roomLocation: ${roomLocation}`);
    this.unsubscribeRoomItems = null;
    console.log(`RoomsService: Cleared unsubscribeRoomItems reference for roomLocation: ${roomLocation}`);
  }

  if (this.unsubscribeRoomCharacters) {
    this.unsubscribeRoomCharacters();
    console.log(`RoomsService: unsubscribeFromRoom - Unsubscribed from room characters for roomLocation: ${roomLocation}`);
    this.unsubscribeRoomCharacters = null;
    console.log(`RoomsService: Cleared unsubscribeRoomCharacters reference for roomLocation: ${roomLocation}`);
  }
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

  // New method to get the document ID by characterId
  async getDocumentIdByCharacterId(characterId: string): Promise<string | null> {
    const characterQuery = query(collection(this.db, 'characters'), where('characterId', '==', characterId));
    const querySnapshot = await getDocs(characterQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id; // Return the first document's ID
    }
    return null; // Return null if no document found
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

  
  getRoomName(): Observable<string> {
    return this.currentRoomName.asObservable();
  }

  getRoomDescription(): Observable<string> {
    return this.currentRoomDescription.asObservable();
  }
  // Method to update room items
  updateRoomItems(location: string): void {
    this.itemsService.getItemsInRoom(location).subscribe(items => {
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