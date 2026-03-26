import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppInitializerService {
  private readonly authService = inject(AuthService);

  initializeApp(): void {
    this.authService.initialize();
  }
}

export function initializeApp(appInitializer: AppInitializerService) {
  return () => appInitializer.initializeApp();
}
