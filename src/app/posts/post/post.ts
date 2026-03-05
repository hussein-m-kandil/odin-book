import {
  input,
  signal,
  inject,
  effect,
  Injector,
  untracked,
  viewChild,
  Component,
  DestroyRef,
  ElementRef,
  linkedSignal,
  afterNextRender,
  booleanAttribute,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CommentList, Comments } from './comments';
import { Confirmation } from '../../confirmation';
import { I18nPluralPipe } from '@angular/common';
import { Post as PostT } from '../posts.types';
import { MessageService } from 'primeng/api';
import { getResErrMsg } from '../../utils';
import { PostHeader } from './post-header';
import { Button } from 'primeng/button';
import { Image } from '../../images';
import { Modal } from '../../modal';
import { VoteList } from './votes';
import { Auth } from '../../auth';
import { Posts } from '../posts';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-post',
  imports: [
    I18nPluralPipe,
    Confirmation,
    CommentList,
    PostHeader,
    RouterLink,
    VoteList,
    Button,
    Image,
    Modal,
  ],
  templateUrl: './post.html',
  providers: [Comments],
})
export class Post {
  private readonly _comments = viewChild<ElementRef<HTMLElement>>('comments');

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _injector = inject(Injector);
  private readonly _router = inject(Router);

  protected readonly comments = inject(Comments);
  protected readonly posts = inject(Posts);
  protected readonly auth = inject(Auth);

  protected readonly commentsVisible = linkedSignal(() => !this.brief());
  protected readonly activePost = linkedSignal(() => this.post());

  protected readonly modal = signal<'' | 'Likes' | 'Dislikes' | 'Delete Confirmation'>('');
  protected readonly loading = signal<'' | 'upvote' | 'downvote' | 'delete'>('');

  readonly brief = input(false, { transform: booleanAttribute });
  readonly post = input.required<PostT>();

  protected toggleComments() {
    this.commentsVisible.update((visible) => !visible);
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
      this.posts[operation](post.id)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.loading.set('')),
        )
        .subscribe({
          next: (updatedPost) => this.activePost.set(updatedPost),
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: 'Reaction failed',
              detail:
                getResErrMsg(res) ||
                (removing
                  ? `Failed to remove ${reaction} from the post.`
                  : `Failed to ${reaction} the post`),
            });
          },
        });
    }
  }

  protected deletePost() {
    if (!this.loading()) {
      this.loading.set('delete');
      this.posts
        .deletePost(this.activePost().id)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.loading.set('')),
        )
        .subscribe({
          next: () => {
            this.modal.set('');
            if (!this.brief()) this._router.navigate(['/']);
          },
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: 'Deletion failed',
              detail: getResErrMsg(res) || 'Failed to remove the post.',
            });
          },
        });
    }
  }

  constructor() {
    effect(() => {
      this.comments.list();
      untracked(() => {
        afterNextRender(
          () => {
            const commentsElement = this._comments()?.nativeElement;
            if (commentsElement) commentsElement.scrollTop = commentsElement.scrollHeight;
          },
          { injector: this._injector },
        );
      });
    });
  }
}
