import { input, inject, Component, OnChanges, SimpleChanges } from '@angular/core';
import { ContentForm } from '../post/content-form';
import { HttpParams } from '@angular/common/http';
import { List } from '../../list';
import { Posts } from '../posts';
import { Post } from '../post';

@Component({
  selector: 'app-post-list',
  imports: [List, Post, ContentForm],
  templateUrl: './post-list.html',
})
export class PostList implements OnChanges {
  protected readonly posts = inject(Posts);

  readonly following = input.required<boolean | string>();

  ngOnChanges(changes: SimpleChanges<PostList>) {
    this.posts.reset();
    const following = changes.following?.currentValue;
    if ((following && following !== 'false') || following === '') {
      this.posts.setParams(new HttpParams({ fromObject: { following: true } }));
    }
    this.posts.load();
  }
}
