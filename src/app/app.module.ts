import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getDatabase, provideDatabase } from '@angular/fire/database';


import { environment } from '../environments/environment'; // adjust the path as necessary
import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CharacterCreationComponent } from './components/character-creation/character-creation.component';
import { GamePlayComponent } from './components/game-play/game-play.component';
import { ReversePipe } from './pipe/reverse.pipe';
import { LoginComponent } from './components/login/login.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';

import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { MyFs } from './services/my-fs';
import { CharacterListComponent } from './components/character-list/character-list.component';
import { DataService } from './services/data.service';
import { LocationUpdateService } from './services/location-update-fire.service';
import { FormsModule } from '@angular/forms';
import { InteractiveWindowComponent } from './components/interactive-window/interactive-window.component';



@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    GamePlayComponent,
    ReversePipe,
    LoginComponent,
    SplashScreenComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    CharacterCreationComponent,
    CharacterListComponent,
    InteractiveWindowComponent,
  ],
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideDatabase(() => getDatabase()),
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    MyFs,
    LocationUpdateService,
    DataService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

