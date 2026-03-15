import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import type { Database } from '../models/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

function profileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    avatar: row.avatar ?? row.name.slice(0, 2).toUpperCase(),
    registered: row.registered,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    gender: row.gender ?? undefined,
    jobTitle: row.job_title ?? undefined,
    company: row.company ?? undefined,
    yearsOfExperience: row.years_of_experience ?? undefined,
    bio: row.bio ?? undefined,
    skills: row.skills ?? undefined,
    tools: row.tools ?? undefined,
    portfolioUrl: row.portfolio_url ?? undefined,
    linkedin: row.linkedin ?? undefined,
    subscriptionCost: row.subscription_cost ?? undefined,
    mentorPlans: (row.mentor_plans as unknown as User['mentorPlans']) ?? undefined,
    availability: row.availability ?? undefined,
    menteeCapacity: row.mentee_capacity ?? undefined,
    mentorApprovalStatus: (row.mentor_approval_status as MentorApprovalStatus) ?? undefined,
    status: row.status,
    joinDate: row.join_date ?? undefined,
    experiences: (row.experiences as unknown as User['experiences']) ?? undefined,
  };
}

function userToProfileUpdate(
  user: Partial<User>,
): Database['public']['Tables']['profiles']['Update'] {
  const update: Database['public']['Tables']['profiles']['Update'] = {};
  if (user.name !== undefined) update.name = user.name;
  if (user.email !== undefined) update.email = user.email;
  if (user.role !== undefined) update.role = user.role;
  if (user.avatar !== undefined) update.avatar = user.avatar;
  if (user.registered !== undefined) update.registered = user.registered;
  if (user.phone !== undefined) update.phone = user.phone;
  if (user.location !== undefined) update.location = user.location;
  if (user.gender !== undefined) update.gender = user.gender;
  if (user.jobTitle !== undefined) update.job_title = user.jobTitle;
  if (user.company !== undefined) update.company = user.company;
  if (user.yearsOfExperience !== undefined) update.years_of_experience = user.yearsOfExperience;
  if (user.bio !== undefined) update.bio = user.bio;
  if (user.skills !== undefined) update.skills = user.skills;
  if (user.tools !== undefined) update.tools = user.tools;
  if (user.portfolioUrl !== undefined) update.portfolio_url = user.portfolioUrl;
  if (user.linkedin !== undefined) update.linkedin = user.linkedin;
  if (user.subscriptionCost !== undefined) update.subscription_cost = user.subscriptionCost;
  if (user.mentorPlans !== undefined)
    update.mentor_plans = user.mentorPlans as unknown as Database['public']['Tables']['profiles']['Update']['mentor_plans'];
  if (user.availability !== undefined) update.availability = user.availability;
  if (user.menteeCapacity !== undefined) update.mentee_capacity = user.menteeCapacity;
  if (user.mentorApprovalStatus !== undefined)
    update.mentor_approval_status = user.mentorApprovalStatus;
  if (user.status !== undefined) update.status = user.status;
  if (user.experiences !== undefined)
    update.experiences = user.experiences as unknown as Database['public']['Tables']['profiles']['Update']['experiences'];
  return update;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly supabase = inject(SupabaseService);

  /** Typed wrapper: runs a profiles .update() query and returns the updated row */
  private updateProfileRow(
    updates: Record<string, unknown>,
    id: string,
  ): Observable<{ data: ProfileRow | null; error: unknown }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = this.supabase.client.from('profiles');
    return from(
      q.update(updates).eq('id', id).select().single() as Promise<{
        data: ProfileRow | null;
        error: unknown;
      }>,
    );
  }

  login(payload: LoginPayload): Observable<User> {
    return from(
      this.supabase.client.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.user) {
          return throwError(() => new Error(error?.message ?? 'Login failed.'));
        }
        return from(
          this.supabase.client.from('profiles').select('*').eq('id', data.user.id).single(),
        ).pipe(
          map(({ data: profile, error: profileError }) => {
            if (profileError || !profile) throw new Error('Profile not found.');
            return profileRowToUser(profile);
          }),
        );
      }),
    );
  }

  signup(payload: SignupPayload): Observable<User> {
    const avatarInitials = payload.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return from(
      this.supabase.client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: { name: payload.name, role: payload.role, avatar: avatarInitials },
        },
      }),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data.user) {
          return throwError(() => new Error(error?.message ?? 'Signup failed.'));
        }
        const userId = data.user.id;
        // Fetch the auto-created profile (created by DB trigger on_auth_user_created)
        // then patch mentor_approval_status if needed
        const fetchProfile$ = from(
          this.supabase.client.from('profiles').select('*').eq('id', userId).single(),
        );
        if (payload.role !== UserRole.Mentor) {
          return fetchProfile$.pipe(
            map(({ data: profile, error: profileError }) => {
              if (profileError || !profile) throw new Error('Profile not found after signup.');
              return profileRowToUser(profile);
            }),
          );
        }
        return this.updateProfileRow({ mentor_approval_status: 'pending' }, userId).pipe(
          map(({ data: profile, error: profileError }) => {
            if (profileError || !profile) throw new Error('Failed to initialize mentor profile.');
            return profileRowToUser(profile);
          }),
        );
      }),
    );
  }

  loadCurrentUser(): Observable<string | null> {
    return from(this.supabase.client.auth.getSession()).pipe(
      map(({ data }) => data.session?.user?.id ?? null),
    );
  }

  updateProfile(updates: Partial<User>): Observable<User | null> {
    return from(this.supabase.client.auth.getSession()).pipe(
      switchMap(({ data }) => {
        const userId = data.session?.user?.id;
        if (!userId) return of(null);
        return this.updateProfileRow(userToProfileUpdate(updates) as Record<string, unknown>, userId).pipe(
          map(({ data: profile, error }) => {
            if (error || !profile) return null;
            return profileRowToUser(profile);
          }),
        );
      }),
    );
  }

  markRegistered(updates?: Partial<User>): Observable<User | null> {
    return this.updateProfile({ registered: true, ...updates });
  }

  logout(): Observable<void> {
    return from(this.supabase.client.auth.signOut()).pipe(map(() => undefined));
  }

  getProfileById(userId: string): Observable<User | null> {
    return from(
      this.supabase.client.from('profiles').select('*').eq('id', userId).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  getAllProfiles(): Observable<User[]> {
    return from(
      this.supabase.client.from('profiles').select('*').order('created_at'),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map(profileRowToUser);
      }),
    );
  }

  approveMentor(userId: string): Observable<User | null> {
    return this.updateProfileRow({ mentor_approval_status: 'approved' }, userId).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  rejectMentor(userId: string): Observable<User | null> {
    return this.updateProfileRow({ mentor_approval_status: 'rejected' }, userId).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  getPendingMentors(): Observable<User[]> {
    return from(
      this.supabase.client
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .eq('mentor_approval_status', 'pending'),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map(profileRowToUser);
      }),
    );
  }
}
