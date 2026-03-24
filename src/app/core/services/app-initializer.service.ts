import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import type { AppState } from '../../store/app.state';
import { loadCurrentUserSuccess } from '../../features/auth/store/auth.actions';
import { loadUsers } from '../../store/users/users.actions';
import { AuthApiService } from './auth-api.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AppInitializerService {
  private readonly store = inject(Store<AppState>);
  private readonly authApi = inject(AuthApiService);

  async initializeApp(): Promise<void> {
    try {
      const userId = await firstValueFrom(this.authApi.loadCurrentUser());

      if (userId) {
        try {
          const currentUser = await firstValueFrom(this.authApi.getProfileById(userId));
          const isAdmin = currentUser?.role === UserRole.Admin;
          const allUsers = isAdmin
            ? await firstValueFrom(this.authApi.getAllProfiles())
            : await firstValueFrom(this.authApi.getApprovedMentors());
          const users = isAdmin
            ? allUsers
            : [
                ...(currentUser ? [currentUser] : []),
                ...allUsers.filter((m) => m.id !== userId),
              ];
          if (users.length > 0) {
            this.store.dispatch(loadUsers({ users }));
          }
        } catch {
          // profiles failed — guard will redirect to login
        }
        this.store.dispatch(loadCurrentUserSuccess({ userId }));
      } else {
        this.store.dispatch(loadCurrentUserSuccess({ userId: null }));
      }
    } catch {
      this.store.dispatch(loadCurrentUserSuccess({ userId: null }));
    }
  }
}

export function initializeApp(appInitializer: AppInitializerService) {
  return () => appInitializer.initializeApp();
}
