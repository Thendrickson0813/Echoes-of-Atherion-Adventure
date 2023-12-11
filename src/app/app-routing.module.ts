// app-routing.module
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { GamePlayComponent } from './components/game-play/game-play.component';
import { RegisterComponent } from './components/register/register.component';
import { CharacterCreationComponent } from './components/character-creation/character-creation.component';
import { CharacterListComponent } from './components/character-list/character-list.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AuthGuard } from './auth.guard';


const routes: Routes = [
  { path: 'splash-screen', component: SplashScreenComponent, canActivate: [AuthGuard] },

  {
    path: 'game-play',
    component: GamePlayComponent,
    canActivate: [AuthGuard] // Protect this route
  },
  {  path: 'character-list', 
    component: CharacterListComponent,
    canActivate: [AuthGuard] // Optional: Protect this route if needed
  },
  {
    path: 'play',
    component: GamePlayComponent,
    canActivate: [AuthGuard] // Protect this route
  },
  { path: 'create-character', 
    component: CharacterCreationComponent, 
    canActivate: [AuthGuard] // Optional: Protect this route if needed
},

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  // ... any other routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
