import { afterNextRender, Component, inject, signal } from '@angular/core';
import { Navigation, Navigator } from './navigation';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments';
import { MessageService } from 'primeng/api';
import { AppStorage } from './app-storage';
import { Message } from 'primeng/message';
import { Profiles } from './profiles';
import { Toast } from 'primeng/toast';
import { Mainbar } from './mainbar';
import { Auth } from './auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigator, Mainbar, Message, Toast],
  templateUrl: './app.html',
  providers: [MessageService],
})
export class App {
  private readonly _profiles = inject(Profiles);
  private readonly _auth = inject(Auth);

  protected readonly storage = inject(AppStorage);

  protected readonly title = signal(environment.title);
  protected readonly navigation = inject(Navigation);
  protected readonly disclaimed = signal(true);

  protected readonly DISCLAIMER_KEY = 'disclaimed';

  private _reset() {
    this._profiles.reset();
  }

  constructor() {
    afterNextRender(() => {
      import('@emoji-mart/data').catch();
      this.disclaimed.set(!!this.storage.getItem(this.DISCLAIMER_KEY));
    });

    this._auth.userSignedOut.subscribe(() => this._reset());
  }
}
