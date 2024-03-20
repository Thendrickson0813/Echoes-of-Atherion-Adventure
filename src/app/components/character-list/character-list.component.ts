// CharacterListComponent
import { Component, OnInit } from '@angular/core';
import { MyFsService } from 'src/app/services/my-fs';
import { AuthService } from 'src/app/services/auth.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { Router } from '@angular/router';
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
    if (this.userId) {
      this.myFsService.getCharactersByUserId(this.userId).subscribe(characters => {
        this.characters = characters;
      });
    }
  }

  // Inside onSelectCharacter method in CharacterListComponent
  onSelectCharacter(character: any): void {
    if (character && character.characterName) {
      // Existing logic for setting the selected character
      this.selectedCharacter = character;
      this.gameStateService.setSelectedCharacter(character);
      this.gameStateService.setSelectedCharacterId(character.characterId);
      this.gameStateService.setSelectedCharacterFirestoreDocumentId(character.documentId);
    } else {
      console.error('Character name not found in the selected character');
    }
  }


  playWithSelectedCharacter() {
    if (this.selectedCharacter) {
      console.log('Playing with selected character:', this.selectedCharacter);

      // Update the character's online status here
      this.myFsService.updateCharacterOnlineStatus(this.selectedCharacter.documentId, true)
        .then(() => {
          console.log(`Character ${this.selectedCharacter.characterName} set as online.`);
        })
        .catch(error => {
          console.error('Error setting character online status:', error);
        });

      // Connect to the server when the Play button is clicked
      this.realTimeService.initializeSocketConnection();
      console.log("connecting to server");

      // Navigate to the '/play' route
      this.router.navigate(['/play']);
    }
  }
}