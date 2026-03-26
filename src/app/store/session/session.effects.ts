import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, tap, withLatestFrom } from 'rxjs';
import { catchError, of } from 'rxjs';
import { UserRole } from '../../core/models/user.model';
import { selectAuthUser } from '../../features/auth/store/auth.selectors';
import { loadCurrentUserSuccess, loginSuccess, logout, markRegistered, signupSuccess } from '../../features/auth/store/auth.actions';
import { initializeForRole, resetSession } from './session.actions';
import {
  loadMentorData,
  resetMentor,
} from '../mentor';
import {
  loadMenteeData,
  resetMentee,
} from '../mentee';
import {
  loadAdminData,
  loadAdminPayments,
  resetAdmin,
} from '../admin';
import { loadPlatformConfig } from '../platform/platform.actions';
import {
  loadConversations,
  resetMessaging,
} from '../messaging';
import {
  loadReports,
  resetReports,
} from '../reports';
import { loadNotifications, resetNotifications } from '../notifications';
import { AuthApiService } from '../../core/services/auth-api.service';
import { RealtimeService } from '../../core/services/realtime.service';
import type { MenteeListItem, PendingMentorshipRequest } from '../../core/models/dashboard.model';
import type { MentorshipWithProfiles } from '../../core/services/auth-api.service';

