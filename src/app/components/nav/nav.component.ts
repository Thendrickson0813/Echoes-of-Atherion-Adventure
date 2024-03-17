// nav.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { GameStateService } from '../../services/game-state.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MyFsService } from 'src/app/services/my-fs';
import { RealTimeService } from 'src/app/services/real-time.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
  isLoginRoute: boolean = false;
  characterName: string | null = null;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private gameStateService: GameStateService, // Inject the GameStateService
    private myFsService: MyFsService,
    private realTimeService: RealTimeService,
    
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.url === '/login';
        this.characterName = this.gameStateService.getSelectedCharacterName();
      }
    });
  }

  signOut() {
    this.authService.signOut().subscribe(() => {
      this.realTimeService.disconnectFromGameServer();

      this.router.navigate(['/login']);
    });
  }
  
  logoutCharacter() {
    // Call getSelectedCharacterId as a method
    const characterId = this.gameStateService.getSelectedCharacterFirestoreDocumentId();
  
    if (characterId) {
      this.myFsService.updateCharacterOnlineStatus(characterId, false)
        .then(() => {
          console.log('Character successfully logged out');
          // Additional logic if needed after character logout
          this.realTimeService.disconnectFromGameServer();

          this.router.navigate(['/character-list']); // Navigate to character list
        })
        .catch(error => {
          console.error('Error logging out character:', error);
        });
    } else {
      console.error('No character ID available for logout');
    }
  }
  
}

