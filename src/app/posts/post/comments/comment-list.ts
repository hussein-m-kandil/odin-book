import { Component, input } from '@angular/core';
import { PostHeader } from '../post-header';
import { Comment } from '../../posts.types';

@Component({
  selector: 'app-comment-list',
  imports: [PostHeader],
  templateUrl: './comment-list.html',
  styles: ``,
})
export class CommentList {
  readonly comments = input.required<Comment[]>();
}
