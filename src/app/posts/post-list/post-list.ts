import {
  input,
  inject,
  Component,
  OnChanges,
  SimpleChanges,
  booleanAttribute,
} from '@angular/core';
import { ContentForm } from '../post/content-form';
import { HttpParams } from '@angular/common/http';
import { Post as PostT } from '../posts.types';
import { Comments } from '../post/comments';
import { List } from '../../list';
import { Posts } from '../posts';
import { Post } from '../post';

@Component({
  selector: 'app-post-list',
  imports: [List, Post, ContentForm],
  templateUrl: './post-list.html',
  providers: [Comments],
})
export class PostList implements OnChanges {
  protected readonly posts = inject(Posts);

  readonly following = input(false, { transform: booleanAttribute });
  readonly authorId = input<PostT['author']['id']>();

  protected load(following: boolean, author?: ReturnType<typeof this.authorId>) {
    this.posts.reset();
    if (author) {
      this.posts.setParams(new HttpParams({ fromObject: { author } }));
    } else if (following) {
      this.posts.setParams(new HttpParams({ fromObject: { following: true } }));
    }
    this.posts.load();
  }

  ngOnChanges(changes: SimpleChanges<PostList>) {
    const following = booleanAttribute(changes.following?.currentValue);
    const author = changes.authorId?.currentValue;
    this.load(following, author);
  }
}
