import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { RegistrationData } from '../models/registration.model';
import { RegistrationActions } from '../../store/registration/registration.actions';
import { selectRegistrationState } from '../../store/registration/registration.selectors';

@Injectable({ providedIn: 'root' })
export class RegistrationFacade {
  private readonly store = inject(Store);

  readonly state$ = this.store.select(selectRegistrationState);

  get data(): RegistrationData {
    let d = {} as RegistrationData;
    this.state$.subscribe((s) => (d = s.data)).unsubscribe();
    return d;
  }

  get currentStep(): number {
    let n = 1;
    this.state$.subscribe((s) => (n = s.currentStep)).unsubscribe();
    return n;
  }

  get totalSteps(): number {
    let n = 5;
    this.state$.subscribe((s) => (n = s.totalSteps)).unsubscribe();
    return n;
  }

  hydrate(): void {
    this.store.dispatch(RegistrationActions.hydrate());
  }

  update(updates: Partial<RegistrationData>): void {
    this.store.dispatch(RegistrationActions.updateData({ updates }));
  }

  setStep(step: number): void {
    this.store.dispatch(RegistrationActions.setStep({ step }));
  }

  reset(): void {
    this.store.dispatch(RegistrationActions.reset());
  }
}
