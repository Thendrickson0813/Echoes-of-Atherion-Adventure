import { Injectable } from '@angular/core';
import { doc, getFirestore } from 'firebase/firestore';
import { GameStateService } from './game-state.service';
import { GameBatchService, BatchUpdate } from './game-batch.service'; // Import GameBatchService

@Injectable({
  providedIn: 'root'
})
export class LocationUpdateService {
  private db = getFirestore();

  constructor(
    private gameStateService: GameStateService,
    private gameBatchService: GameBatchService // Inject GameBatchService
  ) {}

  async updateLocation(newLocation: string): Promise<void> {
    try {
      const documentId = this.gameStateService.getSelectedCharacterFirestoreDocumentId();

      if (documentId) {
        // Prepare batch update
        const updates: BatchUpdate[] = [
          {
            path: `characters/${documentId}`,
            data: { location: newLocation }
            // lastActiveTime will be updated by GameBatchService
          }
        ];

        // Perform the batch update
        await this.gameBatchService.performBatchUpdate(documentId, updates);

        console.log(`Location and last active time updated in Firestore for Document ID: ${documentId}`);
      } else {
        console.error('No document ID found for the selected character');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }
}
