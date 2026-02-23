import {
  input,
  signal,
  inject,
  Component,
  DestroyRef,
  linkedSignal,
  booleanAttribute,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonDirective, ButtonLabel } from 'primeng/button';
import { I18nPluralPipe } from '@angular/common';
import { Post as PostT } from '../posts.types';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { PostHeader } from './post-header';
import { CommentList } from './comments';
import { Ripple } from 'primeng/ripple';
import { Image } from '../../images';
import { Modal } from '../../modal';
import { VoteList } from './votes';
import { Posts } from '../posts';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-post',
  imports: [
    ButtonDirective,
    I18nPluralPipe,
    ButtonLabel,
    CommentList,
    PostHeader,
    RouterLink,
    VoteList,
    Ripple,
    Image,
    Modal,
  ],
  templateUrl: './post.html',
  styles: ``,
})
export class Post {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _posts = inject(Posts);

  protected readonly commentsOpened = linkedSignal(() => !this.brief());
  protected readonly activePost = linkedSignal(() => this.post());

  protected readonly loading = signal<'' | 'upvote' | 'downvote'>('');
  protected readonly modal = signal<'' | 'Likes' | 'Dislikes'>('');

  readonly brief = input(false, { transform: booleanAttribute });
  readonly post = input.required<PostT>();

  protected toggleComments() {
    this.commentsOpened.update((opened) => !opened);
  }

  protected vote(kind: 'upvote' | 'downvote') {
    if (!this.loading()) {
      const post = this.activePost();
      const operation =
        (kind === 'upvote' && post.upvotedByCurrentUser) ||
        (kind === 'downvote' && post.downvotedByCurrentUser)
          ? ('unvote' as const)
          : kind;
      const reaction = kind === 'upvote' ? 'like' : 'dislike';
      const removing = operation === 'unvote' ? 'remove' : '';
      this.loading.set(kind);
      this._posts[operation](post.id)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.loading.set('')),
        )
        .subscribe({
          next: (updatedPost) => this.activePost.set(updatedPost),
          error: () => {
            this._toast.add({
              severity: 'error',
              summary: 'Error',
              detail: removing
                ? `Failed to remove your ${reaction} from the post.`
                : `Failed to ${reaction} the post`,
            });
          },
        });
    }
  }
}
