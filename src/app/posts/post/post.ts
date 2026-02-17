import { booleanAttribute, Component, input } from '@angular/core';
import { ButtonDirective, ButtonLabel } from 'primeng/button';
import { DatePipe, I18nPluralPipe } from '@angular/common';
import { Post as PostT } from '../posts.types';
import { RouterLink } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { Avatar } from '../../profiles';
import { Image } from '../../images';

@Component({
  selector: 'app-post',
  imports: [
    ButtonDirective,
    I18nPluralPipe,
    ButtonLabel,
    RouterLink,
    DatePipe,
    Ripple,
    Avatar,
    Image,
  ],
  templateUrl: './post.html',
  styles: ``,
})
export class Post {
  readonly brief = input(false, { transform: booleanAttribute });
  readonly post = input.required<PostT>();

  protected getDistanceDays(date: Date | string) {
    const dayMS = 24 * 60 * 60 * 1000;
    const nowMS = new Date().getTime();
    const dateMS = new Date(date).getTime();
    return Math.floor((nowMS - dateMS) / dayMS);
  }
}
