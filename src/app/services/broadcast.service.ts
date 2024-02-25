import { Injectable, EventEmitter } from '@angular/core';
import { Item, Characters } from '../models'; // Import necessary models

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  itemPickedUp = new EventEmitter<{ itemId: string, characterId: string }>();
  // You can add more events as needed

  constructor() { }

  broadcastItemPickup(itemId: string, characterId: string): void {
    this.itemPickedUp.emit({ itemId, characterId });
  }

  // You can add more methods for different types of broadcasts
}
