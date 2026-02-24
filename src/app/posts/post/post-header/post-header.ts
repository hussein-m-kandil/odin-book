import { input, Component, booleanAttribute, output } from '@angular/core';
import { Comment, Post } from '../../posts.types';
import { RouterLink } from '@angular/router';
import { Avatar } from '../../../profiles';
import { DatePipe } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-post-header',
  imports: [RouterLink, DatePipe, Button, Avatar],
  templateUrl: './post-header.html',
  styles: ``,
})
export class PostHeader {
  readonly date = input.required<Post['createdAt'] | Comment['createdAt']>();
  readonly author = input.required<Post['author'] | Comment['author']>();
  readonly public = input(undefined, { transform: booleanAttribute });
  readonly deleting = input(false, { transform: booleanAttribute });
  readonly emphasis = input(false, { transform: booleanAttribute });
  readonly deleteLabel = input('');

  readonly deleted = output();

  protected getDistanceDays(date: Date | string) {
    const dayMS = 24 * 60 * 60 * 1000;
    const nowMS = new Date().getTime();
    const dateMS = new Date(date).getTime();
    return Math.floor((nowMS - dateMS) / dayMS);
  }
}
