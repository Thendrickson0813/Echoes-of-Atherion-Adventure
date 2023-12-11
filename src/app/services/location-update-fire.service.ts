import { Injectable } from '@angular/core';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { GameStateService } from './game-state.service';

@Injectable({
  providedIn: 'root'
})
export class LocationUpdateService {
  private db = getFirestore();

  constructor(private gameStateService: GameStateService) {}

  async updateLocation(newLocation: string): Promise<void> {
    try {
      // Get the document ID from GameStateService
      const documentId = this.gameStateService.getSelectedCharacterFirestoreDocumentId();

      if (documentId) {
        const characterRef = doc(this.db, 'characters', documentId);
        await updateDoc(characterRef, { location: newLocation });
        console.log(`Location updated in Firestore for Document ID: ${documentId}`);
      } else {
        console.error('No document ID found for the selected character');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }
}
