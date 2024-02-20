import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Subject, Subscription } from 'rxjs';

interface GameEvent {
  type: string;
  details: any;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventBroadcastService implements OnDestroy {
  private eventSubject = new Subject<GameEvent>();
  private currentRoomSubscription: Subscription | null = null;
  private currentRoomId: string | null = null;

  constructor(private firestore: Firestore) {}

  // Call this method to start listening to a new room
  listenToRoom(roomId: string): void {
    // Unsubscribe from the previous room
    if (this.currentRoomSubscription) {
      this.currentRoomSubscription.unsubscribe();
      this.currentRoomSubscription = null;
    }

    this.currentRoomId = roomId;
    const eventsRef = collection(this.firestore, `locations/${roomId}/events`);
    const q = query(eventsRef, where('timestamp', '>', new Date())); // Listen to new events only

    this.currentRoomSubscription = new Subscription();
    this.currentRoomSubscription.add(
      onSnapshot(q, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const eventData = change.doc.data() as GameEvent;
            this.eventSubject.next(eventData);
          }
        });
      })
    );
  }

  // Observable to which components can subscribe
  get events$() {
    return this.eventSubject.asObservable();
  }

  // Stop listening to the current room
  stopListening(): void {
    if (this.currentRoomSubscription) {
      this.currentRoomSubscription.unsubscribe();
      this.currentRoomSubscription = null;
      this.currentRoomId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
    this.eventSubject.complete();
  }
}

