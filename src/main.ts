import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment'; // Adjust the path if necessary
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

// Initialize Firebase
initializeApp(environment.firebaseConfig);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

