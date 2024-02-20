import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

interface GameEvent {
  type: string;
  details: any;
  timestamp: any; // Use appropriate type for timestamp
}

@Injectable({
  providedIn: 'root'
})
export class EventManagementService {
  constructor(private firestore: Firestore) { }

  // Method to create a new event
  async createEvent(roomId: string, event: GameEvent): Promise<void> {
    const eventsRef = collection(this.firestore, `locations/${roomId}/events`);
    try {
      await addDoc(eventsRef, {
        ...event,
        timestamp: serverTimestamp() // Sets the timestamp to the server's current time
      });
      console.log('Event created successfully.');
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Method to update an existing event
  async updateEvent(roomId: string, eventId: string, updateData: Partial<GameEvent>): Promise<void> {
    const eventRef = doc(this.firestore, `locations/${roomId}/events/${eventId}`);
    try {
      await updateDoc(eventRef, updateData);
      console.log('Event updated successfully.');
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Method to delete an event
  async deleteEvent(roomId: string, eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, `locations/${roomId}/events/${eventId}`);
    try {
      await deleteDoc(eventRef);
      console.log('Event deleted successfully.');
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Method to query for events in a room
  getEventsInRoom(roomId: string): Observable<GameEvent[]> {
    const eventsRef = collection(this.firestore, `locations/${roomId}/events`);
    const q = query(eventsRef, orderBy('timestamp'));
    return from(getDocs(q)).pipe(
      map(querySnapshot => querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data() as GameEvent;
        return { ...data, id: docSnapshot.id };
      }))
    );
  }

 
  // Additional methods for querying, updating, or other event-related logic can be added here
}
