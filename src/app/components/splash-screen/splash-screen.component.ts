// splash-screen.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // Adjust the path as necessary

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent {
  isLoggedIn$: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) { // Inject Router here
    this.isLoggedIn$ = this.authService.user$.pipe(
      map(user => !!user)
    );
  }

  logout() {
    // Implement the logout logic
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/login']); // Now 'router' is available in the component
    });
  }

  // Other methods...
}
