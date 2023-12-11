import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  resetPassword() {
    if (this.resetForm.valid) {
      const { email } = this.resetForm.value;
      this.afAuth.sendPasswordResetEmail(email)
        .then(() => {
          // Handle successful password reset
        })
        .catch((error) => {
          // Handle errors (e.g., user not found)
        });
    }
  }
}
