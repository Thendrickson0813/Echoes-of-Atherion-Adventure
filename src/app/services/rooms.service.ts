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
import { ItemsService } from './items.service';


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

  constructor(
    private textFeedService: TextFeedService,
    private itemsService: ItemsService
    ) { }

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
      this.itemsService.getItemsInRoom(location).subscribe((items) => {
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