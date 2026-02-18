import { Component, input } from '@angular/core';
import { PostHeader } from '../post-header';
import { Comment } from '../../posts.types';

@Component({
  selector: 'app-comments',
  imports: [PostHeader],
  templateUrl: './comments.html',
  styles: ``,
})
export class Comments {
  readonly comments = input.required<Comment[]>();
}
