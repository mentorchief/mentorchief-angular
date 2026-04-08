import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { Store } from '@ngrx/store';
import { routes } from './app.routes';
import { reducers } from './store/app.reducer';
import { AuthEffects } from './store/effects/auth.effects';
import { MessagingEffects } from './store/effects/messaging.effects';
import { UsersEffects } from './store/effects/users.effects';
import { RegistrationEffects } from './store/effects/registration.effects';
import { MenteeEffects } from './store/effects/mentee.effects';
import { SubscriptionEffects } from './store/effects/subscription.effects';
import { AuthActions } from './store/auth/auth.actions';

export function initNgrxSession(store: Store) {
  return () => {
    store.dispatch(AuthActions.restoreSession());
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore(reducers),
    provideEffects([AuthEffects, MessagingEffects, UsersEffects, RegistrationEffects, MenteeEffects, SubscriptionEffects]),
    ...(isDevMode()
      ? [
          provideStoreDevtools({
            maxAge: 25,
            logOnly: false,
          }),
        ]
      : []),
    {
      provide: APP_INITIALIZER,
      useFactory: initNgrxSession,
      deps: [Store],
      multi: true,
    },
  ],
};
