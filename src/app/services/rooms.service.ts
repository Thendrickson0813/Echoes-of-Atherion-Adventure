// rooms.service.ts
import { Injectable } from '@angular/core';
import { collection, query, where, getFirestore, getDocs, doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { Observable, from, Subscription } from 'rxjs'; import { TextFeedService } from './text-feed.service';
import { BehaviorSubject } from 'rxjs';
import { Room } from '../models/locations'; // Ensure this is the correct path
import { Item } from '../models/item';
import { DataFetchService } from './data-fetch.service';
import { Characters } from '../models/character';
import { ItemsService } from './items.service';
import { GameEvent } from '../models/game-event.model';
import { BroadcastService } from './broadcast.service';


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
  private unsubscribedisplayedRoomCharacters: (() => void) | null = null;
  private roomItemsSubscription: Subscription | null = null;
  private roomCharactersSubscription?: Subscription;



  private roomEventsSubject = new BehaviorSubject<GameEvent | null>(null);

  constructor(
    private textFeedService: TextFeedService,
    private itemsService: ItemsService,
    private dataFetchService: DataFetchService,
    private broadcastService: BroadcastService,
  ) { }


  private lastProcessedUpdates = new Map<string, number>();

  // This method subscribes to room items and processes them for a specific location.
  // It listens for item updates and filters out items that have been picked up.
  displayedRoomItems(roomLocation: string): void {
    console.log(`RoomService: Function displayedRoomItems is being called for room: ${roomLocation}`);
    // Logging the function call with the room location.
    this.roomItemsSubscription = this.dataFetchService.observeAndProcessRoomItems(roomLocation).subscribe({
      next: (itemsNotPickedUp) => {
        // Logging the processed items that are not picked up.
        console.log(`Processed items for room: ${roomLocation}`, itemsNotPickedUp);
        // Updating the BehaviorSubject with the filtered items.
        this.currentRoomItems.next(itemsNotPickedUp);
      },
      error: (error) => {
        // Logging any errors encountered during the subscription.
        console.error(`Error subscribing to processed items for room ${roomLocation}:`, error);
      }
    });
  }


  getRoomEvents(): Observable<GameEvent | null> {
    return this.roomEventsSubject.asObservable();
  }

  // This method updates the current location of the room and sets up listeners for the new location.
  async updateLocation(location: string): Promise<void> {
    // Check if the location has changed to perform cleanup tasks.
    if (this.currentLocation !== location) {
      // Unsubscribe from the current room's observables before updating to a new location.
      this.cleanupListeners();
    }
    // ... (fetching room details)
    const roomRef = query(collection(this.db, 'locations'), where('location', '==', location));
    const roomSnapshot = await getDocs(roomRef);

    if (!roomSnapshot.empty) {
      const roomData = roomSnapshot.docs[0].data() as Room;
      this.currentLocation = location;
      this.currentRoomName.next(roomData.name); // Update room name
      this.currentRoomDescription.next(roomData.description); // Update room description

      // Fetch items in the room and generate room entry message
      this.itemsService.getItemsInRoom(location).subscribe((items) => {
        const visibleItems = items.filter(item => !item.isPickedUp).map(item => `<span class="item-name">${item.name}</span>`).join(', ');
        const roomEntryMessage = `<div class="room-name-header">${roomData.name}</div><p class="feed-message">${roomData.description}${visibleItems.length > 0 ? ' You see ' + visibleItems : ''}</p>`;
        this.textFeedService.addMessage(roomEntryMessage);
      });

      // After fetching room details, reinitialize listeners for the new room.
      this.reinitializeListeners(location);
    } else {
      this.textFeedService.addMessage('You can\'t go that way.');
    }
  }

  // This method unsubscribes from current room observables to prevent memory leaks and unnecessary updates.
  cleanupListeners(): void {
    console.log('[RoomsService] CleanupListeners called');
    // Unsubscribing from room items if a subscription exists.
    if (this.roomItemsSubscription) {
      this.roomItemsSubscription.unsubscribe();
      this.roomItemsSubscription = null;
    }
    // Unsubscribing from room characters if a subscription exists.
    if (this.roomCharactersSubscription) {
      this.roomCharactersSubscription.unsubscribe();
      this.roomCharactersSubscription = undefined; // Set to undefined instead of null
    }
    // Additional cleanup tasks can be added here if needed.
  }

 // This method sets up new listeners for a given room location.
// It is called after changing rooms to listen to updates in the new room.
reinitializeListeners(newRoomLocation: string): void {
  // Logging the start of reinitialization for the new room location
  console.log(`[RoomsService] Reinitializing listeners for room: ${newRoomLocation}`);

  // Setting up a new subscription for room characters.
  // Using the observeRoomCharacters method from DataFetchService to get an Observable for room characters.
  this.roomCharactersSubscription = this.dataFetchService.observeRoomCharacters(newRoomLocation).subscribe({
    // When new character data is received for the room
    next: characters => {
      // Logging the characters received for the new room
      console.log(`[RoomsService] Characters in room ${newRoomLocation}:`, characters);
      // Updating the BehaviorSubject (currentRoomCharacters) with the new characters.
      // This will notify all subscribers about the updated characters in the room.
      this.currentRoomCharacters.next(characters);
    },
    // In case of an error during subscription
    error: error => {
      // Logging the error encountered while observing characters in the new room
      console.error(`[RoomsService] Error observing characters in room ${newRoomLocation}:`, error);
    }
  });

  // Setting up a new subscription for room items using the updated observeAndProcessRoomItems method.
  // This method observes room items and processes them (like filtering out picked up items).
  this.roomItemsSubscription = this.dataFetchService.observeAndProcessRoomItems(newRoomLocation).subscribe({
    // When new item data is received and processed for the room
    next: itemsNotPickedUp => {
      // Logging the processed items received for the new room
      console.log(`Processed items for room: ${newRoomLocation}`, itemsNotPickedUp);
      // Updating the BehaviorSubject (currentRoomItems) with the processed items.
      // This will notify all subscribers about the updated items in the room.
      this.currentRoomItems.next(itemsNotPickedUp);
    },
    // In case of an error during subscription
    error: error => {
      // Logging the error encountered while subscribing to processed items for the new room
      console.error(`Error subscribing to processed items for room ${newRoomLocation}:`, error);
    }
  });

  // Additional setup tasks for the new room...
  // Here you can add any other setup tasks needed when switching to a new room.
}


  // Checks if the given location is a valid room in the game world.
  async isValidRoom(location: string): Promise<boolean> {
    try {
      // Query Firestore to check if the room exists based on the location.
      const roomRef = query(collection(this.db, 'locations'), where('location', '==', location));
      const roomSnapshot = await getDocs(roomRef);
      // Return true if the room exists (i.e., the query returned documents).
      return !roomSnapshot.empty;
    } catch (error) {
      // Log and return false if an error occurs during the query.
      console.error(`Error in isValidRoom for location ${location}:`, error);
      return false;
    }
  }

  // Fetches which items a character is holding in their hands.
  async getCharacterHands(characterId: string): Promise<{ leftHand: string | null, rightHand: string | null }> {
    // Use DataFetchService to get the document ID for the character.
    const characterDocId = await this.dataFetchService.getDocumentIdByCharacterId(characterId);
    if (!characterDocId) {
      // Return null for both hands if the character document ID is not found.
      return { leftHand: null, rightHand: null };
    }
    // Retrieve the character's hand data from Firestore.
    return this.dataFetchService.getCharacterHandsData(characterDocId);
  }

  // Provides an Observable for the current room name, allowing components to react to changes.
  getRoomName(): Observable<string> {
    return this.currentRoomName.asObservable();
  }

  // Provides an Observable for the current room description, allowing components to react to changes.
  getRoomDescription(): Observable<string> {
    return this.currentRoomDescription.asObservable();
  }
  // Method to update room items based on location. This method is not used if using observeAndProcessRoomItems.
  updateRoomItems(location: string): void {
    console.log("updateRoomItems: Method called to update room items for location:", location);
    // Fetches items in the room and updates the BehaviorSubject with items that are not picked up.
    this.itemsService.getItemsInRoom(location).subscribe({
      next: (items) => {
        console.log("updateRoomItems: Received items from getItemsInRoom:", items);
        // Filter out items that are picked up.
        const itemsNotPickedUp = items.filter(item => !item.isPickedUp);
        console.log("updateRoomItems: Filtered items not picked up:", itemsNotPickedUp);

        // Update the BehaviorSubject with the filtered items.        
        this.currentRoomItems.next(itemsNotPickedUp);
        console.log("updateRoomItems: Updated currentRoomItems BehaviorSubject with items not picked up.");
      },
      error: (error) => {
        // Log any errors encountered while fetching items.
        console.error("updateRoomItems: Error fetching items for room", location, ":", error);
      }
    });
  }
  // This method returns an Observable for room items.
  // Components can subscribe to this Observable to get real-time updates on room items.
  getRoomItems(): Observable<Item[]> {
    return this.currentRoomItems.asObservable();
  }
  // This method returns an Observable for room characters.
  // Components can subscribe to this Observable to get real-time updates on characters in the room.
  getRoomCharacters(): Observable<Characters[]> {
    return this.currentRoomCharacters.asObservable();
  }

}