import { Comment, NewCommentData, Post } from '../../posts.types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ListStore } from '../../../list/list-store';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { Auth } from '../../../auth';
import { Posts } from '../../posts';
import { mergeDistinctBy, sortByDate } from '../../../utils';

@Injectable()
export class Comments extends ListStore<Comment> {
  private readonly _http = inject(HttpClient);
  private readonly _posts = inject(Posts);
  private readonly _auth = inject(Auth);

  private _postId: Post['id'] | null = null;

  protected override loadErrorMessage = 'Load failed';

  private _listenToSocketEvents(socket: NonNullable<typeof this._auth.socket>) {
    socket.on('post:comment:created', (postId?: Post['id'], commentId?: Comment['id']) => {
      if (postId === this._postId && commentId) {
        if (this.list().length) {
          this._http
            .get<Comment | void>(`${this._posts.baseUrl}/${postId}/comments/${commentId}`)
            .pipe(catchError(() => of()))
            .subscribe((comment) => {
              if (comment && comment.postId === this._postId) {
                this.list.update((comments) => {
                  const newList = mergeDistinctBy([comment], comments, (comment) => comment.id);
                  return sortByDate(newList, (comment) => comment.createdAt, 'asc');
                });
              }
            });
        } else {
          this.load();
        }
      }
    });

    socket.on('post:comment:deleted', (postId?: Post['id'], commentId?: Comment['id']) => {
      if (postId === this._postId && commentId) this.deleteCommentLocally(commentId);
    });
  }

  protected override getMore(): Observable<Comment[]> {
    const postId = this._postId;
    if (postId) {
      let params = new HttpParams({ fromObject: { sort: 'asc' } });
      const comments = this.list();
      const cursor = comments[comments.length - 1]?.order;
      if (cursor) params = params.append('cursor', cursor);
      return this._http.get<Comment[]>(`${this._posts.baseUrl}/${postId}/comments`, { params });
    }
    return of([]);
  }

  constructor() {
    super();
    if (this._auth.socket) this._listenToSocketEvents(this._auth.socket);
    this._auth.userUpdated.subscribe(({ socket }) => {
      const postId = this._postId;
      this.reset();
      if (postId) {
        this.config({ postId });
        this.load();
      }
      this._listenToSocketEvents(socket);
    });
  }

  override reset(): void {
    super.reset();
    this._postId = null;
  }

  config({ postId }: { postId: Post['id'] }) {
    this.reset();
    this._postId = postId;
  }

  createComment(postId: Post['id'], data: NewCommentData) {
    return this._http.post<Comment>(`${this._posts.baseUrl}/${postId}/comments`, data).pipe(
      tap((createdComment) => {
        if (createdComment.postId === this._postId) {
          this.list.update((comments) => comments.concat(createdComment));
        }
        this._posts.incrementPostCommentsCount(createdComment.postId, 1);
      }),
    );
  }

  deleteComment(postId: Post['id'], commentId: Comment['id']) {
    return this._http.delete(`${this._posts.baseUrl}/${postId}/comments/${commentId}`).pipe(
      tap(() => {
        this.deleteCommentLocally(commentId);
        this._posts.incrementPostCommentsCount(postId, -1);
      }),
    );
  }

  deleteCommentLocally(commentId: Comment['id']) {
    this.list.update((comments) => comments.filter((c) => c.id !== commentId));
  }
}
