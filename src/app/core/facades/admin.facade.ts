import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAdminState } from '../../store/admin/admin.selectors';

@Injectable({ providedIn: 'root' })
export class AdminFacade {
  private readonly store = inject(Store);

  readonly data$ = this.store.select(selectAdminState);
}
