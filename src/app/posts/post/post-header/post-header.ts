import { input, Component, booleanAttribute, output } from '@angular/core';
import { Avatar } from '../../../profiles/profile/avatar';
import type { Comment, Post } from '../../posts.types';
import { RouterLink } from '@angular/router';
import { Time } from '../../../time/time';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-post-header',
  imports: [RouterLink, Button, Avatar, Time],
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
}
