// nav.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { GameStateService } from '../../services/game-state.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
    private gameStateService: GameStateService // Inject the GameStateService
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
      this.router.navigate(['/login']);
    });
  }
}

