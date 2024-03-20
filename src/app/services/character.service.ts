import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs'; // Add Observable import

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private location = new BehaviorSubject<string | null>(null);

  constructor() {}

  // This method sets the current location to the provided string.
  setLocation(newLocation: string) {
    console.log("Setting location to:", newLocation);
    this.location.next(newLocation);
  }

// This method returns an Observable of the current location (string or null).
getLocation(): Observable<string | null> {
  console.log("Getting current location as an Observable");
  return this.location.asObservable();
}

// This method returns the ID of the currently selected character.
getSelectedCharacterId(): string {
  const characterId = 'character-id'; // Replace with actual logic to retrieve the character ID
  console.log("Current selected character ID:", characterId);
  return characterId;
}


  // Other methods...
}
