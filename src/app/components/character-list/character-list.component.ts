// CharacterListComponent
import { Component, OnInit } from '@angular/core';
import { MyFsService } from 'src/app/services/my-fs';
import { AuthService } from 'src/app/services/auth.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { Router } from '@angular/router';
import { RoomsService } from 'src/app/services/rooms.service';
import { RealTimeService } from 'src/app/services/real-time.service';


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
    private myFsService: MyFsService,
    private gameStateService: GameStateService,
    private roomsService: RoomsService,
    private realTimeService: RealTimeService,
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

  ngOnDestroy() {
    
  }

  fetchCharacters() {
    console.log('character-list Fetching characters for user ID:', this.userId);

    if (this.userId) {
      console.log('character-list Calling getCharactersByUserId method');

      this.myFsService.getCharactersByUserId(this.userId).subscribe(characters => {
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
  
      // Existing logic for setting the selected character
      this.selectedCharacter = character;
      this.gameStateService.setSelectedCharacter(character);
      this.gameStateService.setSelectedCharacterId(character.characterId);
      this.gameStateService.setSelectedCharacterFirestoreDocumentId(character.documentId);
  
      // Update the character's online status
      this.myFsService.updateCharacterOnlineStatus(character.documentId, true)
        .then(() => {
          console.log(`Character ${character.characterName} set as online.`);
        })
        .catch(error => {
          console.error('Error setting character online status:', error);
        });

      // ... rest of the onSelectCharacter logic ...
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

      // Connect to the server when the Play button is clicked
       this.realTimeService.initializeSocketConnection();
       console.log("connecting to server")
      // Navigate to the '/play' route
      this.router.navigate(['/play']);
    }
  }
}