import { createFeatureSelector } from '@ngrx/store';
import type { AdminState } from './admin.reducer';

export const selectAdminState = createFeatureSelector<AdminState>('admin');
