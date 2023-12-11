// auth.guard.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']); // Corrected path
          return false;
        }
      })
    );
  }
}
