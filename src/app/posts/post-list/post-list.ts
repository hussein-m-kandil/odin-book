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

  ngOnChanges(changes: SimpleChanges<PostList>) {
    this.posts.reset();
    const author = changes.authorId?.currentValue;
    if (author) {
      this.posts.setParams(new HttpParams({ fromObject: { author } }));
    } else if (booleanAttribute(changes.following?.currentValue)) {
      this.posts.setParams(new HttpParams({ fromObject: { following: true } }));
    }
    this.posts.load();
  }
}
