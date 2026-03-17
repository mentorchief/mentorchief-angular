import { createReducer, on } from '@ngrx/store';
import { loadAdminData, resetAdmin } from './admin.actions';
import { adminInitialState, type AdminState } from './admin.state';
export const adminReducer = createReducer<AdminState>(
  adminInitialState,
  on(loadAdminData, (_, payload) => ({ ...adminInitialState, ...payload })),
  on(resetAdmin, () => adminInitialState),
);
