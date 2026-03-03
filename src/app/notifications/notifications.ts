import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, tap, catchError, Subscription } from 'rxjs';
import { mergeDistinctBy, sortByDate } from '../utils';
import { Notification } from './notifications.types';
import { environment } from '../../environments';
import { ListStore } from '../list/list-store';
import { Auth } from '../auth';

@Injectable({
  providedIn: 'root',
})
export class Notifications extends ListStore<Notification> {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(Auth);

  private _updateSubscription: Subscription | null = null;

  protected override loadErrorMessage = 'Load failed';

  readonly newItems = computed(() => this.list().filter(({ seenAt }) => !seenAt));

  readonly baseUrl = `${environment.apiUrl}/notifications`;

  protected override getMore() {
    const notifications = this.list();
    const cursor = notifications[notifications.length - 1]?.id;
    return this._http.get<Notification[]>(this.baseUrl, {
      params: new HttpParams({ fromObject: cursor ? { cursor } : {} }),
    });
  }

  constructor() {
    super();

    this._auth.userUpdated.subscribe(({ socket }) => {
      this.reset();
      this.load();

      socket.on('notifications:updated', () => this.update());
    });
  }

  update() {
    const limit = this.list().length;
    this._updateSubscription?.unsubscribe();
    if (!limit) {
      this.load();
      this._updateSubscription = null;
    } else {
      this._updateSubscription = this._http
        .get<Notification[]>(this.baseUrl, { params: { limit } })
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          catchError(() => of(null)),
        )
        .subscribe((resList) => {
          // No need for next/error blocks, because any error will be caught and get here as a null
          this._updateSubscription = null;
          if (resList && resList.length) {
            const list = this.list();
            const extras = resList.filter(
              (resItem) => !list.some((item) => item.id === resItem.id),
            );
            const updatedList = list.map(
              (item) => resList.find((resItem) => resItem.id === item.id) || item,
            );
            this.list.set(
              sortByDate(
                mergeDistinctBy(extras, updatedList, (item) => item.id),
                (item) => item.createdAt,
              ),
            );
            if (extras.length) {
              this.update(); // Update again with the extended limit
            }
          }
        });
    }
  }

  markAsSeen() {
    this._http
      .patch<void>(`${this.baseUrl}/seen`, null)
      .pipe(catchError(() => of()))
      .subscribe(() => {
        const seenAt = new Date().toISOString();
        this.list.update((notifications) =>
          notifications.map((notification) => ({ ...notification, seenAt })),
        );
      });
  }

  deleteNotification(id: Notification['id']) {
    return this._http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.list.update((notifications) =>
          notifications.filter((notification) => notification.id !== id),
        );
      }),
    );
  }
}
