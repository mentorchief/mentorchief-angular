import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { loadCurrentUser, loadCurrentUserSuccess } from '../../features/auth/store/auth.actions';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitializerService {
  private readonly store = inject(Store<AppState>);
  private readonly authApi = inject(AuthApiService);

  async initializeApp(): Promise<void> {
    try {
      const userId = await firstValueFrom(this.authApi.loadCurrentUser());
      this.store.dispatch(loadCurrentUserSuccess({ userId }));
    } catch {
      this.store.dispatch(loadCurrentUserSuccess({ userId: null }));
    }
  }
}

export function initializeApp(appInitializer: AppInitializerService) {
  return () => appInitializer.initializeApp();
}
