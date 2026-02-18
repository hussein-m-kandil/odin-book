import { input, inject, OnChanges, Component, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthData } from '../../auth/auth.types';
import { ProfileItem } from './profile-item';
import { Profiles } from '../profiles';
import { List } from '../../list';

@Component({
  selector: 'app-profile-list',
  imports: [ProfileItem, List],
  templateUrl: './profile-list.html',
  styles: ``,
})
export class ProfileList implements OnChanges {
  private _activeRoute = inject(ActivatedRoute);
  private _router = inject(Router);

  protected readonly profiles = inject(Profiles);

  readonly name = input('', { transform: (v?: string) => v || '' });
  readonly user = input.required<AuthData['user']>();

  protected search(name: string) {
    this._router.navigate(['.'], {
      relativeTo: this._activeRoute,
      queryParams: name ? { name } : {},
    });
  }

  ngOnChanges(changes: SimpleChanges<ProfileList>) {
    this.profiles.reset();
    const checkUrl = (path: string) => this._router.url.startsWith(path);
    switch (true) {
      case checkUrl('/followers'):
        this.profiles.path.set('followers');
        break;
      case checkUrl('/following'):
        this.profiles.path.set('following');
        break;
      default:
        this.profiles.path.set('');
    }
    if (changes.name) this.profiles.searchValue.set(changes.name.currentValue || '');
    if (this.profiles.list().length < 1 && !this.profiles.loading()) this.profiles.load();
  }
}
