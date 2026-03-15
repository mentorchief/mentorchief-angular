import { createEntityAdapter, type EntityState } from '@ngrx/entity';
import type { User } from '../../core/models/user.model';

export const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface UsersState extends EntityState<User> {}

export const usersInitialState: UsersState = usersAdapter.getInitialState();
