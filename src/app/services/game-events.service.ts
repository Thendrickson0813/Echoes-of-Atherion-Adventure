import { Injectable } from '@angular/core';
import { addDoc, Timestamp, onSnapshot, collection, getFirestore } from 'firebase/firestore';
import { BroadcastService } from './broadcast.service';
import { GameEvent } from '../models/game-event.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameEventsService {
  private eventsSubject = new BehaviorSubject<GameEvent[]>([]);
  private broadcastService: BroadcastService;
  private processedEventIds = new Set<string>();

  events$ = this.eventsSubject.asObservable(); // Expose the observable stream of game events

  constructor(broadcastService: BroadcastService) {
    this.broadcastService = broadcastService;
    

  }

  listenToGameEvents(location: string): void {
    console.log(`Listening to game events at location: ${location}`);
    const eventsRef = collection(getFirestore(), `locations/${location}/events`);
    onSnapshot(eventsRef, (snapshot) => {
      const gameEvents: GameEvent[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !this.processedEventIds.has(change.doc.id)) {
          const gameEvent = change.doc.data() as GameEvent;
          gameEvents.push(gameEvent);
          this.processedEventIds.add(change.doc.id); // Add to processed IDs
        }
      });
      this.eventsSubject.next(gameEvents);
    });
    
  }
  
  private handleGameEvent(gameEvent: GameEvent): void {
    console.log('Handling game event:', gameEvent);
    switch (gameEvent.type) {
      case 'itemPickup':
        const { itemId, characterId } = gameEvent.details;
        console.log('Handling item pickup event:', itemId, characterId);
        if (gameEvent.location) { // Check if location exists on the gameEvent
          console.log('Broadcasting item pickup event for location:', gameEvent.location);
          this.broadcastService.broadcastItemPickupEvent(itemId, characterId, gameEvent.location);
        }
        break;
      // ... other case handlers for different event types
    }
  }
  
  async createGameEvent(eventType: string, details: any, location: string): Promise<void> {
    console.log(`Creating game event of type ${eventType} at location: ${location}`, details);
    try {
      const firestore = getFirestore();
      const eventRef = collection(firestore, `locations/${location}/events`);
      const docRef = await addDoc(eventRef, {
        type: eventType,
        details: details,
        location: location,
        timestamp: Timestamp.now()
      });
      console.log('Game event created successfully with document reference:', docRef);
    } catch (error) {
      console.error('Error creating game event:', error);
    }
  }
  // Additional methods to process different types of events
}  