import { RouterLink, RouterLinkActive } from '@angular/router';
import { FollowToggle } from '../../profile/follow-toggle';
import { Component, input } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Avatar } from '../../profile/avatar';
import { Profile } from '../../../app.types';
import { Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-profile-item',
  imports: [ButtonDirective, RouterLinkActive, RouterLink, FollowToggle, Ripple, Avatar],
  templateUrl: './profile-item.html',
  styles: ``,
})
export class ProfileItem {
  readonly profile = input.required<Profile>();
}
