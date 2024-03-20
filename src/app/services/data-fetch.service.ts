import { Injectable } from '@angular/core';
import { onSnapshot, collection, query, where, getFirestore, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Observable, from, of } from 'rxjs';
import { map, first, catchError } from 'rxjs/operators';
import { Item } from '../models/item';
import { Characters } from '../models/character';

@Injectable({
  providedIn: 'root'
})
export class DataFetchService {
  private db = getFirestore();
  private lastProcessedUpdates = new Map<string, number>();

  isNewUpdate(itemId: string, lastUpdated: Timestamp): boolean {
    const lastProcessedTime = this.lastProcessedUpdates.get(itemId);
    if (lastUpdated && lastUpdated.seconds) {
      return !lastProcessedTime || lastUpdated.seconds > lastProcessedTime;
    }
    return false;
  }

  constructor() { }
  

  async fetchCharacterNameByDocumentId(docId: string): Promise<string | null> {
    console.log(`fetchCharacterNameByDocumentId: Fetching character name for document ID: ${docId}`);
    try {
      const characterRef = doc(this.db, `characters/${docId}`);
      const characterSnap = await getDoc(characterRef);
  
      if (characterSnap.exists()) {
        const characterData = characterSnap.data();
        console.log(`fetchCharacterNameByDocumentId: Found character. Name: ${characterData['characterName']}`);
        return characterData['characterName'] ?? null;
      } else {
        console.error(`fetchCharacterNameByDocumentId: Character not found for document ID: ${docId}`);
        return null;
      }
    } catch (error) {
      console.error('fetchCharacterNameByDocumentId: Error fetching character name:', error);
      return null;
    }
  }
  
  observeRoomItems(roomLocation: string): Observable<Item[]> {
        console.log(`observeRoomItems: Observing room items for location: ${roomLocation}`);
  
    return new Observable<Item[]>(observer => {
      const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
  
      const unsubscribe = onSnapshot(itemsRef, (querySnapshot) => {
        const items: Item[] = [];
  
        querySnapshot.forEach((doc) => {
          console.log(`observeRoomItems: Processing document: `, doc.data());
          const item = doc.data() as Item;
          

          if (!item.isPickedUp) {
          
            items.push(item);
          }
        });
  
       
        observer.next(items);
      }, error => {
        console.error(`observeRoomItems: Error in onSnapshot:`, error);
        observer.error(error);
      });
  
      // Log the cleanup action
      return () => {
        console.log(`observeRoomItems: Unsubscribing from observing room items.`);
        unsubscribe();
      };
    });
  }
  
  observeAndProcessRoomItems(roomLocation: string): Observable<Item[]> {
    return this.observeRoomItems(roomLocation).pipe(
      map(items => {
        items.forEach(item => {
          if (item.id && item.isPickedUp && item.lastUpdated && this.isNewUpdate(item.id, item.lastUpdated)) {
            console.log(`Item pickup detected. Item ID: ${item.id}, broadcasting pickup.`);
            // Update last processed update
            if (item.lastUpdated.seconds) {
              this.lastProcessedUpdates.set(item.id, item.lastUpdated.seconds);
            }
            // Handle broadcasting here or call another service
          }
        });
        return items.filter(item => !item.isPickedUp);
      }),
      catchError(error => {
        console.error(`Error processing items for room ${roomLocation}:`, error);
        return of([]); // Return an empty array on error
      })
    );
  }
  
