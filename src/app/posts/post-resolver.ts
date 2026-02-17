import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Post } from './posts.types';
import { Posts } from './posts';

export const postResolver: ResolveFn<Post> = (route) => {
  const posts = inject(Posts);
  const postId = route.params['postId'];
  if (!postId) throw Error('Missing a post id!');
  return posts.getPost(postId);
};
