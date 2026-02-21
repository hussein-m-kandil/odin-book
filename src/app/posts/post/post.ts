import {
  input,
  signal,
  inject,
  Component,
  DestroyRef,
  linkedSignal,
  booleanAttribute,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonDirective, ButtonLabel } from 'primeng/button';
import { I18nPluralPipe } from '@angular/common';
import { Post as PostT } from '../posts.types';
import { MessageService } from 'primeng/api';
import { PostHeader } from './post-header';
import { CommentList } from './comments';
import { Ripple } from 'primeng/ripple';
import { Dialog } from 'primeng/dialog';
import { filter, finalize } from 'rxjs';
import { Image } from '../../images';
import { VoteList } from './votes';
import { Posts } from '../posts';

const MODAL_KEY = 'modal';

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
    Dialog,
    Image,
  ],
  templateUrl: './post.html',
  styles: ``,
})
export class Post {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _router = inject(Router);
  private readonly _posts = inject(Posts);

  protected readonly commentsOpened = linkedSignal(() => !this.brief());
  protected readonly activePost = linkedSignal(() => this.post());

  protected readonly modalType = signal<'' | 'Likes' | 'Dislikes'>('');
  protected readonly loading = signal<'' | 'upvote' | 'downvote'>('');

  readonly brief = input(false, { transform: booleanAttribute });
  readonly post = input.required<PostT>();

  protected toggleComments() {
    this.commentsOpened.update((opened) => !opened);
  }

  protected pushModalRoute() {
    this._router.navigate(['.'], {
      queryParams: { [MODAL_KEY]: this.modalType() },
      relativeTo: this._activeRoute,
    });
  }

  protected popModalRoute() {
    this._router.navigate(['.'], { relativeTo: this._activeRoute, replaceUrl: true });
  }

  protected setModal(type: ReturnType<typeof this.modalType>) {
    this.modalType.set(type);
    if (type) this.pushModalRoute();
    else this.popModalRoute();
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

  constructor() {
    this._router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const modalType = this.modalType();
        if (modalType && !event.urlAfterRedirects.includes(`${MODAL_KEY}=${modalType}`)) {
          this.modalType.set('');
        }
      });
  }
}
