import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button, ButtonDirective } from 'primeng/button';
import { Notification } from './notifications.types';
import { Avatar } from '../profiles/profile/avatar';
import { Notifications } from './notifications';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { getResErrMsg } from '../utils';
import { Ripple } from 'primeng/ripple';
import { Time } from '../time/time';
import { finalize } from 'rxjs';
import { List } from '../list';

@Component({
  selector: 'app-notification-list',
  imports: [ButtonDirective, RouterLink, Avatar, Button, Ripple, List, Time],
  templateUrl: './notification-list.html',
  styles: ``,
})
export class NotificationList implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);

  protected readonly notifications = inject(Notifications);

  protected readonly deletingIds = signal<Notification['id'][]>([]);

  protected deleteNotification(notificationId: Notification['id']) {
    if (!this.deletingIds().includes(notificationId)) {
      this.deletingIds.update((ids) => ids.concat(notificationId));
      this.notifications
        .deleteNotification(notificationId)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => {
            this.deletingIds.update((ids) => ids.filter((id) => id !== notificationId));
          }),
        )
        .subscribe({
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: 'Notification deletion failed',
              detail: getResErrMsg(res) || 'Failed to delete a notification.',
            });
          },
        });
    }
  }

  constructor() {
    effect(() => {
      if (this.notifications.newItems().length) {
        setTimeout(() => this.notifications.markAsSeen(), 1000);
      }
    });
  }

  ngOnInit() {
    if (!this.notifications.loading() && !this.notifications.list().length) {
      this.notifications.reset();
      this.notifications.load();
    }
  }
}
