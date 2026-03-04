import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Comment, NewPostData, Post } from './posts.types';
import { mergeDistinctBy, sortByDate } from '../utils';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, of, tap } from 'rxjs';
import { environment } from '../../environments';
import { ListStore } from '../list/list-store';
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

  private _listenToSocketEvents(socket: NonNullable<typeof this._auth.socket>) {
    socket.onAny((event, postId?: Post['id'], commentId?: Comment['id']) => {
      if (postId && /^post:/.test(event)) {
        if (event === 'post:deleted') this.syncPost('delete', postId);
        else if (event === 'post:created') this.syncPost('create', postId);
        else if (
          /^post:(updated|(up|down|un)voted)$/.test(event) ||
          (commentId && /^post:comment/.test(event))
        ) {
          this.syncPost('update', postId);
        }
      }
    });
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
    if (this._auth.socket) this._listenToSocketEvents(this._auth.socket);
    this._auth.userUpdated.subscribe(({ socket }) => {
      this.reset();
      this.load();
      this._listenToSocketEvents(socket);
    });
  }

  updatePostLocally(post: Post) {
    this.list.update((posts) => posts.map((p) => (p.id === post.id ? post : p)));
  }

  incrementPostCommentsCount(postId: Post['id'], addedValue: number) {
    this.list.update((posts) =>
      posts.map((post) => {
        const count = post._count.comments + addedValue;
        return post.id === postId
          ? { ...post, _count: { ...post._count, comments: count < 0 ? 0 : count } }
          : post;
      }),
    );
  }

  syncPost(action: 'create' | 'update' | 'delete', postId: Post['id']) {
    switch (action) {
      case 'delete': {
        this.list.update((posts) => posts.filter((p) => p.id !== postId));
        return;
      }
      case 'create':
      case 'update': {
        const posts = this.list();
        if (!posts.length) return this.load();
        const existedPost = posts.some((post) => post.id === postId);
        if ((action === 'create' && existedPost) || (action === 'update' && !existedPost)) return;
        this._http
          .get<Post | null>(`${this.baseUrl}/${postId}`)
          .pipe(catchError(() => of(null)))
          .subscribe((post) => {
            if (post) {
              if (action === 'update') {
                this.updatePostLocally(post);
              } else {
                const following = this._params.get('following');
                const authorId = this._params.get('author');
                if (
                  (following === null || post.author.profile.followedByCurrentUser) &&
                  (authorId === null || authorId === post.authorId)
                ) {
                  this.list.update((posts) => {
                    const mergedPosts = mergeDistinctBy([post], posts, (post) => post.id);
                    return sortByDate(mergedPosts, (post) => post.createdAt);
                  });
                }
              }
            }
          });
        return;
      }
    }
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
      .pipe(tap(this.updatePostLocally.bind(this)));
  }

  upvote(id: Post['id']) {
    return this._http
      .post<Post>(`${this.baseUrl}/${id}/upvote`, null)
      .pipe(tap(this.updatePostLocally.bind(this)));
  }

  downvote(id: Post['id']) {
    return this._http
      .post<Post>(`${this.baseUrl}/${id}/downvote`, null)
      .pipe(tap(this.updatePostLocally.bind(this)));
  }
}
