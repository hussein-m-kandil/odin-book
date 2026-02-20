import { Component, inject, input, OnChanges } from '@angular/core';
import { PostHeader } from '../post-header';
import { Post } from '../../posts.types';
import { Comments } from './comments';
import { List } from '../../../list';

@Component({
  selector: 'app-comment-list',
  imports: [PostHeader, List],
  templateUrl: './comment-list.html',
  styles: ``,
})
export class CommentList implements OnChanges {
  protected readonly comments = inject(Comments);

  readonly postId = input.required<Post['id']>();

  ngOnChanges() {
    this.comments.config({ postId: this.postId() });
    this.comments.load();
  }
}
