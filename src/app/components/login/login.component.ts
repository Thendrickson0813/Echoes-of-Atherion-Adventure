import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { getAuth, sendPasswordResetEmail } from '@angular/fire/auth'; // Import sendPasswordResetEmail

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  resetForm: FormGroup;
  showResetForm: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
  ) {

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize the reset form
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Add the resetPassword method
  toggleResetForm(show: boolean) {
    this.showResetForm = show;
  }

  resetPassword() {
    if (this.resetForm.valid) {
      const email = this.resetForm.value.email;
      const auth = getAuth();
      sendPasswordResetEmail(auth, email)
        .then(() => {
          // Handle successful password reset
          console.log('Password reset email sent');
          alert("Password reset email has been sent. Please check your inbox."); // Example: using an alert for simplicity
          // You can also implement a more sophisticated notification system here
  
          // Optionally, navigate the user or change UI state
          this.showResetForm = false; // Hide the reset form
          // this.router.navigate(['/login']); // Optionally redirect to the login page
        })
        .catch((error: any) => {
          // Handle errors (e.g., user not found)
          console.error('Reset password error', error);
          alert("Error sending password reset email: " + error.message); // Display the error message
        });
    }
  }

  loginWithGitHub() {
    this.subscription.add(
      this.authService.loginWithGithub().subscribe({
        next: (result) => {
          this.router.navigate(['/splash-screen']);
        },
        error: (error) => {
          console.error('GitHub login error', error);
        }
      })
    );
  }

  loginWithMicrosoft() {
    this.subscription.add(
      this.authService.loginWithMicrosoft().subscribe({
        next: (result) => {
          console.log('Successfully logged in with Microsoft', result);
          this.router.navigate(['/splash-screen']);
        },
        error: (error) => {
          console.error('Microsoft login error', error);
        }
      })
    );
  }

  signInWithGoogle() {
    this.subscription.add(
      this.authService.googleSignIn().subscribe({
        next: (user) => {
          this.router.navigate(['/splash-screen']);
        },
        error: (error) => {
          console.error('Google sign-in error', error);
        }
      })
    );
  }

  signInWithEmail() {
    if (this.loginForm.valid) {
      // Using optional chaining and nullish coalescing operator
      const email = this.loginForm.get('email')?.value ?? '';
      const password = this.loginForm.get('password')?.value ?? '';

      this.subscription.add(
        this.authService.signInWithEmail(email, password).subscribe({
          next: (user) => {
            this.router.navigate(['/splash-screen']);
          },
          error: (error) => {
            console.error('Email/password sign-in error', error);
          }
        })
      );
    }
  }

  signOut() {
    this.subscription.add(
      this.authService.signOut().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Sign out error', error);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Correctly close the method
  }
}