// nav.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
  isLoginRoute: boolean = false;

  constructor(public authService: AuthService, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.url === '/login';
      }
    });
  }

  signOut() {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/login']); // Navigate to the login page after logout
    });
  }
}
