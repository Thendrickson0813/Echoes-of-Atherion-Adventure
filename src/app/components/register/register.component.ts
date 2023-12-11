import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm!: FormGroup; // Non-null assertion operator
  errorMessage: string | null = null; // Variable to store the error message
  passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{7,}$/;   // Regex pattern for the password

  // Custom validator function
  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    // Check if password and confirmPassword fields match
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth, // Ensure AngularFireAuth is injected
    private router: Router // Ensure Router is injected
  ) {
    this.createForm();
  }

  createForm() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(7), Validators.pattern(this.passwordPattern)]],
      confirmPassword: ['', Validators.required],
    }, {
      validator: this.passwordMatchValidator
    });
  }

  onRegister() {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      this.afAuth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          // Navigate to login on successful registration
          this.router.navigate(['/login']);
        })
        .catch((error: any) => {
          if (error.code === 'auth/email-already-in-use') {
            this.errorMessage = 'This email address is already in use.';
          } else {
            this.errorMessage = 'An error occurred during registration.';
          }
        });
    }
  }
}
