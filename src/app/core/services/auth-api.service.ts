import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import type { LoginPayload, SignupPayload } from '../models/auth.model';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import type { Database } from '../models/database.types';
import type { ChatConversation, ChatMessageCore } from '../models/chat.model';
import type { MenteeReport, MentorProfileReview } from '../models/dashboard.model';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MentorshipRow = Database['public']['Tables']['mentorships']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MenteeReportRow = Database['public']['Tables']['mentee_reports']['Row'];
type MentorReviewRow = Database['public']['Tables']['mentor_reviews']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];

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
    acceptingMentees: row.accepting_mentees ?? true,
    payoutAccount: (row.payout_account as unknown as User['payoutAccount']) ?? undefined,
    notificationSettings: (row.notification_settings as unknown as User['notificationSettings']) ?? undefined,
    rejectionReason: (row as Record<string, unknown>)['rejection_reason'] as string ?? undefined,
    featured: (row as Record<string, unknown>)['featured'] as boolean ?? false,
    expertiseCategory: (row as Record<string, unknown>)['expertise_category'] as string ?? undefined,
    deletedAt: (row as Record<string, unknown>)['deleted_at'] as string ?? undefined,
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
  if (user.acceptingMentees !== undefined)
    (update as Record<string, unknown>)['accepting_mentees'] = user.acceptingMentees;
  if (user.payoutAccount !== undefined)
    (update as Record<string, unknown>)['payout_account'] = user.payoutAccount;
  if (user.rejectionReason !== undefined)
    (update as Record<string, unknown>)['rejection_reason'] = user.rejectionReason;
  if (user.featured !== undefined)
    (update as Record<string, unknown>)['featured'] = user.featured;
  if (user.expertiseCategory !== undefined)
    (update as Record<string, unknown>)['expertise_category'] = user.expertiseCategory;
  if (user.deletedAt !== undefined)
    (update as Record<string, unknown>)['deleted_at'] = user.deletedAt;
  return update;
}

export interface MentorshipWithProfiles extends MentorshipRow {
  mentor_profile?: ProfileRow | null;
  mentee_profile?: ProfileRow | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly supabase = inject(SupabaseService);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any { return this.supabase.client; }

  /** Returns the current authenticated user's UUID, or throws if not authenticated. */
  private getCurrentUserId(): Observable<string> {
    return from(this.supabase.client.auth.getSession()).pipe(
      map(({ data }) => {
        const id = data.session?.user?.id;
        if (!id) throw new Error('Not authenticated.');
        return id;
      }),
    );
  }

  /** Asserts that the currently authenticated user has the required role. Throws otherwise. */
  private assertRole(requiredRole: UserRole): Observable<string> {
    return this.getCurrentUserId().pipe(
      switchMap((userId) =>
        from(
          (this.db.from('profiles').select('role').eq('id', userId).single()) as Promise<{ data: { role: string } | null; error: unknown }>,
        ).pipe(
          map(({ data }) => {
            if (!data || data.role !== requiredRole) {
              throw new Error(`Forbidden: requires role ${requiredRole}.`);
            }
            return userId;
          }),
        ),
      ),
    );
  }

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
          this.db.from('profiles').select('*').eq('id', data.user.id).single() as Promise<{ data: ProfileRow | null; error: unknown }>,
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
          this.db.from('profiles').select('*').eq('id', userId).single() as Promise<{ data: ProfileRow | null; error: unknown }>,
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
      this.db.from('profiles').select('*').eq('id', userId).single() as Promise<{ data: ProfileRow | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  getAllProfiles(): Observable<User[]> {
    return from(
      this.db.from('profiles').select('*').order('created_at') as Promise<{ data: ProfileRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map(profileRowToUser);
      }),
    );
  }