@Injectable()
export class SessionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);
  private readonly realtime = inject(RealtimeService);

  readonly initializeOnLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) this.store.dispatch(initializeForRole({ role: user.role }));
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnSignup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signupSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user?.registered) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnMarkRegistered$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(markRegistered),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([, user]) => {
          if (user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeOnLoadUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCurrentUserSuccess),
        withLatestFrom(this.store.select(selectAuthUser)),
        tap(([{ userId }, user]) => {
          if (userId && user) {
            this.store.dispatch(initializeForRole({ role: user.role }));
          } else {
            this.store.dispatch(resetSession());
          }
        }),
      ),
    { dispatch: false },
  );

  readonly initializeForRole$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(initializeForRole),
        withLatestFrom(this.store.select(selectAuthUser)),
        switchMap(([{ role }, user]) => {
          if (!user) {
            this.dispatchRoleData(role, null, null, [], [], []);
            return of(null);
          }

          const userId = user.id;

          // Start realtime subscriptions for messages + notifications
          this.realtime.startForUser(userId, role as UserRole);

          // Load conversations from Supabase
          const conversations$ = this.authApi.getConversations(userId);
          // Load mentorships from Supabase
          const mentorships$ = this.authApi.getMentorships(userId);
          // Load reports from Supabase (admin loads all, others load own)
          const reports$ = role === UserRole.Admin
            ? this.authApi.getAllMenteeReports()
            : this.authApi.getMenteeReports(userId);
          // Load notifications from Supabase
          const notifications$ = this.authApi.getNotifications(userId);

          return conversations$.pipe(
            switchMap((conversations) =>
              mentorships$.pipe(
                switchMap((mentorships) =>
                  reports$.pipe(
                    switchMap((reports) =>
                      notifications$.pipe(
                        switchMap((notificationRows) => {
                          const mentorUnread: Record<string, number> = {};
                          this.store.dispatch(loadConversations({
                            conversations,
                            mentorUnread: role === UserRole.Mentor ? mentorUnread : {},
                          }));

                          this.store.dispatch(loadReports({
                            menteeReviews: [],
                            mentorProfileReviews: [],
                            menteeReports: reports,
                          }));

                          this.store.dispatch(loadNotifications({
                            notifications: notificationRows.map((n) => ({
                              id: n.id,
                              userId: n.user_id,
                              type: n.type,
                              title: n.title,
                              body: n.body,
                              read: n.read,
                              metadata: (n.metadata as Record<string, unknown>) ?? {},
                              createdAt: n.created_at,
                            })),
                          }));

                          if (role === UserRole.Mentor) {
                            return this.authApi.getMentorPayments(userId).pipe(
                              tap((rows) => {
                                const earnings = this.mapPaymentsToEarnings(rows);
                                this.dispatchRoleData(role, userId, user, mentorships, [], [], earnings);
                              }),
                              catchError(() => {
                                this.dispatchRoleData(role, userId, user, mentorships, [], []);
                                return of(null);
                              }),
                            );
                          }

                          this.dispatchRoleData(role, userId, user, mentorships, [], []);

                          if (role !== UserRole.Admin) return of(null);

                          const payments$ = this.authApi.getAllPayments().pipe(
                            tap((rows) => {
                              const payments = rows.map((p) => ({
                                id: p.id,
                                date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                                mentee: p.mentee_profile?.name ?? 'Unknown Mentee',
                                mentor: p.mentor_profile?.name ?? 'Unknown Mentor',
                                amount: Number(p.amount),
                                status: (p.status === 'released' ? 'completed' : p.status) as 'completed' | 'in_escrow' | 'disputed' | 'refunded',
                                menteeId: p.mentee_id,
                                mentorId: p.mentor_id,
                              }));
                              this.store.dispatch(loadAdminPayments({ payments }));
                            }),
                            catchError(() => of(null)),
                          );

                          const config$ = this.authApi.getPlatformConfig().pipe(
                            tap((config) => {
                              if (config) {
                                this.store.dispatch(loadPlatformConfig({
                                  config: {
                                    samplePrice: 150,
                                    satisfactionRate: 98,
                                    countries: 50,
                                    platformFeePercent: config.platformFeePercent,
                                    escrowDays: config.escrowDays,
                                    minSubscriptionPrice: config.minSubscriptionPrice,
                                    maxSubscriptionPrice: config.maxSubscriptionPrice,
                                    maintenanceMode: config.maintenanceMode,
                                  },
                                }));
                              }
                            }),
                            catchError(() => of(null)),
                          );

                          return payments$.pipe(switchMap(() => config$));
                        }),
                        catchError(() => {
                          this.dispatchRoleData(role, userId, user, mentorships, [], []);
                          return of(null);
                        }),
                      ),
                    ),
                    catchError(() => {
                      this.dispatchRoleData(role, userId, user, [], [], []);
                      return of(null);
                    }),
                  ),
                ),
                catchError(() => {
                  this.store.dispatch(loadConversations({ conversations, mentorUnread: {} }));
                  this.store.dispatch(loadReports({
                    menteeReviews: [],
                    mentorProfileReviews: [],
                    menteeReports: [],
                  }));
                  this.dispatchRoleData(role, userId, user, [], [], []);
                  return of(null);
                }),
              ),
            ),
            catchError(() => {
              this.store.dispatch(loadConversations({ conversations: [], mentorUnread: {} }));
              this.store.dispatch(loadReports({
                menteeReviews: [],
                mentorProfileReviews: [],
                menteeReports: [],
              }));
              this.dispatchRoleData(role, userId, user, [], [], []);
              return of(null);
            }),
          );
        }),
      ),
    { dispatch: false },
  );

  private mapPaymentsToEarnings(
    rows: { amount: number; status: string; month: string | null; mentee_profile: { name: string } | null }[],
  ): { month: string; amount: number; status: string; mentees: number }[] {
    const byMonth = new Map<string, { amount: number; status: string; menteeNames: Set<string> }>();
    for (const p of rows) {
      const month = p.month ?? 'Unknown';
      const existing = byMonth.get(month);
      const displayStatus = p.status === 'released' ? 'Released' : p.status === 'in_escrow' ? 'In Escrow' : 'Pending';
      if (existing) {
        existing.amount += Number(p.amount);
        existing.menteeNames.add(p.mentee_profile?.name ?? 'Unknown');
        // Use the "worst" status: Pending > In Escrow > Released
        if (displayStatus === 'Pending' || (displayStatus === 'In Escrow' && existing.status === 'Released')) {
          existing.status = displayStatus;
        }
      } else {
        byMonth.set(month, {
          amount: Number(p.amount),
          status: displayStatus,
          menteeNames: new Set([p.mentee_profile?.name ?? 'Unknown']),
        });
      }
    }
    return Array.from(byMonth.entries()).map(([month, data]) => ({
      month,
      amount: data.amount,
      status: data.status,
      mentees: data.menteeNames.size,
    }));
  }

  private dispatchRoleData(
    role: string,
    userId: string | null,
    user: { acceptingMentees?: boolean; payoutAccount?: { type: 'bank' | 'instapay'; bankName?: string; accountNumber?: string; instapayNumber?: string }; notificationSettings?: { id: string; enabled: boolean }[] } | null,
    mentorships: MentorshipWithProfiles[],
    _unused1: unknown[],
    _unused2: unknown[],
    earnings?: { month: string; amount: number; status: string; mentees: number }[],
  ): void {
    if (role === UserRole.Mentor) {
      const pendingRequests: PendingMentorshipRequest[] = mentorships
        .filter((m) => m.status === 'pending' && m.mentor_id === userId)
        .map((m, idx) => {
          const menteeProfile = (m as unknown as { mentee_profile?: { name: string } | null })['mentee_profile'];
          return {
            id: idx + 1,
            mentorshipId: m.id,
            menteeUuid: m.mentee_id,
            name: menteeProfile?.name ?? 'Unknown Mentee',
            goal: m.goal ?? '',
            message: m.message ?? '',
            rating: null,
          };
        });

      const myMentees: MenteeListItem[] = mentorships
        .filter((m) => m.mentor_id === userId && (m.status === 'active' || m.status === 'pending' || m.status === 'completed'))
        .map((m, idx) => {
          const menteeProfile = (m as unknown as { mentee_profile?: { name: string; email?: string } | null })['mentee_profile'];
          return {
            id: idx + 1,
            menteeUuid: m.mentee_id,
            name: menteeProfile?.name ?? 'Unknown Mentee',
            avatar: '',
            email: (menteeProfile as { email?: string } | null | undefined)?.email ?? '',
            plan: 'Monthly',
            startDate: m.started_at ? new Date(m.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            progress: m.progress ?? 0,
            status: m.status === 'active' ? 'active' : m.status === 'completed' ? 'completed' : 'pending',
          };
        });

      this.store.dispatch(loadMentorData({
        stats: [],
        pendingRequests,
        activeMentees: myMentees
          .filter((m) => m.status === 'active')
          .map((m) => ({ id: m.id, name: m.name, goal: '', progress: m.progress, monthsActive: 0 })),
        earnings: earnings ?? [],
        myMentees,
        acceptingNewMentees: user?.acceptingMentees ?? true,
        payoutAccount: user?.payoutAccount ?? undefined,
        notificationSettings: user?.notificationSettings ?? undefined,
      }));
      this.store.dispatch(resetMentee());
      this.store.dispatch(resetAdmin());
    } else if (role === UserRole.Mentee) {
      const activeMentorship = mentorships.find((m) => m.mentee_id === userId && m.status === 'active');
      const mentorProfile = activeMentorship
        ? (activeMentorship as unknown as { mentor_profile?: { name: string; job_title?: string; company?: string; avatar?: string } | null })['mentor_profile']
        : null;

      const activeMentors = mentorships
        .filter((m) => m.mentee_id === userId && m.status === 'active')
        .map((m, idx) => {
          const mp = (m as unknown as { mentor_profile?: { name: string; job_title?: string; company?: string; avatar?: string } | null })['mentor_profile'];
          return {
            id: idx + 1,
            name: mp?.name ?? 'Unknown Mentor',
            title: mp?.job_title ?? '',
            company: mp?.company ?? '',
            image: mp?.avatar ?? '',
            startDate: m.started_at ? new Date(m.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            price: m.plan_amount ?? 0,
            progress: m.progress ?? 0,
          };
        });

      const pastMentors = mentorships
        .filter((m) => m.mentee_id === userId && m.status === 'completed')
        .map((m, idx) => {
          const mp = (m as unknown as { mentor_profile?: { name: string; job_title?: string; avatar?: string } | null })['mentor_profile'];
          return {
            id: idx + 1,
            mentorUuid: m.mentor_id,
            name: mp?.name ?? 'Unknown Mentor',
            title: mp?.job_title ?? '',
            image: mp?.avatar ?? '',
            startDate: m.started_at ? new Date(m.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            endDate: m.completed_at ? new Date(m.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
          };
        });

      this.store.dispatch(loadMenteeData({
        activeMentorship: activeMentorship && mentorProfile ? {
          mentorshipId: activeMentorship.id,
          mentorId: activeMentorship.mentor_id,
          mentorName: mentorProfile.name ?? '',
          mentorTitle: mentorProfile.job_title ?? '',
          mentorCompany: mentorProfile.company ?? '',
          mentorImage: mentorProfile.avatar ?? '',
          monthsActive: activeMentorship.months_active ?? 0,
          progress: activeMentorship.progress ?? 0,
        } : null,
        subscription: activeMentorship ? {
          planName: activeMentorship.plan_name ?? 'Monthly Mentorship',
          amount: activeMentorship.plan_amount ?? 0,
          currency: 'USD',
          nextBillingDate: activeMentorship.started_at
            ? new Date(new Date(activeMentorship.started_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '-',
          status: 'active',
          startedAt: activeMentorship.started_at ?? undefined,
        } : null,
        payments: [],
        myMentors: { active: activeMentors, past: pastMentors },
      }));
      this.store.dispatch(resetMentor());
      this.store.dispatch(resetAdmin());
    } else if (role === UserRole.Admin) {
      this.store.dispatch(loadAdminData({
        stats: [],
        pendingActions: [],
        recentActivities: [],
        reports: { metrics: [], revenueData: [], userGrowth: [], topMentors: [], recentActivity: [] },
        payments: [],
      }));
      this.store.dispatch(resetMentor());
      this.store.dispatch(resetMentee());
    } else {
      this.store.dispatch(resetMentor());
      this.store.dispatch(resetMentee());
      this.store.dispatch(resetAdmin());
    }
  }

  readonly resetOnLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        tap(() => {
          this.store.dispatch(resetSession());
        }),
      ),
    { dispatch: false },
  );

  readonly resetSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(resetSession),
        tap(() => {
          this.realtime.stopAll();
          this.store.dispatch(resetMentor());
          this.store.dispatch(resetMentee());
          this.store.dispatch(resetAdmin());
          this.store.dispatch(resetMessaging());
          this.store.dispatch(resetReports());
          this.store.dispatch(resetNotifications());
        }),
      ),
    { dispatch: false },
  );
}
