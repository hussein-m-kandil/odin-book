import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments';
import { ListStore } from '../list/list-store';
import { Post } from './posts.types';

@Injectable({
  providedIn: 'root',
})
export class Posts extends ListStore<Post> {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _http = inject(HttpClient);

  private _params = new HttpParams();

  protected override loadErrorMessage = 'Failed to load posts.';

  readonly baseUrl = `${environment.apiUrl}/posts`;

  override reset(): void {
    super.reset();
    this._params = new HttpParams();
  }

  protected override getMore() {
    let params = this._params;
    const posts = this.list();
    const cursor = posts[posts.length - 1]?.order;
    if (typeof cursor !== 'undefined') params = params.append('cursor', cursor);
    return this._http
      .get<ReturnType<typeof this.list>>(this.baseUrl, { params })
      .pipe(takeUntilDestroyed(this._destroyRef));
  }

  setParams(params: HttpParams) {
    this._params = params;
  }
}
