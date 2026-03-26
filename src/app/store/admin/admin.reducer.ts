import { createReducer, on } from '@ngrx/store';
import { addPayment, loadAdminData, loadAdminPayments, refundPayment, releasePayment, resetAdmin } from './admin.actions';
import { adminInitialState, type AdminState } from './admin.state';

export const adminReducer = createReducer<AdminState>(
  adminInitialState,
  on(loadAdminData, (_, payload) => ({ ...adminInitialState, ...payload })),
  on(loadAdminPayments, (state, { payments }) => ({ ...state, payments })),
  on(releasePayment, (state, { paymentId }) => ({
    ...state,
    payments: state.payments.map((p) =>
      p.id === paymentId ? { ...p, status: 'completed' as const } : p,
    ),
  })),
  on(refundPayment, (state, { paymentId }) => ({
    ...state,
    payments: state.payments.map((p) =>
      p.id === paymentId ? { ...p, status: 'refunded' as const } : p,
    ),
  })),
  on(addPayment, (state, { payment }) => ({
    ...state,
    payments: [payment, ...state.payments],
  })),
  on(resetAdmin, () => adminInitialState),
);
