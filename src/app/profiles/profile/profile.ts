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
import { Profile as ProfileT } from '../../app.types';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { PostList } from '../../posts/post-list/';
import { Title } from '@angular/platform-browser';
import { ButtonDirective } from 'primeng/button';
import { FollowToggle } from './follow-toggle';
import { MessageService } from 'primeng/api';
import { Ripple } from 'primeng/ripple';
import { Profiles } from '../profiles';
import { Avatar } from './avatar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    ToggleSwitch,
    FollowToggle,
    RouterLink,
    PostList,
    Ripple,
    Avatar,
  ],
  templateUrl: './profile.html',
  styles: ``,
})
export class Profile {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _router = inject(Router);
  private readonly _title = inject(Title);

  protected readonly options = computed(() => {
    const profile = this.activeProfile();
    const imageId = profile.user.avatar?.image.id;
    if (this.profiles.isCurrentProfile(profile.id)) {
      return [
        { icon: 'pi pi-user-edit', routerLink: './edit', label: 'Edit Profile' },
        ...(imageId
          ? [
              {
                icon: 'pi pi-camera',
                label: 'Delete Picture',
                routerLink: `./pic/${imageId}/delete`,
              },
            ]
          : [{ icon: 'pi pi-camera', routerLink: './pic', label: 'Upload Picture' }]),
        { icon: 'pi pi-user-minus', routerLink: './delete', label: 'Delete Profile' },
      ];
    }
    return [];
  });

  protected readonly visible = new FormControl(true, { nonNullable: true });

  protected readonly profiles = inject(Profiles);

  readonly profile = input.required<ProfileT>();

  protected readonly activeProfile = linkedSignal(() => this.profile());

  protected readonly switchingVisibility = signal(false);

  private _updatePageTitle(profile: ProfileT) {
    const username = profile.user.username;
    if (username) {
      const suffix = this._title.getTitle().split('|').slice(1).join('|');
      this._title.setTitle(username + (suffix ? ' |' + suffix : ''));
    }
  }

  protected switchVisibility() {
    const profile = this.activeProfile();
    if (!this.switchingVisibility() && this.profiles.isCurrentProfile(profile.id)) {
      this.switchingVisibility.set(true);
      this.profiles
        .updateCurrentProfile({ visible: !profile.visible })
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.switchingVisibility.set(false)),
        )
        .subscribe({
          next: (updatedProfile) => this.activeProfile.set(updatedProfile),
          error: () => {
            this._toast.add({
              detail: `Failed to toggle your active status.`,
              summary: `Toggle Failed`,
              severity: 'error',
            });
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
      untracked(() => {
        this.visible.setValue(activeProfile.visible);
        this._updatePageTitle(activeProfile);
      });
    });

    this.profiles.profileUpdated.subscribe((updatedProfile) =>
      this.activeProfile.update((activeProfile) =>
        activeProfile.id === updatedProfile.id ? updatedProfile : activeProfile,
      ),
    );
  }
}
