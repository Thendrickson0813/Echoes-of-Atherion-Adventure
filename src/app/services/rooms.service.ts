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
  private unsubscribeDisplayedRoomItems: (() => void) | null = null;
  private unsubscribeDisplayingRoomCharacters: (() => void) | null = null;

  private roomEventsSubject = new BehaviorSubject<GameEvent | null>(null);

  constructor(
    private textFeedService: TextFeedService,
    private itemsService: ItemsService
  ) { }

  private unsubscribeFromRoomItems(): void {
    if (this.unsubscribeDisplayedRoomItems) {
      this.unsubscribeDisplayedRoomItems();
    }
  }

  private unsubscribeFromRoomCharacters(): void {
    if (this.unsubscribeDisplayingRoomCharacters) {
      this.unsubscribeDisplayingRoomCharacters();
    }
  }

  private lastProcessedUpdates = new Map<string, number>();
  private isNewUpdate(itemId: string, lastUpdated: Timestamp): boolean {
    const lastProcessedTime = this.lastProcessedUpdates.get(itemId);
    return !lastProcessedTime || lastUpdated.seconds > lastProcessedTime;
  }
  


  private async broadcastItemPickup(item: Item): Promise<void> {
    // Check if the item has an owner. If not, log an error and return.
    if (!item.owner) {
      console.error('Item owner not available.');
      return;
    }

    try {
      // Retrieve the Firestore instance for database operations.
      const firestore = getFirestore();

      // Create a reference to the document of the item's owner in the 'characters' collection.
      const ownerRef = doc(firestore, `characters/${item.owner}`);

      // Fetch the document snapshot for the owner from Firestore.
      const ownerSnap = await getDoc(ownerRef);

      // Check if the owner's document exists. If not, log an error and return.
      if (!ownerSnap.exists()) {
        console.error('Owner character not found.');
        return;
      }

      // Extract the owner's data from the document snapshot.
      const ownerData = ownerSnap.data();

      // Access the 'characterName' property from the owner's data.
      const characterName = ownerData['characterName'];

      // Construct a message indicating that the character has picked up the item.
      const message = `${characterName} picked up ${item.name}.`;

      // Use the textFeedService to add the message to the text feed.
      this.textFeedService.addMessage(message);

      // Log the message for debugging or informational purposes.
      console.log(message);

    } catch (error) {
      // If an error occurs (e.g., in fetching the document), log the error.
      console.error('Error fetching character name:', error);
    }
  }


  displayingRoomCharacters(roomLocation: string): void {
    const charactersRef = query(
      collection(this.db, 'characters'),
      where('location', '==', roomLocation),
      where('isOnline', '==', true) // Only get characters that are online
    );

    // Correctly assign the unsubscribe function
    this.unsubscribeDisplayingRoomCharacters = onSnapshot(charactersRef, (querySnapshot: QuerySnapshot) => {
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
      this.displayedRoomItems(location);
      console.log('RoomsService:Function Update Location Subscribing to Items using displayedRoomItems in RoomsService');
      this.displayingRoomCharacters(location);
      console.log('RoomsService: Function Update Location Subscribing to Rooma using displayingRoomCharacters in RoomsService');
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
    this.displayedRoomItems(roomLocation);
    console.log('Method subscribeToRoom using displayedRoomItems was called to subscribe to room');
    this.displayingRoomCharacters(roomLocation);
    console.log('RoomsService: Method subscribeToRoom using listenToRoom was called to subscribe to Characters');
  }

  // Method to unsubscribe from a room
  unsubscribeFromRoom(roomLocation: string): void {
    console.log(`RoomsService: unsubscribeFromRoom called for roomLocation: ${roomLocation}`);

    if (this.unsubscribeDisplayedRoomItems) {
      this.unsubscribeDisplayedRoomItems();
      console.log(`RoomsService: unsubscribeFromRoom - Unsubscribed from room items for roomLocation: ${roomLocation}`);
      this.unsubscribeDisplayedRoomItems = null;
      console.log(`RoomsService: Cleared unsubscribeDisplayedRoomItems reference for roomLocation: ${roomLocation}`);
    }

    if (this.unsubscribeDisplayingRoomCharacters) {
      this.unsubscribeDisplayingRoomCharacters();
      console.log(`RoomsService: unsubscribeFromRoom - Unsubscribed from room characters for roomLocation: ${roomLocation}`);
      this.unsubscribeDisplayingRoomCharacters = null;
      console.log(`RoomsService: Cleared unsubscribeDisplayingRoomCharacters reference for roomLocation: ${roomLocation}`);
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