import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class GameBatchService {
  constructor(private firestore: Firestore) {}

  async performBatchUpdate(characterId: string, updates: BatchUpdate[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    updates.forEach(update => {
      const docRef = doc(this.firestore, update.path);
      batch.update(docRef, update.data);
    });

    const characterRef = doc(this.firestore, `characters/${characterId}`);
    batch.update(characterRef, { lastActiveTime: Timestamp.now() });

    try {
      await batch.commit();
      console.log('Batch update successful.');
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

export interface BatchUpdate {
  path: string;
  data: Record<string, any>;
}
