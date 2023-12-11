// game-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private selectedCharacter: any = null;

  private selectedCharacterId = new BehaviorSubject<string | null>(null);
  private selectedCharacterName = new BehaviorSubject<string | null>(null);
  private selectedCharacterLocation = new BehaviorSubject<string | null>(null);
  private selectedCharacterFirestoreDocumentId = new BehaviorSubject<string | null>(null);


  constructor() { }

  setSelectedCharacter(character: any) {
  this.selectedCharacter = character;
  
  this.setSelectedCharacterId(character.characterId); // Set the character UUID
  this.setSelectedCharacterFirestoreDocumentId(character.documentId); // Set the Firestore Document ID
  this.setSelectedCharacterName(character.characterName); // Set the character name
  this.setSelectedCharacterLocation(character.location); // Set the character location

  console.log('Selected Character in Service:', this.selectedCharacter);
}

  getSelectedCharacter() {
    return this.selectedCharacter;
  }

  setSelectedCharacterId(id: string) {
    this.selectedCharacterId.next(id);
    console.log(`GameStateService: Character ID set: ${id}`);
  }
  getSelectedCharacterId(): string | null {
    return this.selectedCharacterId.value;

  }

  setSelectedCharacterFirestoreDocumentId(documentId: string) {
    this.selectedCharacterFirestoreDocumentId.next(documentId);
    console.log(`GameStateService: Firestore Document ID set to ${documentId}`);
  }
  
  getSelectedCharacterFirestoreDocumentId(): string | null {
    return this.selectedCharacterFirestoreDocumentId.value;
  }
  
  setSelectedCharacterName(name: string | null) {
    this.selectedCharacterName.next(name);
    console.log(`GameStateService: Character Name set: ${name}`);
  }
  getSelectedCharacterName(): string | null {
    return this.selectedCharacterName.value;

  }

  setSelectedCharacterLocation(location: string | null) {
    this.selectedCharacterLocation.next(location);
    console.log(`GameStateService: Character Location set: ${location}`);
  }
  getSelectedCharacterLocation(): string | null {
    return this.selectedCharacterLocation.value;
  }


}
