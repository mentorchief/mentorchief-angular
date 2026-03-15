import { createReducer, on } from '@ngrx/store';
import { loadAdminData, resetAdmin } from './admin.actions';
import { adminInitialState, type AdminState } from './admin.state';
import { ADMIN_SEED } from './admin.seed';

export const adminReducer = createReducer<AdminState>(
  { ...adminInitialState, ...ADMIN_SEED },
  on(loadAdminData, (_, payload) => ({ ...adminInitialState, ...payload })),
  on(resetAdmin, () => adminInitialState),
);
