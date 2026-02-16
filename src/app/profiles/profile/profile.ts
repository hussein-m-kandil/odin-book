import {
  input,
  signal,
  inject,
  effect,
  computed,
  untracked,
  Component,
  DestroyRef,
  linkedSignal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuItem, MessageService } from 'primeng/api';
import { Profile as ProfileT } from '../../app.types';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Button } from 'primeng/button';
import { Profiles } from '../profiles';
import { Menu } from 'primeng/menu';
import { Avatar } from './avatar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, ToggleSwitch, RouterLink, Button, Avatar, Menu],
  templateUrl: './profile.html',
  styles: ``,
})
export class Profile {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _router = inject(Router);

  protected readonly optionsMenuItems = computed<MenuItem[]>(() => {
    const profile = this.activeProfile();
    const imageId = profile.user.avatar?.image.id;
    if (!this.loading() && this.profiles.isCurrentProfile(profile.id)) {
      return [
        { icon: 'pi pi-pencil', routerLink: './edit', label: 'Edit profile' },
        { icon: 'pi pi-camera', routerLink: './pic', label: 'Upload picture' },
        ...(imageId
          ? [
              {
                icon: 'pi pi-trash',
                routerLink: `./pic/${imageId}/delete`,
                label: 'Delete picture',
                labelClass: 'text-(--p-button-text-danger-color)',
              },
            ]
          : []),
        {
          icon: 'pi pi-trash',
          routerLink: './delete',
          label: 'Delete profile',
          labelClass: 'text-(--p-button-text-danger-color)',
        },
      ];
    }
    return [];
  });

  protected readonly loading = signal<'' | 'visibility' | 'following'>('');

  protected readonly visible = new FormControl(true, { nonNullable: true });

  protected readonly profiles = inject(Profiles);

  readonly profile = input.required<ProfileT>();

  protected readonly activeProfile = linkedSignal(() => this.profile());

  protected toggle(property: ReturnType<typeof this.loading>) {
    const profile = this.activeProfile();
    const currentUserProfile = this.profiles.isCurrentProfile(profile.id);
    const visibility = property === 'visibility' && currentUserProfile;
    const following = property === 'following' && !currentUserProfile;
    if (!this.loading() && (visibility || following)) {
      this.loading.set(property);
      const req$ = visibility
        ? this.profiles.updateCurrentProfile({ visible: !profile.visible })
        : this.profiles.toggleFollowing(profile);
      req$
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.loading.set('')),
        )
        .subscribe({
          next: (updatedProfile) => this.activeProfile.set(updatedProfile),
          error: () => {
            let summary: string, detail: string;
            if (visibility) {
              detail = `Failed to toggle your active status.`;
              summary = `Toggle Failed`;
            } else {
              const action = profile.followedByCurrentUser ? 'Unfollow' : 'Follow';
              detail = `Failed to ${action.toLowerCase()} this profile.`;
              summary = `${action} Failed`;
            }
            this._toast.add({ detail, summary, severity: 'error' });
          },
        });
    }
  }

  protected goBack() {
    this._router.navigate(['..'], { relativeTo: this._activeRoute });
  }

  constructor() {
    effect(() => {
      const activeProfile = this.activeProfile();
      untracked(() => this.visible.setValue(activeProfile.visible));
    });

    this.profiles.profileUpdated.subscribe((updatedProfile) =>
      this.activeProfile.update((activeProfile) =>
        activeProfile.id === updatedProfile.id ? updatedProfile : activeProfile,
      ),
    );
  }
}
