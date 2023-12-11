// CharacterListComponent
import { Component, OnInit } from '@angular/core';
import { MyFs } from 'src/app/services/my-fs';
import { AuthService } from 'src/app/services/auth.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { Router } from '@angular/router';
import { RoomsService } from 'src/app/services/rooms.service';


@Component({
  selector: 'app-character-list',
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.scss']
})

export class CharacterListComponent implements OnInit {
  characters: any[] = [];
  userId?: string; // Make userId optional
  selectedCharacter?: any; // Add this line

  constructor(
    private authService: AuthService,
    private myFs: MyFs,
    private gameStateService: GameStateService,
    private roomsService: RoomsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.fetchCharacters();
      }
    });
  }

  fetchCharacters() {
    console.log('character-list Fetching characters for user ID:', this.userId);

    if (this.userId) {
      console.log('character-list Calling getCharactersByUserId method');

      this.myFs.getCharactersByUserId(this.userId).subscribe(characters => {
        console.log('character-list Received characters from getCharactersByUserId:', characters);

        this.characters = characters;
        console.log('character-list Assigned characters to this.characters:', this.characters);
      });
    }
  }

  // Inside onSelectCharacter method in CharacterListComponent
  onSelectCharacter(character: any): void {
    if (character && character.characterName) {
      console.log('Selected character:', character);

      this.selectedCharacter = character;
      this.gameStateService.setSelectedCharacter(character);
      this.gameStateService.setSelectedCharacterId(character.characterId);
      this.gameStateService.setSelectedCharacterFirestoreDocumentId(character.documentId);

      // Log the stored values in GameStateService for verification
      console.log('Stored character in GameStateService:', this.gameStateService.getSelectedCharacter());
      console.log('Firestore Document ID:', character.documentId); // Log the Firestore Document ID
      console.log('Stored character ID in GameStateService:', this.gameStateService.getSelectedCharacterId());
      console.log('Stored character Name in GameStateService:', this.gameStateService.getSelectedCharacterName());
      console.log('Stored character Location in GameStateService:', this.gameStateService.getSelectedCharacterLocation());
      const characterLocation = this.gameStateService.getSelectedCharacterLocation();
      if (characterLocation) {
        console.log("CharacterListComponent: Updating location from onSelectCharacter");
        this.roomsService.updateLocation(characterLocation);
      } else {
        console.error('Unable to retrieve character location');
      }
    } else {
      console.error('Character name not found in the selected character');
    }
  }

  playWithSelectedCharacter() {
    if (this.selectedCharacter) {
      console.log('Playing with selected character:', this.selectedCharacter);

      // Set the selected character in GameStateService
      this.gameStateService.setSelectedCharacter(this.selectedCharacter);

      // Optionally, retrieve and use the information from GameStateService
      const currentCharacter = this.gameStateService.getSelectedCharacter();
      const currentCharacterId = this.gameStateService.getSelectedCharacterId();
      const currentCharacterName = this.gameStateService.getSelectedCharacterName();
      const currentCharacterLocation = this.gameStateService.getSelectedCharacterLocation();

      // Example usage (e.g., logging or performing checks)
      console.log(`Current character ID: ${currentCharacterId}`);
      console.log(`Current character Name: ${currentCharacterName}`);
      console.log(`Current character Location: ${currentCharacterLocation}`);

      // Navigate to the '/play' route
      this.router.navigate(['/play']);
    }
  }
}