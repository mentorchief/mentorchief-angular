import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import type { ChatMessage } from '../../core/models/chat.model';
import { isConversationClosed } from '../../core/utils/chat.utils';
import { UserRole } from '../../core/models/user.model';
import { MessagingActions } from '../messaging/messaging.actions';
import { selectAllUsers } from '../users/users.selectors';
import { selectMessagingState } from '../messaging/messaging.selectors';

@Injectable()
export class MessagingEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  readonly sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MessagingActions.sendMessage),
      withLatestFrom(this.store.select(selectAllUsers), this.store.select(selectMessagingState)),
      filter(([{ conversationId }, _, messaging]) => {
        const conv = messaging.conversations.find((c) => c.id === conversationId);
        if (!conv) return false;
        return !isConversationClosed(conv.status, conv.subscription);
      }),
      map(([{ conversationId, message }, users, messaging]) => {
        const conv = messaging.conversations.find((c) => c.id === conversationId);
        const sender = users.find((u) => u.id === message.senderId);
        const nextId = conv?.messages.length
          ? Math.max(...conv.messages.map((m) => m.id)) + 1
          : 1;
        const fullMessage: ChatMessage = {
          ...message,
          id: nextId,
          senderName: sender?.name ?? 'Unknown',
          senderRole:
            conv && message.senderId === conv.mentorId ? UserRole.Mentor : UserRole.Mentee,
        };
        return MessagingActions.messageAppended({ conversationId, message: fullMessage });
      }),
    ),
  );
}
