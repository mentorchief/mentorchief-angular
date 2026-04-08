import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { PlatformConfig } from '../data/platform.state';
import { PlatformActions } from '../../store/platform/platform.actions';
import { selectPlatformState } from '../../store/platform/platform.selectors';

@Injectable({ providedIn: 'root' })
export class PlatformFacade {
  private readonly store = inject(Store);

  readonly config$ = this.store.select(selectPlatformState);

  get config(): PlatformConfig {
    let c: PlatformConfig | undefined;
    this.config$.subscribe((x) => (c = x)).unsubscribe();
    return c!;
  }

  updateConfig(changes: Partial<PlatformConfig>): void {
    this.store.dispatch(PlatformActions.updateConfig({ changes }));
  }
}
