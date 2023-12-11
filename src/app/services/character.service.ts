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
  // Emits the new location to any subscribers via the internal location subject.
  this.location.next(newLocation);
}

// This method returns an Observable of the current location (string or null).
getLocation(): Observable<string | null> {
  // Returns an Observable that emits the current location stored in the internal subject.
  return this.location.asObservable();
}

// This method returns the ID of the currently selected character.
getSelectedCharacterId(): string {
  // This is a placeholder implementation. 
  // Ideally, this would retrieve and return the actual character ID from storage.
  return 'character-id';
}


  // Other methods...
}
