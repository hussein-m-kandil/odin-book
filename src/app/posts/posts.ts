import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NewPostData, Post } from './posts.types';
import { environment } from '../../environments';
import { ListStore } from '../list/list-store';
import { defer, of, tap } from 'rxjs';
import { Auth } from '../auth';

@Injectable({
  providedIn: 'root',
})
export class Posts extends ListStore<Post> {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(Auth);

  private _params = new HttpParams();

  protected override loadErrorMessage = 'Failed to load posts.';

  readonly baseUrl = `${environment.apiUrl}/posts`;

  private _updatePostIfExist(updatedPost: Post) {
    this.list.update((posts) =>
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  }

  override reset(): void {
    super.reset();
    this._params = new HttpParams();
  }

  protected override getMore() {
    let params = this._params;
    const posts = this.list();
    const cursor = posts[posts.length - 1]?.order;
    if (typeof cursor !== 'undefined') params = params.append('cursor', cursor);
    return this._http.get<ReturnType<typeof this.list>>(this.baseUrl, { params });
  }

  constructor() {
    super();
    this._auth.userUpdated.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  setParams(params: HttpParams) {
    this._params = params;
  }

  isAuthoredByCurrentUser(post: Post) {
    const user = this._auth.user();
    return !!user && user.id === post.authorId;
  }

  getPost(id: Post['id']) {
    return defer(() => {
      const foundPost = this.list().find((p) => p.id === id);
      if (foundPost) return of(foundPost);
      return this._http.get<Post>(`${this.baseUrl}/${id}`);
    });
  }

  createPost(data: NewPostData) {
    const body = new FormData();
    body.set('content', data.content);
    body.set('published', `${data.published}`);
    body.set('title', data.content.split(' ')[0]);
    if (data.image) body.set('image', data.image);
    if (data.imagedata) {
      Object.entries(data.imagedata).forEach(([k, v]) => body.set(`imagedata[${k}]`, `${v}`));
    }
    return this._http
      .post<Post>(this.baseUrl, body, { reportProgress: true, observe: 'events' })
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.Response && event.body) {
            const createdPost = event.body;
            this.list.update((posts) => [createdPost, ...posts]);
          }
        }),
      );
  }

  deletePost(id: Post['id']) {
    return this._http
      .delete(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this.list.update((posts) => posts.filter((post) => post.id !== id))));
  }

  unvote(id: Post['id']) {
    return this._http
      .post<Post>(`${this.baseUrl}/${id}/unvote`, null)
      .pipe(tap(this._updatePostIfExist.bind(this)));
  }

  upvote(id: Post['id']) {
    return this._http
      .post<Post>(`${this.baseUrl}/${id}/upvote`, null)
      .pipe(tap(this._updatePostIfExist.bind(this)));
  }

  downvote(id: Post['id']) {
    return this._http
      .post<Post>(`${this.baseUrl}/${id}/downvote`, null)
      .pipe(tap(this._updatePostIfExist.bind(this)));
  }
}
