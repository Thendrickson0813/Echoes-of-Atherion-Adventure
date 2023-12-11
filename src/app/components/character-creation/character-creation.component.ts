// character-creation.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MyFs } from 'src/app/services/my-fs';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-character-creation',
  templateUrl: './character-creation.component.html',
  styleUrls: ['./character-creation.component.scss']
})
export class CharacterCreationComponent {
  characterForm!: FormGroup; // Non-null assertion operator

  constructor(
    private fb: FormBuilder,
    private myFs: MyFs, // Injecting Firestore Service
    private router: Router // Injecting Router Service
  ) {
    this.createForm();
  }

  createForm() {
    this.characterForm = this.fb.group({
      characterName: ['', Validators.required],
      characterClass: ['', Validators.required],
      characterRace: ['', Validators.required],
      characterGender: ['', Validators.required],
      // Add more form controls as needed
    });
  }

  onCreateCharacter() {
    if (this.characterForm.valid) {
      const characterData = {
        ...this.characterForm.value,
        characterId: uuidv4(),
        location: 'X1Y0',
        leftHand: null, // Initialize as null, meaning "empty hand"
        rightHand: null,
      };

      this.myFs.addData('characters', characterData)
        .then(() => {
          console.log('Character created successfully');
          this.router.navigate(['/character-list']);
        })
        .catch(error => {
          console.error('Error creating character:', error);
        });
    } else {
      console.log('Form is not valid');
    }
  }
}