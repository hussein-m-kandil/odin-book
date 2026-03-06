import {
  input,
  signal,
  inject,
  Component,
  OnChanges,
  DestroyRef,
  booleanAttribute,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirmation } from '../../../confirmation';
import { Comment, Post } from '../../posts.types';
import { getResErrMsg } from '../../../utils';
import { ContentForm } from '../content-form';
import { MessageService } from 'primeng/api';
import { PostHeader } from '../post-header';
import { Dialog } from 'primeng/dialog';
import { Comments } from './comments';
import { Auth } from '../../../auth';
import { List } from '../../../list';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-comment-list',
  imports: [PostHeader, ContentForm, Confirmation, Dialog, List],
  templateUrl: './comment-list.html',
  styles: ``,
})
export class CommentList implements OnChanges {
  private _destroyRef = inject(DestroyRef);
  private _toast = inject(MessageService);

  protected readonly comments = inject(Comments);
  protected readonly auth = inject(Auth);

  protected readonly modal = signal<'' | 'Delete Confirmation'>('');
  protected readonly commentId = signal<Comment['id'] | null>(null);
  protected readonly loading = signal<'' | 'delete'>('');

  readonly mutable = input(false, { transform: booleanAttribute });
  readonly postId = input.required<Post['id']>();

  protected showDeleteModal(id: Comment['id']) {
    this.commentId.set(id);
    this.modal.set('Delete Confirmation');
  }

  protected deleteComment() {
    const commentId = this.commentId();
    const postId = this.postId();
    if (!this.loading() && postId && commentId) {
      this.loading.set('delete');
      this.comments
        .deleteComment(postId, commentId)
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => this.loading.set('')),
        )
        .subscribe({
          next: () => {
            this.modal.set('');
            this.commentId.set(null);
          },
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: 'Deletion failed',
              detail: getResErrMsg(res) || 'Failed to remove the comment.',
            });
          },
        });
    }
  }

  ngOnChanges() {
    this.comments.config({ postId: this.postId() });
    this.comments.load();
  }
}
