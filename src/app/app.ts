import { Router, RouterLink, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Navigation, Navigator } from './navigation';
import { Tab, Tabs, TabList } from 'primeng/tabs';
import { environment } from '../environments';
import { MessageService } from 'primeng/api';
import { AppStorage } from './app-storage';
import { Message } from 'primeng/message';
import { Profiles } from './profiles';
import { Toast } from 'primeng/toast';
import { Mainbar } from './mainbar';
import { Auth } from './auth';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterLinkActive,
    RouterOutlet,
    RouterLink,
    Navigator,
    Mainbar,
    Message,
    Toast,
    Tab,
    Tabs,
    TabList,
  ],
  templateUrl: './app.html',
  providers: [MessageService],
})
export class App {
  private readonly _profiles = inject(Profiles);
  private readonly _router = inject(Router);

  protected readonly auth = inject(Auth);
  protected readonly storage = inject(AppStorage);

  protected readonly title = signal(environment.title);
  protected readonly navigation = inject(Navigation);
  protected readonly activeNavItemIndex = signal(0);
  protected readonly disclaimed = signal(true);

  protected readonly navItems = [
    { route: '/profiles', label: 'Profiles', icon: 'pi pi-users' },
  ] as const;

  protected readonly DISCLAIMER_KEY = 'disclaimed';

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
        this.activeNavItemIndex.set(
          this.navItems.findIndex(({ route }) => event.urlAfterRedirects.startsWith(route)),
        );
      });

    afterNextRender(() => {
      this.disclaimed.set(!!this.storage.getItem(this.DISCLAIMER_KEY));
    });

    this.auth.userSignedOut.subscribe(() => this._reset());
  }
}
