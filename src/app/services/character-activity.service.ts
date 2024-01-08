import { Injectable } from '@angular/core';
import { getFirestore, doc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { BehaviorSubject, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CharacterActivityService {
  private lastActiveSubject = new BehaviorSubject<Date>(new Date());
  private characterId: string | null = null;

  constructor() { }

  setCharacterId(characterId: string) {
    this.characterId = characterId;
  }

  updateLastActiveTime() {
    this.lastActiveSubject.next(new Date());
  }

  subscribeToCharacterOnlineStatus(updateCallback: (isOnline: boolean) => void) {
    if (!this.characterId) return;

    const db = getFirestore();
    const characterDocRef = doc(db, 'characters', this.characterId);

    onSnapshot(characterDocRef, (doc) => {
      const characterData = doc.data();
      if (characterData && typeof characterData['isOnline'] === 'boolean') {
        updateCallback(characterData['isOnline']);
      }
    });
  }
}