  async fetchCharacterNameByOwnerId(ownerId: string): Promise<string | null> {
    console.log(`fetchCharacterNameByOwnerId: Fetching character name for ownerId: ${ownerId}`);
    try {
        const ownerRef = doc(this.db, `characters/${ownerId}`);
        const ownerSnap = await getDoc(ownerRef);

        if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            console.log(`fetchCharacterNameByOwnerId: Found owner character. Name: ${ownerData['characterName']}`);
            return ownerData['characterName'] ?? null;
        } else {
            console.error(`fetchCharacterNameByOwnerId: Owner character not found for ownerId: ${ownerId}`);
            return null;
        }
    } catch (error) {
        console.error('fetchCharacterNameByOwnerId: Error fetching character name:', error);
        return null;
    }
}

  
   // Method to get the document ID by characterId
   async getDocumentIdByCharacterId(characterId: string): Promise<string | null> {
    const characterQuery = query(collection(this.db, 'characters'), where('characterId', '==', characterId));
    const querySnapshot = await getDocs(characterQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id; // Return the first document's ID
    }
    return null; // Return null if no document found
  }

  async getCharacterHandsData(characterDocId: string): Promise<{ leftHand: string | null, rightHand: string | null }> {
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

  // Method to observe characters in a room
observeRoomCharacters(roomLocation: string): Observable<Characters[]> {
  // Returning a new Observable that emits an array of Characters.
  return new Observable<Characters[]>(observer => {
    // Creating a Firestore query to fetch characters who are in the specified room and online.
    const charactersRef = query(
      collection(this.db, 'characters'), // Targeting the 'characters' collection in Firestore.
      where('location', '==', roomLocation), // Filtering characters who are in the given room location.
      where('isOnline', '==', true) // Further filtering to get only those characters who are marked as online.
    );

    // Setting up a real-time listener (onSnapshot) on the query.
    // This listener will be triggered whenever there is a change in the query's result (i.e., characters in the specified room).
    const unsubscribe = onSnapshot(charactersRef, (querySnapshot) => {
      const characters: Characters[] = []; // Initializing an empty array to store the characters' data.

      // Iterating over each document in the querySnapshot.
      querySnapshot.forEach(doc => {
        // Pushing the character data into the characters array.
        characters.push(doc.data() as Characters);
      });

      // Emitting the array of characters through the Observable.
      // Subscribers of this Observable will receive this array.
      observer.next(characters);
    }, observer.error); // Handling errors, if any, during the snapshot observation.

    // Returning a cleanup function.
    // This function is called when the Observable is unsubscribed.
    // It's responsible for removing the Firestore real-time listener to prevent memory leaks.
    return unsubscribe;
  });
}


   async getItemById(itemId: string): Promise<Item | null> {
    try {
      const itemRef = doc(this.db, 'items', itemId);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        return { ...itemSnap.data(), id: itemSnap.id } as Item;
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
      map(querySnapshot =>
        querySnapshot.docs.map(docSnapshot => docSnapshot.data() as Item)
      )
    );
  }

  isItemInRoom(itemName: string, roomLocation: string): Observable<boolean> {
    console.log(`isItemInRoom: Checking if item '${itemName}' is in room '${roomLocation}'`);
  
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation), where('name', '==', itemName));
    console.log(`isItemInRoom: Query created for itemsRef`);
  
    return from(getDocs(itemsRef)).pipe(
      map(querySnapshot => {
        console.log(`isItemInRoom: Received querySnapshot with ${querySnapshot.size} documents`);
        
        const isItemAvailable = querySnapshot.docs.some(docSnapshot => {
          const item = docSnapshot.data() as Item;
          console.log(`isItemInRoom: Processing item - Name: ${item.name}, isPickedUp: ${item.isPickedUp}`);
          
          return !item.isPickedUp;
        });
        console.log(`isItemInRoom: Item '${itemName}' in room '${roomLocation}' is available: ${isItemAvailable}`);
        return isItemAvailable;
      }),
      first()
    );
  }
  
  async getItemByQuery(queryCriteria: any): Promise<{ itemData: Item, itemDocId: string } | null> {
    const itemsRef = query(collection(this.db, 'items'), ...queryCriteria);
    const querySnapshot = await getDocs(itemsRef);
    if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        return {
            itemData: docSnapshot.data() as Item,
            itemDocId: docSnapshot.id
        };
    }
    return null;
  }

  async getCharacterById(characterId: string): Promise<{ characterData: Characters, characterDocId: string } | null> {
    const characterRef = doc(this.db, 'characters', characterId);
    const characterSnap = await getDoc(characterRef);
    if (characterSnap.exists()) {
        return {
            characterData: characterSnap.data() as Characters,
            characterDocId: characterSnap.id
        };
    }
    return null;
  }

  async getCharactersInRoom(roomLocation: string): Promise<Characters[]> {
    const charactersRef = query(collection(this.db, 'characters'), where('location', '==', roomLocation));
    const snapshot = await getDocs(charactersRef);
    return snapshot.docs.map(doc => doc.data() as Characters);
  }

 
  
  async fetchItemNameById(itemId: string): Promise<string | null> {
    console.log(`fetchItemNameById: Fetching item name for itemId: ${itemId}`);
    try {
        const itemRef = doc(this.db, `items/${itemId}`);
        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
            const itemData = itemSnap.data();
            console.log(`fetchItemNameById: Found item. Name: ${itemData['name']}`);
            return itemData['name'] ?? null;
        } else {
            console.error(`fetchItemNameById: Item not found for itemId: ${itemId}`);
            return null;
        }
    } catch (error) {
        console.error('fetchItemNameById: Error fetching item name:', error);
        return null;
    }
}


}