import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, computed, inject } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { ColorScheme, SCHEMES } from '../color-scheme';
import { Avatar } from '../profiles/profile/avatar';
import { ButtonDirective } from 'primeng/button';
import { Notifications } from '../notifications';
import { environment } from '../../environments';
import { Ripple } from 'primeng/ripple';
import { Menu } from 'primeng/menu';
import { Auth } from '../auth';

@Component({
  selector: 'app-mainbar',
  imports: [RouterLinkActive, ButtonDirective, RouterLink, Avatar, Ripple, Menu],
  templateUrl: './mainbar.html',
  styles: ``,
})
export class Mainbar {
  private readonly _toast = inject(MessageService);

  protected readonly notifications = inject(Notifications);
  protected readonly colorScheme = inject(ColorScheme);
  protected readonly auth = inject(Auth);

  protected readonly profileMenuItems = computed<MenuItem[]>(() => {
    const user = this.auth.user();
    if (!user) return [];
    return [
      {
        icon: 'pi pi-user',
        label: user.username,
        routerLink: `/profiles/${user.username}`,
      },
      {
        icon: 'pi pi-sign-out',
        label: 'Sign Out',
        command: () => this.signOut(),
        labelClass: 'text-(--p-button-text-danger-color)',
      },
    ];
  });

  protected readonly colorSchemeMenuItems = computed<MenuItem[]>(() => {
    return SCHEMES.map((scheme) => ({
      icon: scheme.icon,
      label: `${scheme.value[0].toUpperCase()}${scheme.value.slice(1)}`,
      command: () => this.colorScheme.select(scheme),
    }));
  });

  protected readonly title = environment.title;

  protected signOut() {
    const user = this.auth.user();
    this.auth.signOut();
    this._toast.add({
      severity: 'info',
      summary: `Bye${user ? ', ' + user.username : ''}`,
      detail: 'You have signed-out successfully.',
    });
  }
}