  getApprovedMentors(): Observable<User[]> {
    return from(
      (this.db
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .eq('registered', true)
        .eq('mentor_approval_status', 'approved')
        .neq('status', 'suspended')
        .order('name')) as Promise<{ data: ProfileRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map(profileRowToUser);
      }),
    );
  }

  approveMentor(userId: string): Observable<User | null> {
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() => this.updateProfileRow({ mentor_approval_status: 'approved' }, userId)),
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  rejectMentor(userId: string, reason?: string): Observable<User | null> {
    const updates: Record<string, unknown> = { mentor_approval_status: 'rejected' };
    if (reason) updates['rejection_reason'] = reason;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() => this.updateProfileRow(updates, userId)),
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  updateUserStatus(userId: string, status: 'active' | 'suspended'): Observable<User | null> {
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() => this.updateProfileRow({ status }, userId)),
      map(({ data, error }) => {
        if (error || !data) return null;
        return profileRowToUser(data);
      }),
    );
  }

  updateMentorAccepting(userId: string, accepting: boolean): Observable<void> {
    return this.getCurrentUserId().pipe(
      switchMap((callerId) => {
        if (callerId !== userId) throw new Error('Forbidden: cannot update another user\'s settings.');
        return this.updateProfileRow({ accepting_mentees: accepting }, userId);
      }),
      map(() => undefined),
    );
  }

  updateMentorPayoutAccount(userId: string, payoutAccount: Record<string, unknown>): Observable<void> {
    return this.getCurrentUserId().pipe(
      switchMap((callerId) => {
        if (callerId !== userId) throw new Error('Forbidden: cannot update another user\'s payout account.');
        return this.updateProfileRow({ payout_account: payoutAccount }, userId);
      }),
      map(() => undefined),
    );
  }

  getPlatformConfig(): Observable<{
    platformFeePercent: number;
    escrowDays: number;
    minSubscriptionPrice: number;
    maxSubscriptionPrice: number;
    maintenanceMode: boolean;
  } | null> {
    return from(
      (this.db.from('platform_config').select('*').eq('id', 1).maybeSingle()) as Promise<{ data: Record<string, unknown> | null; error: unknown }>,
    ).pipe(
      map(({ data }) => {
        if (!data) return null;
        return {
          platformFeePercent: (data['platform_fee_percent'] as number) ?? 10,
          escrowDays: (data['escrow_days'] as number) ?? 30,
          minSubscriptionPrice: (data['min_subscription_price'] as number) ?? 50,
          maxSubscriptionPrice: (data['max_subscription_price'] as number) ?? 1000,
          maintenanceMode: (data['maintenance_mode'] as boolean) ?? false,
        };
      }),
    );
  }

  saveNotificationSettings(userId: string, settings: { id: string; enabled: boolean }[]): Observable<void> {
    return this.getCurrentUserId().pipe(
      switchMap((callerId) => {
        if (callerId !== userId) throw new Error('Forbidden: cannot update another user\'s notification settings.');
        return this.updateProfileRow({ notification_settings: settings as unknown as Record<string, unknown> }, userId);
      }),
      map(() => undefined),
    );
  }

  savePlatformConfig(config: {
    platformFeePercent?: number;
    escrowDays?: number;
    minSubscriptionPrice?: number;
    maxSubscriptionPrice?: number;
    maintenanceMode?: boolean;
  }): Observable<void> {
    const row: Record<string, unknown> = { id: 1 };
    if (config.platformFeePercent !== undefined) row['platform_fee_percent'] = config.platformFeePercent;
    if (config.escrowDays !== undefined) row['escrow_days'] = config.escrowDays;
    if (config.minSubscriptionPrice !== undefined) row['min_subscription_price'] = config.minSubscriptionPrice;
    if (config.maxSubscriptionPrice !== undefined) row['max_subscription_price'] = config.maxSubscriptionPrice;
    if (config.maintenanceMode !== undefined) row['maintenance_mode'] = config.maintenanceMode;
    return from(
      (this.db.from('platform_config').upsert(row)) as Promise<{ error: unknown }>,
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getPendingMentors(): Observable<User[]> {
    return from(
      (this.db
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .eq('registered', true)
        .eq('mentor_approval_status', 'pending')) as Promise<{ data: ProfileRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map(profileRowToUser);
      }),
    );
  }

  // ─── Mentorship methods ───────────────────────────────────────────────────

  requestMentorship(
    mentorId: string,
    menteeId: string,
    goal: string,
    message: string,
    planName: string,
    amount: number,
  ): Observable<MentorshipRow> {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentorships')
        .insert({
          mentor_id: mentorId,
          mentee_id: menteeId,
          status: 'pending',
          goal,
          message,
          plan_name: planName,
          plan_amount: amount,
          progress: 0,
          months_active: 0,
          started_at: null,
          completed_at: null,
        })
        .select()
        .single() as Promise<{ data: MentorshipRow | null; error: { message: string } | null }>,
    ).pipe(
      switchMap(({ data: mentorshipData, error: mentorshipError }) => {
        if (mentorshipError || !mentorshipData) {
          return throwError(() => new Error(mentorshipError?.message ?? 'Failed to create mentorship request.'));
        }
        // Also create a subscription record
        const nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        return from(
          db.from('subscriptions').insert({
            mentee_id: menteeId,
            mentor_id: mentorId,
            plan_name: planName,
            amount,
            currency: 'USD',
            status: 'active',
            next_billing_date: nextBillingDate.toISOString(),
            started_at: now,
          }) as Promise<{ data: unknown; error: unknown }>,
        ).pipe(
          map(() => mentorshipData),
        );
      }),
    );
  }

  getMentorships(userId: string): Observable<MentorshipWithProfiles[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentorships')
        .select('id, mentor_id, mentee_id, status, goal, message, progress, months_active, plan_name, plan_amount, started_at, completed_at, created_at, mentor_profile:profiles!mentorships_mentor_id_fkey(id, name, job_title, company, avatar), mentee_profile:profiles!mentorships_mentee_id_fkey(id, name, email, avatar)')
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order('created_at', { ascending: false }) as Promise<{ data: MentorshipWithProfiles[] | null; error: { message: string } | null }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }

  acceptMentorship(mentorshipId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.getCurrentUserId().pipe(
      switchMap((callerId) =>
        from(
          db.from('mentorships')
            .update({ status: 'active', started_at: new Date().toISOString() })
            .eq('id', mentorshipId)
            .eq('mentor_id', callerId)  // frontend: only the mentor of this row
            .eq('status', 'pending')    // frontend: can only accept pending requests
            .select()
            .single() as Promise<{ data: MentorshipRow | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  declineMentorship(mentorshipId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.getCurrentUserId().pipe(
      switchMap((callerId) =>
        from(
          db.from('mentorships')
            .update({ status: 'cancelled' })
            .eq('id', mentorshipId)
            .eq('mentor_id', callerId)  // frontend: only the mentor of this row
            .select()
            .single() as Promise<{ data: MentorshipRow | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  cancelMentorship(mentorshipId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.getCurrentUserId().pipe(
      switchMap((callerId) =>
        from(
          db.from('mentorships')
            .update({ status: 'cancelled' })
            .eq('id', mentorshipId)
            .eq('mentee_id', callerId)  // frontend: only the mentee of this row can cancel
            .select()
            .single() as Promise<{ data: MentorshipRow | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  getMentorshipForMenteeAndMentor(menteeId: string, mentorId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentorships')
        .select('*')
        .eq('mentee_id', menteeId)
        .eq('mentor_id', mentorId)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as Promise<{ data: MentorshipRow | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  // ─── Messaging methods ────────────────────────────────────────────────────

  getOrCreateConversation(mentorId: string, menteeId: string): Observable<ConversationRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('conversations')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('mentee_id', menteeId)
        .maybeSingle() as Promise<{ data: ConversationRow | null; error: unknown }>,
    ).pipe(
      switchMap(({ data: existing }) => {
        if (existing) return of(existing);
        return from(
          db.from('conversations')
            .insert({ mentor_id: mentorId, mentee_id: menteeId, last_message: null, last_timestamp: null })
            .select()
            .single() as Promise<{ data: ConversationRow | null; error: { message: string } | null }>,
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) throw new Error(error?.message ?? 'Failed to create conversation.');
            return data;
          }),
        );
      }),
    );
  }

  getConversations(userId: string): Observable<ChatConversation[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('conversations')
        .select('*, mentor_profile:profiles!conversations_mentor_id_fkey(id, name, avatar), mentee_profile:profiles!conversations_mentee_id_fkey(id, name, avatar)')
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order('updated_at', { ascending: false }) as Promise<{ data: (ConversationRow & { mentor_profile: { id: string; name: string; avatar: string | null } | null; mentee_profile: { id: string; name: string; avatar: string | null } | null })[] | null; error: unknown }>,
    ).pipe(
      switchMap(({ data: convRows, error }) => {
        if (error || !convRows || convRows.length === 0) return of([]);
        const convIds = convRows.map((c) => c.id);
        return from(
          db.from('messages')
            .select('conversation_id, sender_id, text, created_at')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true }) as Promise<{ data: { conversation_id: string; sender_id: string; text: string; created_at: string }[] | null; error: unknown }>,
        ).pipe(
          map(({ data: msgRows }) => {
            type MsgSlim = { conversation_id: string; sender_id: string; text: string; created_at: string };
            const msgsByConv: Record<string, MsgSlim[]> = {};
            for (const msg of msgRows ?? []) {
              if (!msgsByConv[msg.conversation_id]) msgsByConv[msg.conversation_id] = [];
              msgsByConv[msg.conversation_id].push(msg);
            }
            return convRows.map((conv) => {
              const mentorProfile = conv.mentor_profile;
              const menteeProfile = conv.mentee_profile;
              const msgs: ChatMessageCore[] = (msgsByConv[conv.id] ?? []).map((m, idx) => ({
                id: idx + 1,
                senderId: m.sender_id,
                text: m.text,
                timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              }));
              const chatConv: ChatConversation = {
                id: conv.id,
                mentorId: conv.mentor_id,
                mentorProfileId: conv.mentor_id,
                menteeId: conv.mentee_id,
                mentorName: mentorProfile?.name ?? 'Mentor',
                menteeName: menteeProfile?.name ?? 'Mentee',
                lastMessage: conv.last_message ?? '',
                lastTimestamp: conv.last_timestamp
                  ? new Date(conv.last_timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '',
                status: 'active',
                messages: msgs.map((m) => ({
                  ...m,
                  senderName: m.senderId === conv.mentor_id ? (mentorProfile?.name ?? 'Mentor') : (menteeProfile?.name ?? 'Mentee'),
                  senderRole: m.senderId === conv.mentor_id ? UserRole.Mentor : UserRole.Mentee,
                })),
              };
              return chatConv;
            });
          }),
        );
      }),
    );
  }

  sendMessage(
    conversationId: string,
    _ignoredSenderId: string,
    text: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'pdf' | 'doc',
  ): Observable<MessageRow> {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    // Always derive sender_id from the authenticated session — never trust the caller-supplied value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { conversation_id: conversationId, sender_id: null, text };
    if (attachmentUrl) row.attachment_url = attachmentUrl;
    if (attachmentType) row.attachment_type = attachmentType;
    return this.getCurrentUserId().pipe(
      switchMap((callerId) => {
        row.sender_id = callerId;
        return from(
          db.from('messages')
            .insert(row)
            .select()
            .single() as Promise<{ data: MessageRow | null; error: { message: string } | null }>,
        );
      }),
      switchMap(({ data: msgData, error: msgError }) => {
        if (msgError || !msgData) {
          return throwError(() => new Error(msgError?.message ?? 'Failed to send message.'));
        }
        const lastMsg = attachmentUrl ? (text || 'Sent an attachment') : text;
        return from(
          db.from('conversations')
            .update({ last_message: lastMsg, last_timestamp: now })
            .eq('id', conversationId) as Promise<{ data: unknown; error: unknown }>,
        ).pipe(map(() => msgData));
      }),
    );
  }

  uploadAttachment(conversationId: string, file: File): Observable<string> {
    const path = `${conversationId}/${Date.now()}_${file.name}`;
    return from(
      this.supabase.client.storage.from('attachments').upload(path, file),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.supabase.client.storage.from('attachments').getPublicUrl(data!.path).data.publicUrl;
      }),
    );
  }

  // ─── Reports methods ──────────────────────────────────────────────────────

  insertMenteeReport(reportData: {
    menteeId: string;
    mentorId: string;
    mentorName: string;
    summary: string;
    rating: number;
    behaviour: string;
    strengths: string[];
    weaknesses: string[];
    areasToDevelop: string[];
    recommendations: string;
  }): Observable<MenteeReportRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentee_reports')
        .insert({
          mentee_id: reportData.menteeId,
          mentor_id: reportData.mentorId,
          mentor_name: reportData.mentorName,
          summary: reportData.summary,
          rating: reportData.rating,
          behaviour: reportData.behaviour,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          areas_to_develop: reportData.areasToDevelop,
          recommendations: reportData.recommendations,
        })
        .select()
        .single() as Promise<{ data: MenteeReportRow | null; error: { message: string } | null }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to insert mentee report.');
        return data;
      }),
    );
  }

  getMenteeReports(userId: string): Observable<MenteeReport[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentee_reports')
        .select('*')
        .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
        .order('created_at', { ascending: false }) as Promise<{ data: MenteeReportRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return this.mapReportRows(data);
      }),
    );
  }

  getReportsForMentee(menteeId: string): Observable<MenteeReport[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentee_reports')
        .select('*')
        .eq('mentee_id', menteeId)
        .order('created_at', { ascending: false }) as Promise<{ data: MenteeReportRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return this.mapReportRows(data);
      }),
    );
  }

  getAllMenteeReports(): Observable<MenteeReport[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentee_reports')
        .select('*, mentee_profile:profiles!mentee_id(name)')
        .order('created_at', { ascending: false }) as Promise<{ data: (MenteeReportRow & { mentee_profile?: { name: string } | null })[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map((r, idx): MenteeReport => ({
          ...this.mapReportRows([r])[0],
          id: idx + 1,
          menteeName: r.mentee_profile?.name,
          reportId: r.id,
        }));
      }),
    );
  }

  private mapReportRows(data: MenteeReportRow[]): MenteeReport[] {
    return data.map((r, idx): MenteeReport => ({
      id: idx + 1,
      reportId: r.id,
      menteeId: r.mentee_id,
      mentorId: r.mentor_id,
      mentorName: r.mentor_name,
      createdAt: r.created_at,
      summary: r.summary,
      rating: r.rating,
      behaviour: r.behaviour,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      areasToDevelop: r.areas_to_develop,
      recommendations: r.recommendations,
      status: (r as Record<string, unknown>)['status'] as MenteeReport['status'] ?? 'pending_validation',
      rejectionReason: (r as Record<string, unknown>)['rejection_reason'] as string ?? undefined,
    }));
  }

  submitMentorReview(
    mentorId: string,
    menteeId: string,
    rating: number,
    comment: string,
  ): Observable<MentorReviewRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentor_reviews')
        .upsert(
          { mentor_id: mentorId, mentee_id: menteeId, rating, comment, submitted_at: new Date().toISOString() },
          { onConflict: 'mentor_id,mentee_id' },
        )
        .select()
        .single() as Promise<{ data: MentorReviewRow | null; error: { message: string } | null }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to submit review.');
        return data;
      }),
    );
  }

  // ─── Notifications methods ────────────────────────────────────────────────

  getNotifications(userId: string): Observable<NotificationRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50) as Promise<{ data: NotificationRow[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }

  createNotification(notification: {
    userId: string;
    type: NotificationRow['type'];
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Observable<NotificationRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          metadata: notification.metadata ?? {},
        })
        .select()
        .single() as Promise<{ data: NotificationRow | null; error: { message: string } | null }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to create notification.');
        return data;
      }),
    );
  }

  markNotificationRead(notificationId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('notifications')
        .update({ read: true })
        .eq('id', notificationId) as Promise<{ error: unknown }>,
    ).pipe(map(() => undefined));
  }

  markAllNotificationsRead(userId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false) as Promise<{ error: unknown }>,
    ).pipe(map(() => undefined));
  }

  // ─── Payments methods ─────────────────────────────────────────────────────

  getMentorPayments(mentorId: string): Observable<(PaymentRow & { mentee_profile: { name: string } | null })[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('payments')
        .select('id, mentor_id, mentee_id, amount, status, month, plan_name, release_date, paid_to_mentor, created_at, mentee_profile:profiles!payments_mentee_id_fkey(name)')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false }) as Promise<{
          data: (PaymentRow & { mentee_profile: { name: string } | null })[] | null;
          error: unknown;
        }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }

  getAllPayments(): Observable<(PaymentRow & { mentee_profile: { name: string } | null; mentor_profile: { name: string } | null })[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('payments')
        .select('*, mentee_profile:profiles!payments_mentee_id_fkey(name), mentor_profile:profiles!payments_mentor_id_fkey(name)')
        .order('created_at', { ascending: false }) as Promise<{
          data: (PaymentRow & { mentee_profile: { name: string } | null; mentor_profile: { name: string } | null })[] | null;
          error: unknown;
        }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }

  releasePayment(paymentId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('payments')
        .update({ status: 'released', paid_to_mentor: true, release_date: new Date().toISOString().split('T')[0] })
        .eq('id', paymentId) as Promise<{ error: unknown }>,
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── BE-driven search/filter/pagination methods ─────────────────────────

  searchMentorReports(
    mentorId: string,
    params: { query?: string; ratingMin?: number; ratingMax?: number; page?: number; pageSize?: number },
  ): Observable<{ data: (MenteeReportRow & { mentee_profile?: { name: string } | null })[]; count: number }> {
    const pg = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const rangeStart = (pg - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    let q = db.from('mentee_reports')
      .select('*, mentee_profile:profiles!mentee_id(name)', { count: 'exact' })
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });
    if (params.query) {
      q = q.or(`summary.ilike.%${params.query}%,mentor_name.ilike.%${params.query}%`);
    }
    if (params.ratingMin != null) q = q.gte('rating', params.ratingMin);
    if (params.ratingMax != null) q = q.lte('rating', params.ratingMax);
    q = q.range(rangeStart, rangeEnd);
    return from(
      q as Promise<{ data: (MenteeReportRow & { mentee_profile?: { name: string } | null })[] | null; count: number | null; error: unknown }>,
    ).pipe(
      map(({ data, count, error }) => ({
        data: error || !data ? [] : data,
        count: count ?? 0,
      })),
    );
  }

  searchMentorMentees(
    mentorId: string,
    params: { query?: string; status?: string; page?: number; pageSize?: number },
  ): Observable<{ data: (MentorshipRow & { mentee_profile?: ProfileRow | null })[]; count: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    let q = db.from('mentorships')
      .select('*, mentee_profile:profiles!mentorships_mentee_id_fkey(id, name, email, avatar)', { count: 'exact' })
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });
    if (params.status) q = q.eq('status', params.status);
    q = q.range(rangeFrom, rangeTo);
    return from(
      q as Promise<{ data: (MentorshipRow & { mentee_profile?: ProfileRow | null })[] | null; count: number | null; error: unknown }>,
    ).pipe(
      map(({ data, count, error }) => {
        let rows = error || !data ? [] : data;
        if (params.query) {
          const lq = params.query.toLowerCase();
          rows = rows.filter((r) => {
            const name = (r.mentee_profile as Record<string, unknown> | null)?.['name'] as string | undefined;
            const email = (r.mentee_profile as Record<string, unknown> | null)?.['email'] as string | undefined;
            return (name?.toLowerCase().includes(lq)) || (email?.toLowerCase().includes(lq));
          });
        }
        return { data: rows, count: params.query ? rows.length : (count ?? 0) };
      }),
    );
  }

  searchConversations(
    userId: string,
    query: string,
  ): Observable<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    // Search conversations by participant name
    return from(
      db.from('conversations')
        .select('id, mentor_profile:profiles!conversations_mentor_id_fkey(name), mentee_profile:profiles!conversations_mentee_id_fkey(name)')
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`) as Promise<{
          data: { id: string; mentor_profile: { name: string } | null; mentee_profile: { name: string } | null }[] | null;
          error: unknown;
        }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        const lq = query.toLowerCase();
        return data
          .filter((c) =>
            c.mentor_profile?.name?.toLowerCase().includes(lq) ||
            c.mentee_profile?.name?.toLowerCase().includes(lq),
          )
          .map((c) => c.id);
      }),
    );
  }

  searchMentorPayments(
    mentorId: string,
    params: { query?: string; status?: string; page?: number; pageSize?: number },
  ): Observable<{ data: (PaymentRow & { mentee_profile: { name: string } | null })[]; count: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    let q = db.from('payments')
      .select('id, mentor_id, mentee_id, amount, status, month, plan_name, release_date, paid_to_mentor, created_at, mentee_profile:profiles!payments_mentee_id_fkey(name)', { count: 'exact' })
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });
    if (params.status) q = q.eq('status', params.status);
    q = q.range(rangeFrom, rangeTo);
    return from(
      q as Promise<{ data: (PaymentRow & { mentee_profile: { name: string } | null })[] | null; count: number | null; error: unknown }>,
    ).pipe(
      map(({ data, count, error }) => {
        let rows = error || !data ? [] : data;
        if (params.query) {
          const lq = params.query.toLowerCase();
          rows = rows.filter((r) =>
            r.mentee_profile?.name?.toLowerCase().includes(lq) ||
            r.month?.toLowerCase().includes(lq) ||
            r.plan_name?.toLowerCase().includes(lq),
          );
        }
        return { data: rows, count: params.query ? rows.length : (count ?? 0) };
      }),
    );
  }

  getMentorReviews(mentorId: string): Observable<MentorProfileReview[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('mentor_reviews')
        .select('*, mentee_profile:profiles!mentor_reviews_mentee_id_fkey(name)')
        .eq('mentor_id', mentorId)
        .order('submitted_at', { ascending: false }) as Promise<{ data: (MentorReviewRow & { mentee_profile: { name: string } | null })[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data.map((r): MentorProfileReview => ({
          mentorId: r.mentor_id,
          name: r.mentee_profile?.name ?? 'Mentee',
          rating: r.rating,
          text: r.comment ?? '',
          submittedAt: r.submitted_at ?? undefined,
        }));
      }),
    );
  }

  // ─── Profile Photo Upload ──────────────────────────────────────────────────

  uploadProfilePhoto(userId: string, file: File): Observable<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `avatars/${userId}.${ext}`;
    return from(
      this.supabase.client.storage.from('avatars').upload(path, file, { upsert: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to upload photo.');
        const { data: urlData } = this.supabase.client.storage.from('avatars').getPublicUrl(path);
        return urlData.publicUrl;
      }),
    );
  }

  // ─── Admin: Mentorship management ──────────────────────────────────────────

  adminActivateMentorship(mentorshipId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('mentorships')
            .update({ status: 'active', started_at: new Date().toISOString() })
            .eq('id', mentorshipId)
            .select()
            .single() as Promise<{ data: MentorshipRow | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  adminCancelMentorship(mentorshipId: string): Observable<MentorshipRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('mentorships')
            .update({ status: 'cancelled', completed_at: new Date().toISOString() })
            .eq('id', mentorshipId)
            .select()
            .single() as Promise<{ data: MentorshipRow | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return null;
        return data;
      }),
    );
  }

  // ─── Admin: Payment management ─────────────────────────────────────────────

  createPaymentRecord(payment: {
    menteeId: string;
    mentorId: string;
    amount: number;
    currency: string;
    planName: string;
    paymentReference?: string;
    adminNotes?: string;
  }): Observable<PaymentRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('payments')
            .insert({
              mentee_id: payment.menteeId,
              mentor_id: payment.mentorId,
              amount: payment.amount,
              currency: payment.currency,
              status: 'in_escrow',
              plan_name: payment.planName,
              payment_reference: payment.paymentReference ?? null,
              admin_notes: payment.adminNotes ?? null,
              paid_to_mentor: false,
            })
            .select()
            .single() as Promise<{ data: PaymentRow | null; error: { message: string } | null }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to create payment record.');
        return data;
      }),
    );
  }

  refundPayment(paymentId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('payments')
            .update({ status: 'refunded' })
            .eq('id', paymentId) as Promise<{ error: unknown }>,
        ),
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── Admin: Report Validation ──────────────────────────────────────────────

  validateReport(reportId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('mentee_reports')
            .update({ status: 'validated' })
            .eq('id', reportId) as Promise<{ error: unknown }>,
        ),
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  rejectReport(reportId: string, reason: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('mentee_reports')
            .update({ status: 'rejected', rejection_reason: reason })
            .eq('id', reportId) as Promise<{ error: unknown }>,
        ),
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── Admin: User soft delete ───────────────────────────────────────────────

  softDeleteUser(userId: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() => {
        const now = new Date().toISOString();
        // Cancel all active mentorships
        const cancelMentorships$ = from(
          db.from('mentorships')
            .update({ status: 'cancelled', completed_at: now })
            .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
            .in('status', ['pending', 'active']) as Promise<{ error: unknown }>,
        );
        // Cancel all active subscriptions
        const cancelSubs$ = from(
          db.from('subscriptions')
            .update({ status: 'cancelled' })
            .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
            .eq('status', 'active') as Promise<{ error: unknown }>,
        );
        // Refund in_escrow payments
        const refundPayments$ = from(
          db.from('payments')
            .update({ status: 'refunded' })
            .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
            .eq('status', 'in_escrow') as Promise<{ error: unknown }>,
        );
        // Soft-delete the profile
        const deleteProfile$ = from(
          db.from('profiles')
            .update({ deleted_at: now, status: 'suspended' })
            .eq('id', userId) as Promise<{ error: unknown }>,
        );
        return cancelMentorships$.pipe(
          switchMap(() => cancelSubs$),
          switchMap(() => refundPayments$),
          switchMap(() => deleteProfile$),
        );
      }),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── Expertise Categories ──────────────────────────────────────────────────

  getExpertiseCategories(): Observable<{ id: string; name: string }[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return from(
      db.from('expertise_categories')
        .select('id, name')
        .order('name') as Promise<{ data: { id: string; name: string }[] | null; error: unknown }>,
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }

  createExpertiseCategory(name: string): Observable<{ id: string; name: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('expertise_categories')
            .insert({ name })
            .select()
            .single() as Promise<{ data: { id: string; name: string } | null; error: { message: string } | null }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? 'Failed to create category.');
        return data;
      }),
    );
  }

  deleteExpertiseCategory(id: string): Observable<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('expertise_categories')
            .delete()
            .eq('id', id) as Promise<{ error: unknown }>,
        ),
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── Full Platform Config ──────────────────────────────────────────────────

  getFullPlatformConfig(): Observable<Record<string, unknown> | null> {
    return from(
      (this.db.from('platform_config').select('*').eq('id', 1).maybeSingle()) as Promise<{ data: Record<string, unknown> | null; error: unknown }>,
    ).pipe(
      map(({ data }) => data),
    );
  }

  saveFullPlatformConfig(config: Record<string, unknown>): Observable<void> {
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          (this.db.from('platform_config').upsert({ id: 1, ...config })) as Promise<{ error: unknown }>,
        ),
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // ─── Admin: Get all mentorships ────────────────────────────────────────────

  getAllMentorships(): Observable<MentorshipWithProfiles[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;
    return this.assertRole(UserRole.Admin).pipe(
      switchMap(() =>
        from(
          db.from('mentorships')
            .select('*, mentor_profile:profiles!mentorships_mentor_id_fkey(id, name, email, avatar), mentee_profile:profiles!mentorships_mentee_id_fkey(id, name, email, avatar)')
            .order('created_at', { ascending: false }) as Promise<{ data: MentorshipWithProfiles[] | null; error: unknown }>,
        ),
      ),
      map(({ data, error }) => {
        if (error || !data) return [];
        return data;
      }),
    );
  }
}
