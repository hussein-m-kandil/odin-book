import { Comment, NewCommentData, Post } from '../../posts.types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ListStore } from '../../../list/list-store';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Posts } from '../../posts';

@Injectable({
  providedIn: 'root',
})
export class Comments extends ListStore<Comment> {
  private readonly _http = inject(HttpClient);
  private readonly _posts = inject(Posts);

  private readonly _postsUrl = this._posts.baseUrl;

  private _postId: Post['id'] | null = null;

  protected override loadErrorMessage = 'Load failed';

  protected override getMore(): Observable<Comment[]> {
    const postId = this._postId;
    if (postId) {
      let params = new HttpParams({ fromObject: { sort: 'asc' } });
      const comments = this.list();
      const cursor = comments[comments.length - 1]?.order;
      if (cursor) params = params.append('cursor', cursor);
      return this._http.get<Comment[]>(`${this._postsUrl}/${postId}/comments`, { params });
    }
    return of([]);
  }

  override reset(): void {
    super.reset();
    this._postId = null;
  }

  config({ postId }: { postId: Post['id'] }) {
    this.reset();
    this._postId = postId;
  }

  createComment(id: Post['id'], data: NewCommentData) {
    return this._http.post<Comment>(`${this._postsUrl}/${id}/comments`, data).pipe(
      tap((createdComment) => {
        if (createdComment.postId === this._postId) {
          this.list.update((comments) => comments.concat(createdComment));
        }
      }),
    );
  }
}
