import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs'; // Import 'from' to convert Promises to Observables
import { tap } from 'rxjs/operators';
import { getAuth, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GithubAuthProvider, OAuthProvider, GoogleAuthProvider, onAuthStateChanged, Auth, User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;
  private auth: Auth;

    constructor(private router: Router) {
    this.auth = getAuth();
    this.user$ = new Observable((subscriber) => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(user);
      });
    });
  }

  loginWithGithub(): Observable<any> {
    const provider = new GithubAuthProvider();
    return from(signInWithPopup(this.auth, provider));
  }

  loginWithMicrosoft(): Observable<any> {
    const provider = new OAuthProvider('microsoft.com');
    return from(signInWithPopup(this.auth, provider));
  }

  googleSignIn(): Observable<any> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      tap(() => this.router.navigate(['/splash-screen']))
    );
  }

  signInWithEmail(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth));
  }


  async registerUser(email: string, password: string): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      // Additional logic for storing user information
    } catch (error) {
      console.error('Registration error', error);
    }
  }

  // Add reset password method
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  // This method returns the currently logged-in user's ID
  async getCurrentUserId(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }
}