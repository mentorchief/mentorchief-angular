import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { SupabaseService } from './supabase.service';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sendChatMessage } from '../../store/messaging/messaging.actions';
import { addNotification } from '../../store/notifications/notifications.actions';
import type { AppNotification } from '../../store/notifications/notifications.state';
import type { Database } from '../models/database.types';
import { UserRole } from '../models/user.model';
import { setMentorPendingRequests, setMentorMentees } from '../../store/mentor/mentor.actions';
import type { MentorshipWithProfiles } from './auth-api.service';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

/**
 * Manages all Supabase Realtime subscriptions for the current session.
 * Call startForUser() on login, stopAll() on logout.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly store = inject(Store);

  private channels: RealtimeChannel[] = [];

  /** Active conversation ids this client is subscribed to for typing indicators. */
  private typingChannels = new Map<string, RealtimeChannel>();

  startForUser(userId: string, userRole: UserRole): void {
    this.stopAll();
    this.subscribeToMessages(userId, userRole);
    this.subscribeToNotifications(userId);
    if (userRole === UserRole.Mentor) {
      this.subscribeToMentorships(userId);
    }
  }

  stopAll(): void {
    for (const ch of this.channels) {
      this.supabase.client.removeChannel(ch);
    }
    this.channels = [];
    for (const ch of this.typingChannels.values()) {
      this.supabase.client.removeChannel(ch);
    }
    this.typingChannels.clear();
  }

  /** Subscribe to new messages in conversations the user participates in */
  private subscribeToMessages(userId: string, userRole: UserRole): void {
    const ch = this.supabase.client
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new as MessageRow;
          // Only add messages sent by the OTHER user (our own are already in the store via optimistic update)
          if (row.sender_id === userId) return;
          this.store.dispatch(
            sendChatMessage({
              conversationId: row.conversation_id,
              message: {
                senderId: row.sender_id,
                text: row.text,
                timestamp: new Date(row.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            }),
          );
        },
      )
      .subscribe();
    this.channels.push(ch);
  }

  /** Subscribe to notifications for this user */
  private subscribeToNotifications(userId: string): void {
    const ch = this.supabase.client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          const notification: AppNotification = {
            id: row.id,
            userId: row.user_id,
            type: row.type,
            title: row.title,
            body: row.body,
            read: row.read,
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            createdAt: row.created_at,
          };
          this.store.dispatch(addNotification({ notification }));
        },
      )
      .subscribe();
    this.channels.push(ch);
  }

  /** Subscribe to mentorships changes for a mentor — keeps pending requests and mentees list reactive */
  private subscribeToMentorships(userId: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = this.supabase.client;

    const refetch = (): void => {
      db.from('mentorships')
        .select('id, mentor_id, mentee_id, status, goal, message, progress, months_active, started_at, completed_at, created_at, mentor_profile:profiles!mentorships_mentor_id_fkey(id, name, job_title, company, avatar), mentee_profile:profiles!mentorships_mentee_id_fkey(id, name, email, avatar)')
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .then(({ data }: { data: MentorshipWithProfiles[] | null }) => {
          if (!data) return;

          const pendingRequests = data
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
                rating: null as number | null,
              };
            });

          const myMentees = data
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
                status: (m.status === 'active' ? 'active' : m.status === 'completed' ? 'completed' : 'pending') as 'active' | 'pending' | 'completed',
              };
            });

          this.store.dispatch(setMentorPendingRequests({ requests: pendingRequests }));
          this.store.dispatch(setMentorMentees({ myMentees }));
        });
    };

    const ch = this.supabase.client
      .channel(`mentorships:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorships',
          filter: `mentor_id=eq.${userId}`,
        },
        () => refetch(),
      )
      .subscribe();
    this.channels.push(ch);
  }

  /**
   * Subscribe to typing presence for a specific conversation.
   * Returns a function to broadcast "typing" from the current user.
   */
  subscribeToTyping(
    conversationId: string,
    currentUserId: string,
    onTyping: (userId: string, isTyping: boolean) => void,
  ): (isTyping: boolean) => void {
    // Remove previous channel for this conversation if any
    const existing = this.typingChannels.get(conversationId);
    if (existing) {
      this.supabase.client.removeChannel(existing);
    }

    const ch = this.supabase.client
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload: Record<string, unknown>) => {
        const { userId, isTyping } = payload['payload'] as { userId: string; isTyping: boolean };
        if (userId !== currentUserId) {
          onTyping(userId, isTyping);
        }
      })
      .subscribe();

    this.typingChannels.set(conversationId, ch);

    // Return a broadcast function
    return (isTyping: boolean) => {
      ch.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping },
      });
    };
  }

  unsubscribeFromTyping(conversationId: string): void {
    const ch = this.typingChannels.get(conversationId);
    if (ch) {
      this.supabase.client.removeChannel(ch);
      this.typingChannels.delete(conversationId);
    }
  }

  ngOnDestroy(): void {
    this.stopAll();
  }
}
