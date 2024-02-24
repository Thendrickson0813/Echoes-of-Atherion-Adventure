import { Injectable } from '@angular/core';
import { RoomsService } from './rooms.service';
import { TextFeedService } from './text-feed.service';

@Injectable({
  providedIn: 'root'
})
export class GameDisplayService {

  constructor(
    private roomsService: RoomsService, 
    private textFeedService: TextFeedService
  ) { }

  displayedRoomItems(roomLocation: string): void {
    // Logging that the function has been called and is listening to items in the specified room.
    console.log(`RoomService: Function displayedRoomItems is being called. Listening to items in room: ${roomLocation}`);

    // Creating a Firestore query to get all items in the specified room location.
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));

    // Setting up a real-time listener (onSnapshot) for the query. This will update whenever the query results change.
    this.unsubscribeDisplayedRoomItems = onSnapshot(itemsRef, (querySnapshot: QuerySnapshot) => {
      // Logging that new data has been received for the room.
      console.log(`Received query snapshot for room: ${roomLocation}`);

      // An array to hold the items that will be gathered from the snapshot.
      const items: Item[] = [];

      // Iterating over each document in the snapshot.
      querySnapshot.forEach((doc) => {
        // Converting the document data to an Item object.
        const item = doc.data() as Item;

        // Capturing the document ID (which represents the itemId).
        const itemId = doc.id;

        // Checking if the item has not been picked up. If so, add it to the items array.
        if (!item.isPickedUp) {
          items.push(item);
        }
        // If the item has been picked up and it's a new update, broadcast the item pickup.
        else if (item.lastUpdated && itemId && this.isNewUpdate(itemId, item.lastUpdated)) {
          // Broadcasting the item pickup to all subscribers.
          this.broadcastItemPickup(item);
        }
      });

      // Updating the BehaviorSubject (currentRoomItems) with the new list of items.
      // This will notify all subscribers about the current items in the room.
      this.currentRoomItems.next(items);
    });
  }
}
