import { Component, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { Profile } from '../../../app.types';
import { Profiles } from '../../profiles';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-follow-toggle',
  imports: [Button],
  templateUrl: './follow-toggle.html',
  styles: ``,
})
export class FollowToggle {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);

  protected readonly profiles = inject(Profiles);

  protected readonly toggling = signal(false);

  protected readonly followed = linkedSignal(() => this.profile().followedByCurrentUser);

  readonly profile = input.required<Profile>();

  protected toggle() {
    const profile = this.profile();
    if (!this.toggling() && !this.profiles.isCurrentProfile(profile.id)) {
      this.toggling.set(true);
      this.profiles
        .toggleFollowing(profile)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.toggling.set(false)),
        )
        .subscribe({
          next: (updatedProfile) => this.followed.set(updatedProfile.followedByCurrentUser),
          error: () => {
            const operation = profile.followedByCurrentUser ? 'Unfollow' : 'Follow';
            this._toast.add({
              detail: `Failed to ${operation.toLowerCase()} this profile.`,
              summary: `${operation} Failed`,
              severity: 'error',
            });
          },
        });
    }
  }
}
