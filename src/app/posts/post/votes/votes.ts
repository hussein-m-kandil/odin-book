import { HttpClient, HttpParams } from '@angular/common/http';
import { ListStore } from '../../../list/list-store';
import { inject, Injectable } from '@angular/core';
import { Post, Vote } from '../../posts.types';
import { Observable, of } from 'rxjs';
import { Posts } from '../../posts';

export type VoteType = 'all' | 'upvote' | 'downvote';

@Injectable()
export class Votes extends ListStore<Vote> {
  private readonly _http = inject(HttpClient);
  private readonly _posts = inject(Posts);

  private readonly _postsUrl = this._posts.baseUrl;

  private _postId: Post['id'] | null = null;
  private _type: VoteType = 'all';

  protected override loadErrorMessage = 'Load failed';

  protected override getMore(): Observable<Vote[]> {
    const postId = this._postId;
    if (postId) {
      let params = new HttpParams();
      const votes = this.list();
      const cursor = votes[votes.length - 1]?.order;
      if (cursor) params = params.append('cursor', cursor);
      if (this._type === 'downvote' || this._type === 'upvote') {
        params = params.append(this._type, true);
      }
      return this._http.get<Vote[]>(`${this._postsUrl}/${postId}/votes`, { params });
    }
    return of([]);
  }

  override reset(): void {
    super.reset();
    this._postId = null;
    this._type = 'all';
  }

  config({ postId, type }: { postId: Post['id']; type?: VoteType }) {
    this.reset();
    this._type = type || 'all';
    this._postId = postId;
  }
}
