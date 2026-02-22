import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpParams, HttpResponse, provideHttpClient } from '@angular/common/http';
import { environment } from '../../environments';
import { TestBed } from '@angular/core/testing';
import { NewPostData } from './posts.types';
import { posts } from './posts.mock';
import { Posts } from './posts';

const postsUrl = `${environment.apiUrl}/posts`;

const setup = () => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Posts);
  return { service, httpTesting };
};

describe('Posts', () => {
  it('should load posts', () => {
    const { service, httpTesting } = setup();
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to load posts');
    expect(service.list()).toStrictEqual([]);
    expect(service.hasMore()).toBe(false);
    req.flush(posts);
    expect(req.request.url).toBe(postsUrl);
    expect(service.list()).toStrictEqual(posts);
    expect(service.hasMore()).toBe(true);
    httpTesting.verify();
  });

  it('should load more posts', () => {
    const { service, httpTesting } = setup();
    const newPost = { ...posts[0], id: crypto.randomUUID() };
    service.list.set(posts);
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to load more posts');
    req.flush([newPost]);
    expect(req.request.url).toBe(postsUrl);
    expect(req.request.params.get('cursor')).toBe(String(posts.at(-1)!.order));
    expect(service.list()).toStrictEqual([...posts, newPost]);
    expect(service.hasMore()).toBe(true);
    httpTesting.verify();
  });

  it('should use the given params to load posts', () => {
    const { service, httpTesting } = setup();
    service.setParams(new HttpParams({ fromObject: { following: true } }));
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to load posts');
    expect(service.list()).toStrictEqual([]);
    expect(service.hasMore()).toBe(false);
    req.flush(posts);
    expect(req.request.url).toBe(postsUrl);
    expect(req.request.params.get('following')).toBe('true');
    expect(service.list()).toStrictEqual(posts);
    expect(service.hasMore()).toBe(true);
    httpTesting.verify();
  });

  it('should use the given params to load more posts', () => {
    const { service, httpTesting } = setup();
    const newPost = { ...posts[0], id: crypto.randomUUID() };
    service.setParams(new HttpParams({ fromObject: { following: true } }));
    service.list.set(posts);
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to load more posts');
    req.flush([newPost]);
    expect(req.request.url).toBe(postsUrl);
    expect(req.request.params.get('following')).toBe('true');
    expect(req.request.params.get('cursor')).toBe(String(posts.at(-1)!.order));
    expect(service.list()).toStrictEqual([...posts, newPost]);
    expect(service.hasMore()).toBe(true);
    httpTesting.verify();
  });

  it('should not use the given params to load more posts after resetting the service', () => {
    const { service, httpTesting } = setup();
    const newPost = { ...posts[0], id: crypto.randomUUID() };
    service.setParams(new HttpParams({ fromObject: { following: true } }));
    service.list.set(posts);
    service.reset();
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to load posts');
    req.flush([newPost]);
    expect(req.request.url).toBe(postsUrl);
    expect(req.request.params.get('following')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual([newPost]);
    expect(service.hasMore()).toBe(true);
    httpTesting.verify();
  });

  it('should get a post by id from the current list', () => {
    const { service, httpTesting } = setup();
    const post = posts[1];
    service.list.set(posts);
    const post$ = service.getPost(post.id);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    httpTesting.expectNone(`${postsUrl}/${post.id}`, 'Request to get a post');
    expect(resData).toEqual(post);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should get a post from the backend', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.list.set(posts);
    const post$ = service.getPost(postId);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'GET', url: `${postsUrl}/${postId}` };
    const req = httpTesting.expectOne(reqInfo, 'Request to get a post');
    req.flush(posts[1]);
    expect(resData).toEqual(posts[1]);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should create a text-only, public post', async () => {
    const { service, httpTesting } = setup();
    service.list.set(posts);
    const newPostData: NewPostData = { content: 'Blah blah', published: true };
    const post$ = service.createPost(newPostData);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: postsUrl };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const reqBody = req.request.body as FormData;
    const createdPost = { ...posts[0], id: crypto.randomUUID() };
    req.flush(createdPost);
    expect(reqBody.get('image')).toBeNull();
    expect(reqBody.get('imagedata')).toBeNull();
    expect(reqBody.get('content')).toBe(newPostData.content);
    expect(reqBody.get('published')).toBe(`${newPostData.published}`);
    expect(service.list()).toStrictEqual([createdPost, ...posts]);
    expect(resError).toBeUndefined();
    expect(resData).toBeInstanceOf(HttpResponse);
    expect(resData).toHaveProperty('body', createdPost);
    httpTesting.verify();
  });

  it('should create a text-only, private post', async () => {
    const { service, httpTesting } = setup();
    service.list.set(posts);
    const newPostData: NewPostData = { content: 'Blah blah', published: false };
    const post$ = service.createPost(newPostData);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: postsUrl };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const reqBody = req.request.body as FormData;
    const createdPost = { ...posts[0], id: crypto.randomUUID() };
    req.flush(createdPost);
    expect(reqBody.get('image')).toBeNull();
    expect(reqBody.get('imagedata')).toBeNull();
    expect(reqBody.get('content')).toBe(newPostData.content);
    expect(reqBody.get('published')).toBe(`${newPostData.published}`);
    expect(service.list()).toStrictEqual([createdPost, ...posts]);
    expect(resError).toBeUndefined();
    expect(resData).toBeInstanceOf(HttpResponse);
    expect(resData).toHaveProperty('body', createdPost);
    httpTesting.verify();
  });

  it('should create a post with an image', async () => {
    const { service, httpTesting } = setup();
    service.list.set(posts);
    const newPostData: NewPostData = {
      image: new File([], 'img.png', { type: 'image/png' }),
      imagedata: { xPos: 7, yPos: 7 },
      content: 'Blah blah',
      published: true,
    };
    const post$ = service.createPost(newPostData);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: postsUrl };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const reqBody = req.request.body as FormData;
    const createdPost = { ...posts[0], id: crypto.randomUUID() };
    req.flush(createdPost);
    expect(reqBody.get('content')).toBe(newPostData.content);
    expect(reqBody.get('image')).toStrictEqual(newPostData.image);
    expect(reqBody.get('published')).toBe(`${newPostData.published}`);
    expect(reqBody.get('imagedata[xPos]')).toBe(`${newPostData.imagedata!.xPos}`);
    expect(reqBody.get('imagedata[yPos]')).toBe(`${newPostData.imagedata!.yPos}`);
    expect(service.list()).toStrictEqual([createdPost, ...posts]);
    expect(resError).toBeUndefined();
    expect(resData).toBeInstanceOf(HttpResponse);
    expect(resData).toHaveProperty('body', createdPost);
    httpTesting.verify();
  });

  it('should upvote a post', async () => {
    const { service, httpTesting } = setup();
    const testPost = { ...posts[0], upvotedByCurrentUser: false };
    service.list.set([testPost, ...posts.slice(1)]);
    const post$ = service.upvote(testPost.id);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${testPost.id}/upvote` };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const upvotedPost = { ...testPost, upvotedByCurrentUser: true };
    req.flush(upvotedPost);
    expect(service.list()).toStrictEqual([upvotedPost, ...posts.slice(1)]);
    expect(resData).toEqual(upvotedPost);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should downvote a post', async () => {
    const { service, httpTesting } = setup();
    const testPost = { ...posts[0], downvotedByCurrentUser: false };
    service.list.set([testPost, ...posts.slice(1)]);
    const post$ = service.downvote(testPost.id);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${testPost.id}/downvote` };
    const req = httpTesting.expectOne(reqInfo, 'Request to downvote a post');
    const downvotedPost = { ...testPost, downvotedByCurrentUser: true };
    req.flush(downvotedPost);
    expect(service.list()).toStrictEqual([downvotedPost, ...posts.slice(1)]);
    expect(resData).toEqual(downvotedPost);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should unvote a post', async () => {
    const { service, httpTesting } = setup();
    const testPost = { ...posts[0], upvotedByCurrentUser: true };
    service.list.set([testPost, ...posts.slice(1)]);
    const post$ = service.unvote(testPost.id);
    let resData, resError;
    post$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${testPost.id}/unvote` };
    const req = httpTesting.expectOne(reqInfo, 'Request to unvote a post');
    const unvotedPost = { ...testPost, upvotedByCurrentUser: false };
    req.flush(unvotedPost);
    expect(service.list()).toStrictEqual([unvotedPost, ...posts.slice(1)]);
    expect(resData).toEqual(unvotedPost);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });
});
