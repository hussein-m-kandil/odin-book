import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments';
import { NewCommentData } from '../../posts.types';
import { TestBed } from '@angular/core/testing';
import { post } from '../../posts.mock';
import { Comments } from './comments';

const postsUrl = `${environment.apiUrl}/posts`;

const setup = () => {
  TestBed.configureTestingModule({
    providers: [Comments, provideHttpClient(), provideHttpClientTesting()],
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Comments);
  return { service, httpTesting };
};

describe('Comments', () => {
  it('should load nothing if not configured', () => {
    const { service, httpTesting } = setup();
    service.load();
    httpTesting.verify();
    expect(service.list()).toStrictEqual([]);
  });

  it('should load comments if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all comments');
    req.flush(post.comments);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/comments`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.comments);
    httpTesting.verify();
  });

  it('should load more of all comments if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.list.set(post.comments);
    service.load();
    const cursor = String(post.comments.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all comments');
    const comments = post.comments.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(comments);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/comments`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.comments.concat(comments));
    httpTesting.verify();
  });

  it('should create a comment and append it to the list if it belongs to the current post id', async () => {
    const { service, httpTesting } = setup();
    service.config({ postId: post.id });
    service.list.set(post.comments);
    const newCommentData: NewCommentData = { content: 'Blah blah' };
    const comment$ = service.createComment(post.id, newCommentData);
    let resData, resError;
    comment$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${post.id}/comments` };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const createdComment = { ...post.comments[0], id: crypto.randomUUID() };
    req.flush(createdComment);
    expect(req.request.body).toStrictEqual(newCommentData);
    expect(service.list()).toStrictEqual(post.comments.concat(createdComment));
    expect(resData).toStrictEqual(createdComment);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should create a comment but not append it to the list if it is not belong to the current post id', async () => {
    const { service, httpTesting } = setup();
    service.config({ postId: crypto.randomUUID() });
    service.list.set(post.comments);
    const newCommentData: NewCommentData = { content: 'Blah blah' };
    const comment$ = service.createComment(post.id, newCommentData);
    let resData, resError;
    comment$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${post.id}/comments` };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const createdComment = { ...post.comments[0], id: crypto.randomUUID() };
    req.flush(createdComment);
    expect(req.request.body).toStrictEqual(newCommentData);
    expect(service.list()).toStrictEqual(post.comments);
    expect(resData).toStrictEqual(createdComment);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should create a comment but not append it to the list if current post id is not configured', async () => {
    const { service, httpTesting } = setup();
    service.list.set(post.comments);
    const newCommentData: NewCommentData = { content: 'Blah blah' };
    const comment$ = service.createComment(post.id, newCommentData);
    let resData, resError;
    comment$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'POST', url: `${postsUrl}/${post.id}/comments` };
    const req = httpTesting.expectOne(reqInfo, 'Request to upvote a post');
    const createdComment = { ...post.comments[0], id: crypto.randomUUID() };
    req.flush(createdComment);
    expect(req.request.body).toStrictEqual(newCommentData);
    expect(service.list()).toStrictEqual(post.comments);
    expect(resData).toStrictEqual(createdComment);
    expect(resError).toBeUndefined();
    httpTesting.verify();
  });

  it('should delete a comment that exists in the list', async () => {
    const { service, httpTesting } = setup();
    const testComment = post.comments[0];
    service.list.set(post.comments);
    const req$ = service.deleteComment(post.id, testComment.id);
    let resData, resError;
    req$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'DELETE', url: `${postsUrl}/${post.id}/comments/${testComment.id}` };
    const req = httpTesting.expectOne(reqInfo, 'Request to delete a comment');
    req.flush('', { status: 204, statusText: 'No content' });
    expect(service.list()).toStrictEqual(post.comments.slice(1));
    expect(resError).toBeUndefined();
    expect(resData).toEqual('');
    httpTesting.verify();
  });

  it('should delete a comment that does not exist in the list', async () => {
    const { service, httpTesting } = setup();
    const commentList = post.comments.slice(1);
    const testComment = post.comments[0];
    service.list.set(commentList);
    const req$ = service.deleteComment(post.id, testComment.id);
    let resData, resError;
    req$.subscribe({ next: (d) => (resData = d), error: (e) => (resError = e) });
    const reqInfo = { method: 'DELETE', url: `${postsUrl}/${post.id}/comments/${testComment.id}` };
    const req = httpTesting.expectOne(reqInfo, 'Request to delete a comment');
    req.flush('', { status: 204, statusText: 'No content' });
    expect(service.list()).toStrictEqual(commentList);
    expect(resError).toBeUndefined();
    expect(resData).toEqual('');
    httpTesting.verify();
  });
});
