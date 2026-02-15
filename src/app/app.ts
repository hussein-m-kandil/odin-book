import { Router, RouterLink, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, inject, signal } from '@angular/core';
import { Tab, Tabs, TabList } from 'primeng/tabs';
import { environment } from '../environments';
import { MessageService } from 'primeng/api';
import { Profiles } from './profiles';
import { Toast } from 'primeng/toast';
import { Auth } from './auth';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterLinkActive, RouterOutlet, RouterLink, Toast, Tab, Tabs, TabList],
  templateUrl: './app.html',
  providers: [MessageService],
})
export class App {
  private readonly _profiles = inject(Profiles);
  private readonly _router = inject(Router);

  protected readonly auth = inject(Auth);

  protected readonly title = signal(environment.title);
  protected readonly activeMenuIndex = signal(0);

  protected readonly mainNavItems = [
    { route: '/profiles', label: 'Profiles', icon: 'pi pi-users' },
    { route: '/followers', label: 'Followers', icon: 'pi pi-users' },
    { route: '/following', label: 'Following', icon: 'pi pi-users' },
  ] as const;

  private _reset() {
    this._profiles.reset();
  }

  constructor() {
    this._router.events
      .pipe(
        takeUntilDestroyed(),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event) => {
        this.activeMenuIndex.set(
          this.mainNavItems.findIndex(({ route }) => event.urlAfterRedirects.startsWith(route)),
        );
      });

    this.auth.userSignedOut.subscribe(() => this._reset());
  }
}
