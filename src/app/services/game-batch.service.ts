import { Injectable } from '@angular/core';
import { Firestore, doc, writeBatch, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GameBatchService {
  constructor(private firestore: Firestore) {}

  /**
   * Perform a batch update including the action and a timestamp update.
   * 
   * @param characterId - The ID of the character to update.
   * @param updates - Array of updates to perform in the batch.
   * @returns Promise<void>
   */
  async performBatchUpdate(characterId: string, updates: BatchUpdate[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Processing each update in the batch
    updates.forEach(update => {
      console.log(`Adding update to batch: ${update.path}`);
      const docRef = doc(this.firestore, update.path);
      batch.update(docRef, update.data);
    });

    // Updating the lastActiveTime for the character
    const characterRef = doc(this.firestore, `characters/${characterId}`);
    console.log(`Updating lastActiveTime for characterId: ${characterId}`);
    batch.update(characterRef, { lastActiveTime: Timestamp.now() });

    // Committing the batch
    try {
      await batch.commit();
      console.log('Batch update successful.');
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

/**
 * Interface for batch update data.
 */
export interface BatchUpdate {
  path: string; // Path to the document (e.g., 'items/so0xAxSBUkvLRogbrRFo')
  data: Record<string, any>; // Data to update
}
