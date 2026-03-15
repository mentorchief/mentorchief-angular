import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { appReducers } from './store/app.reducer';
import { AuthEffects } from './features/auth/store/auth.effects';
import { RegistrationEffects } from './features/registration/store/registration.effects';
import { SessionEffects } from './store/session/session.effects';
import { AppInitializerService, initializeApp } from './core/services/app-initializer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore(appReducers),
    provideEffects([AuthEffects, RegistrationEffects, SessionEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      trace: false,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService],
      multi: true,
    },
  ],
};
