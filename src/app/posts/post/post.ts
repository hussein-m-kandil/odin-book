import { booleanAttribute, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonDirective, ButtonLabel } from 'primeng/button';
import { DatePipe, I18nPluralPipe } from '@angular/common';
import { Post as PostT } from '../posts.types';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { Avatar } from '../../profiles';
import { Image } from '../../images';
import { Posts } from '../posts';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-post',
  imports: [
    ButtonDirective,
    I18nPluralPipe,
    ButtonLabel,
    RouterLink,
    DatePipe,
    Ripple,
    Avatar,
    Image,
  ],
  templateUrl: './post.html',
  styles: ``,
})
export class Post {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _posts = inject(Posts);

  protected readonly loading = signal<'' | 'upvote' | 'downvote'>('');

  readonly brief = input(false, { transform: booleanAttribute });
  readonly post = input.required<PostT>();

  protected vote(kind: 'upvote' | 'downvote') {
    if (!this.loading()) {
      const post = this.post();
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

  protected getDistanceDays(date: Date | string) {
    const dayMS = 24 * 60 * 60 * 1000;
    const nowMS = new Date().getTime();
    const dateMS = new Date(date).getTime();
    return Math.floor((nowMS - dateMS) / dayMS);
  }
}
